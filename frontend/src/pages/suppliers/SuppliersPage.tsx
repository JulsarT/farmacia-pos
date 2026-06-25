import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, Edit3, Trash2, Building2, Phone, Mail, FileText, Loader2, X, Save } from 'lucide-react'
import api from '../../services/api'
import toast from 'react-hot-toast'

export default function SuppliersPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  
  const [modalOpen, setModalOpen] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<any>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['suppliers', search, page],
    queryFn: () => api.get('/suppliers', { params: { search: search || undefined, page, limit: 15 } }).then(r => r.data),
    placeholderData: (prev) => prev,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/suppliers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
      toast.success('Proveedor eliminado')
    },
  })

  const suppliers = data?.data ?? []

  const handleEdit = (s: any) => { setEditingSupplier(s); setModalOpen(true) }
  const handleNew = () => { setEditingSupplier(null); setModalOpen(true) }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Proveedores</h2>
          <p className="page-subtitle">Gestión de proveedores y laboratorios asociados</p>
        </div>
        <button className="btn btn-primary" onClick={handleNew}>
          <Plus size={16} /> Nuevo Proveedor
        </button>
      </div>

      <div className="card" style={{ padding: '16px 20px', marginBottom: 16 }}>
        <div style={{ position: 'relative', maxWidth: 400 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-400)' }} />
          <input
            className="input"
            style={{ paddingLeft: 38 }}
            placeholder="Buscar por nombre, NIT, contacto..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          />
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <Loader2 size={36} color="var(--primary)" style={{ animation: 'spin 1s linear infinite' }} />
          </div>
        ) : suppliers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-400)' }}>
            <Building2 size={48} style={{ opacity: 0.3, marginBottom: 12 }} />
            <p>No se encontraron proveedores</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-800)' }}>
                {['Razón Social', 'NIT', 'Contacto', 'Teléfono', 'Email', 'Acciones'].map((h) => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-400)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {suppliers.map((s: any) => (
                <tr key={s.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{s.name}</div>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 13, fontFamily: 'monospace' }}>{s.nit || '-'}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-300)' }}>{s.contactName || '-'}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13 }}>
                    {s.phone && <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Phone size={12} color="var(--text-400)"/>{s.phone}</div>}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 13 }}>
                    {s.email && <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Mail size={12} color="var(--text-400)"/>{s.email}</div>}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-ghost" style={{ padding: '6px 10px' }} onClick={() => handleEdit(s)}>
                        <Edit3 size={14} />
                      </button>
                      <button className="btn btn-ghost" style={{ padding: '6px 10px', color: 'var(--danger)' }}
                        onClick={() => { if (confirm(`¿Eliminar proveedor ${s.name}?`)) deleteMutation.mutate(s.id) }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <SupplierModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        supplier={editingSupplier}
        onSaved={() => {
          queryClient.invalidateQueries({ queryKey: ['suppliers'] })
          setModalOpen(false)
        }}
      />
    </div>
  )
}

function SupplierModal({ open, onClose, supplier, onSaved }: { open: boolean, onClose: () => void, supplier: any, onSaved: () => void }) {
  const [form, setForm] = useState({ name: '', nit: '', contactName: '', phone: '', email: '', address: '' })
  
  useEffect(() => {
    if (supplier) setForm({ name: supplier.name || '', nit: supplier.nit || '', contactName: supplier.contactName || '', phone: supplier.phone || '', email: supplier.email || '', address: supplier.address || '' })
    else setForm({ name: '', nit: '', contactName: '', phone: '', email: '', address: '' })
  }, [supplier, open])

  const mutation = useMutation({
    mutationFn: (data: any) => supplier ? api.put(`/suppliers/${supplier.id}`, data) : api.post('/suppliers', data),
    onSuccess: () => { toast.success('Guardado correctamente'); onSaved() },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Error al guardar'),
  })

  if (!open) return null

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="card" style={{ width: 500, animation: 'slideUp 0.2s ease' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Building2 size={20} color="var(--primary)" />
            <h3 style={{ margin: 0, fontSize: 18 }}>{supplier ? 'Editar Proveedor' : 'Nuevo Proveedor'}</h3>
          </div>
          <button className="btn btn-ghost" style={{ padding: '6px' }} onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(form) }} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div><label style={{ fontSize: 12, color: 'var(--text-300)', marginBottom: 4, display: 'block' }}>Razón Social *</label><input className="input" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></div>
            <div><label style={{ fontSize: 12, color: 'var(--text-300)', marginBottom: 4, display: 'block' }}>NIT</label><input className="input" value={form.nit} onChange={e => setForm({...form, nit: e.target.value})} /></div>
          </div>
          <div><label style={{ fontSize: 12, color: 'var(--text-300)', marginBottom: 4, display: 'block' }}>Nombre de Contacto</label><input className="input" value={form.contactName} onChange={e => setForm({...form, contactName: e.target.value})} /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div><label style={{ fontSize: 12, color: 'var(--text-300)', marginBottom: 4, display: 'block' }}>Teléfono</label><input className="input" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} /></div>
            <div><label style={{ fontSize: 12, color: 'var(--text-300)', marginBottom: 4, display: 'block' }}>Email</label><input className="input" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} /></div>
          </div>
          <div><label style={{ fontSize: 12, color: 'var(--text-300)', marginBottom: 4, display: 'block' }}>Dirección</label><textarea className="input" value={form.address} onChange={e => setForm({...form, address: e.target.value})} /></div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={mutation.isPending}>
              {mutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
