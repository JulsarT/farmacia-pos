import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, Edit3, Shield, Users, Mail, Loader2, X, Save, Key, Power, PowerOff } from 'lucide-react'
import api from '../../services/api'
import toast from 'react-hot-toast'

export default function UsersPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  
  const [modalOpen, setModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<any>(null)

  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.get('/users').then(r => r.data),
  })

  const toggleActiveMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/users/${id}/toggle-active`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success('Estado del usuario actualizado')
    },
  })

  const filteredUsers = users?.filter((u: any) => 
    u.name.toLowerCase().includes(search.toLowerCase()) || 
    u.email.toLowerCase().includes(search.toLowerCase())
  ) || []

  const handleEdit = (u: any) => { setEditingUser(u); setModalOpen(true) }
  const handleNew = () => { setEditingUser(null); setModalOpen(true) }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Usuarios del Sistema</h2>
          <p className="page-subtitle">Administración de cajeros, farmacéuticos y administradores</p>
        </div>
        <button className="btn btn-primary" onClick={handleNew}>
          <Plus size={16} /> Nuevo Usuario
        </button>
      </div>

      <div className="card" style={{ padding: '16px 20px', marginBottom: 16 }}>
        <div style={{ position: 'relative', maxWidth: 400 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-400)' }} />
          <input
            className="input"
            style={{ paddingLeft: 38 }}
            placeholder="Buscar por nombre o correo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <Loader2 size={36} color="var(--primary)" style={{ animation: 'spin 1s linear infinite' }} />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-400)' }}>
            <Users size={48} style={{ opacity: 0.3, marginBottom: 12 }} />
            <p>No se encontraron usuarios</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-800)' }}>
                {['Usuario', 'Rol', 'Estado', 'Actividad', 'Acciones'].map((h) => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-400)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u: any) => (
                <tr key={u.id} style={{ borderBottom: '1px solid var(--border)', opacity: u.isActive ? 1 : 0.5 }}>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{u.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-400)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                      <Mail size={10} /> {u.email}
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div className={`badge ${u.role === 'ADMIN' ? 'badge-primary' : u.role === 'FARMACEUTICO' ? 'badge-success' : 'badge-ghost'}`}>
                      <Shield size={12} style={{ marginRight: 4 }} /> {u.role}
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    {u.isActive ? (
                      <span style={{ color: 'var(--success)', fontSize: 12, fontWeight: 600 }}>● Activo</span>
                    ) : (
                      <span style={{ color: 'var(--danger)', fontSize: 12, fontWeight: 600 }}>● Inactivo</span>
                    )}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontSize: 12, color: 'var(--text-300)' }}>{u._count?.sales || 0} ventas registradas</div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-ghost" style={{ padding: '6px 10px' }} onClick={() => handleEdit(u)}>
                        <Edit3 size={14} />
                      </button>
                      <button 
                        className="btn btn-ghost" 
                        style={{ padding: '6px 10px', color: u.isActive ? 'var(--danger)' : 'var(--success)' }}
                        onClick={() => { if (confirm(`¿${u.isActive ? 'Desactivar' : 'Activar'} usuario ${u.name}?`)) toggleActiveMutation.mutate(u.id) }}
                        title={u.isActive ? "Desactivar Acceso" : "Permitir Acceso"}
                      >
                        {u.isActive ? <PowerOff size={14} /> : <Power size={14} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <UserModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        user={editingUser}
        onSaved={() => {
          queryClient.invalidateQueries({ queryKey: ['users'] })
          setModalOpen(false)
        }}
      />
    </div>
  )
}

function UserModal({ open, onClose, user, onSaved }: { open: boolean, onClose: () => void, user: any, onSaved: () => void }) {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'CAJERO' })
  
  useEffect(() => {
    if (user) setForm({ name: user.name || '', email: user.email || '', password: '', role: user.role || 'CAJERO' })
    else setForm({ name: '', email: '', password: '', role: 'CAJERO' })
  }, [user, open])

  const mutation = useMutation({
    mutationFn: (data: any) => user ? api.put(`/users/${user.id}`, data) : api.post('/users', data),
    onSuccess: () => { toast.success('Guardado correctamente'); onSaved() },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Error al guardar'),
  })

  if (!open) return null

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="card" style={{ width: 450, animation: 'slideUp 0.2s ease' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Shield size={20} color="var(--primary)" />
            <h3 style={{ margin: 0, fontSize: 18 }}>{user ? 'Editar Usuario' : 'Nuevo Usuario'}</h3>
          </div>
          <button className="btn btn-ghost" style={{ padding: '6px' }} onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(form) }} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          
          <div>
            <label style={{ fontSize: 12, color: 'var(--text-300)', marginBottom: 4, display: 'block' }}>Nombre Completo *</label>
            <input className="input" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
          </div>
          
          <div>
            <label style={{ fontSize: 12, color: 'var(--text-300)', marginBottom: 4, display: 'block' }}>Correo Electrónico (Para Iniciar Sesión) *</label>
            <input className="input" type="email" required value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
          </div>

          <div>
            <label style={{ fontSize: 12, color: 'var(--text-300)', marginBottom: 4, display: 'block' }}>
              <Key size={12} style={{ display: 'inline', marginRight: 4 }} />
              {user ? 'Nueva Contraseña (dejar en blanco para mantener actual)' : 'Contraseña de Acceso *'}
            </label>
            <input className="input" type="password" required={!user} minLength={6} value={form.password} onChange={e => setForm({...form, password: e.target.value})} placeholder={user ? '••••••••' : 'Mínimo 6 caracteres'} />
          </div>

          <div>
            <label style={{ fontSize: 12, color: 'var(--text-300)', marginBottom: 4, display: 'block' }}>Rol del Sistema *</label>
            <select className="input" required value={form.role} onChange={e => setForm({...form, role: e.target.value})}>
              <option value="CAJERO">Cajero (Solo ventas y caja)</option>
              <option value="FARMACEUTICO">Farmacéutico (Ventas, caja e inventario)</option>
              <option value="ADMIN">Administrador (Acceso total)</option>
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={mutation.isPending}>
              {mutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Guardar Usuario
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
