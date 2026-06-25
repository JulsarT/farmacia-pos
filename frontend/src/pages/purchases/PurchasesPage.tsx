import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, FileText, ChevronLeft, Calendar, Building2, Package, Trash2, Save, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../services/api'
import { useAuthStore } from '../../store/authStore'

export default function PurchasesPage() {
  const [view, setView] = useState<'list' | 'new'>('list')
  return view === 'list' ? <PurchasesList onNew={() => setView('new')} /> : <NewPurchase onBack={() => setView('list')} />
}

function PurchasesList({ onNew }: { onNew: () => void }) {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['purchases', search, page],
    queryFn: () => api.get('/purchases', { params: { search: search || undefined, page, limit: 15 } }).then(r => r.data),
    placeholderData: (prev) => prev,
  })
  const purchases = data?.data ?? []

  return (
    <div>
      <div className="page-header">
        <div><h2 className="page-title">Compras</h2><p className="page-subtitle">Historial de compras y recepción de mercadería</p></div>
        <button className="btn btn-primary" onClick={onNew}><Plus size={16} /> Registrar Compra</button>
      </div>
      <div className="card" style={{ padding: '16px 20px', marginBottom: 16 }}>
        <div style={{ position: 'relative', maxWidth: 400 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-400)' }} />
          <input className="input" style={{ paddingLeft: 38 }} placeholder="Buscar por N° Compra o Factura..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
        </div>
      </div>
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: 60 }}><Loader2 size={36} color="var(--primary)" className="animate-spin" /></div>
        ) : purchases.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-400)' }}><FileText size={48} style={{ opacity: 0.3, marginBottom: 12 }} /><p>No hay compras registradas</p></div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-800)' }}>
                {['N° Compra', 'Fecha', 'Proveedor', 'Factura', 'Estado Pago', 'Total'].map((h) => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-400)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {purchases.map((p: any) => (
                <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 600, fontFamily: 'monospace' }}>{p.purchaseNumber}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-300)' }}>{new Date(p.createdAt).toLocaleDateString()}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 500 }}>{p.supplier?.name}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-300)' }}>{p.invoiceNumber || '-'}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span className={`badge ${p.accountsPayable?.isPaid ? 'badge-success' : 'badge-warning'}`}>
                      {p.accountsPayable?.isPaid ? 'PAGADA' : 'PENDIENTE'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', fontWeight: 700, fontFamily: 'monospace' }}>Bs. {Number(p.total).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

function NewPurchase({ onBack }: { onBack: () => void }) {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  
  const [supplierId, setSupplierId] = useState('')
  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().slice(0, 10))
  const [amountPaid, setAmountPaid] = useState('')
  
  const [items, setItems] = useState<any[]>([])
  const [search, setSearch] = useState('')
  
  const { data: suppliers = [] } = useQuery({ queryKey: ['suppliers'], queryFn: () => api.get('/suppliers', { params: { limit: 100 } }).then(r => r.data.data) })
  const { data: searchResults = [] } = useQuery({ queryKey: ['products-search', search], queryFn: () => api.get('/products', { params: { search, limit: 10 } }).then(r => r.data.data), enabled: search.length >= 2 })

  const addItem = (product: any) => {
    if (items.find(i => i.productId === product.id)) { toast.error('Producto ya agregado'); return }
    setItems([...items, { productId: product.id, commercialName: product.commercialName, quantity: 1, unitPrice: product.purchasePrice || 0, lotNumber: '', expirationDate: '' }])
    setSearch('')
  }
  
  const updateItem = (idx: number, field: string, val: any) => {
    const newItems = [...items]
    newItems[idx][field] = val
    setItems(newItems)
  }

  const total = items.reduce((s, i) => s + (i.quantity * i.unitPrice), 0)

  const mutation = useMutation({
    mutationFn: () => api.post('/purchases', {
      supplierId, invoiceNumber, invoiceDate, amountPaid: Number(amountPaid) || 0,
      userId: user?.id,
      items: items.map(i => ({ ...i, quantity: Number(i.quantity), unitPrice: Number(i.unitPrice) }))
    }),
    onSuccess: () => {
      toast.success('Compra registrada con éxito')
      queryClient.invalidateQueries({ queryKey: ['purchases'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      onBack()
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Error al registrar')
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!supplierId) return toast.error('Seleccione proveedor')
    if (items.length === 0) return toast.error('Agregue productos a la compra')
    mutation.mutate()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="page-header" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn btn-ghost btn-icon" onClick={onBack}><ChevronLeft size={20} /></button>
          <div><h2 className="page-title">Registrar Compra</h2><p className="page-subtitle">Ingreso de mercadería a inventario</p></div>
        </div>
        <button className="btn btn-primary" onClick={handleSubmit} disabled={mutation.isPending}>
          {mutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          Guardar Compra
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 20, flex: 1, minHeight: 0 }}>
        {/* Panel lateral: Datos generales */}
        <div className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto' }}>
          <h4 style={{ fontSize: 13, color: 'var(--primary)', textTransform: 'uppercase', marginBottom: 8, borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>Datos Generales</h4>
          
          <div><label className="form-label">Proveedor *</label>
            <select className="input mt-1" value={supplierId} onChange={e => setSupplierId(e.target.value)}>
              <option value="">Seleccionar proveedor...</option>
              {suppliers.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div><label className="form-label">N° de Factura</label><input className="input mt-1" placeholder="Ej: F-12345" value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} /></div>
          <div><label className="form-label">Fecha Factura</label><input type="date" className="input mt-1" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} /></div>

          <h4 style={{ fontSize: 13, color: 'var(--primary)', textTransform: 'uppercase', marginBottom: 8, marginTop: 12, borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>Pagos</h4>
          <div><label className="form-label">Total Compra</label><div style={{ fontSize: 24, fontWeight: 800, fontFamily: 'monospace', color: 'var(--text-100)', marginTop: 4 }}>Bs. {total.toFixed(2)}</div></div>
          <div><label className="form-label">Monto Pagado (Bs.)</label><input type="number" step="0.01" className="input mt-1" placeholder="0.00" value={amountPaid} onChange={e => setAmountPaid(e.target.value)} /></div>
          {total - (Number(amountPaid)||0) > 0 && (
            <div className="alert alert-warning mt-2" style={{ padding: '8px 12px' }}>
              <Building2 size={16} /> <div style={{ fontSize: 12 }}>Se creará una cuenta por pagar de Bs. {(total - (Number(amountPaid)||0)).toFixed(2)}</div>
            </div>
          )}
        </div>

        {/* Panel central: Productos */}
        <div className="card" style={{ padding: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: 16, borderBottom: '1px solid var(--border)', background: 'var(--bg-800)' }}>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-400)' }} />
              <input className="input" style={{ paddingLeft: 38 }} placeholder="Buscar producto para agregar..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            {search.length >= 2 && searchResults.length > 0 && (
              <div style={{ position: 'absolute', background: 'var(--bg-700)', border: '1px solid var(--border)', borderRadius: 8, width: 400, marginTop: 4, zIndex: 10, boxShadow: 'var(--shadow-lg)', maxHeight: 300, overflowY: 'auto' }}>
                {searchResults.map((p: any) => (
                  <button key={p.id} onClick={() => addItem(p)} style={{ width: '100%', textAlign: 'left', padding: '10px 12px', background: 'none', border: 'none', borderBottom: '1px solid var(--border)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-100)' }}>{p.commercialName}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-400)' }}>Stock act: {p.currentStock}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {items.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-400)' }}><Package size={48} style={{ opacity: 0.2, marginBottom: 12 }} /><p>Busque un producto para agregarlo a la compra</p></div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, color: 'var(--text-400)' }}>Producto</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center', fontSize: 11, color: 'var(--text-400)' }}>Cant.</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right', fontSize: 11, color: 'var(--text-400)' }}>P. Compra Unit</th>
                    <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, color: 'var(--text-400)' }}>Lote / Venc. (Opcional)</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right', fontSize: 11, color: 'var(--text-400)' }}>Subtotal</th>
                    <th style={{ padding: '10px 12px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it, idx) => (
                    <tr key={it.productId} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px', fontSize: 13, fontWeight: 500 }}>{it.commercialName}</td>
                      <td style={{ padding: '12px' }}><input type="number" min="1" className="input" style={{ width: 70, textAlign: 'center', padding: '6px' }} value={it.quantity} onChange={e => updateItem(idx, 'quantity', e.target.value)} /></td>
                      <td style={{ padding: '12px' }}><div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}><span style={{ fontSize: 12, color: 'var(--text-400)' }}>Bs.</span><input type="number" min="0" step="0.01" className="input" style={{ width: 90, textAlign: 'right', padding: '6px' }} value={it.unitPrice} onChange={e => updateItem(idx, 'unitPrice', e.target.value)} /></div></td>
                      <td style={{ padding: '12px' }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <input className="input" style={{ width: 100, padding: '6px', fontSize: 11 }} placeholder="N° Lote" value={it.lotNumber} onChange={e => updateItem(idx, 'lotNumber', e.target.value)} />
                          <input type="date" className="input" style={{ width: 120, padding: '6px', fontSize: 11 }} value={it.expirationDate} onChange={e => updateItem(idx, 'expirationDate', e.target.value)} />
                        </div>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right', fontWeight: 700, fontFamily: 'monospace' }}>Bs. {(it.quantity * it.unitPrice).toFixed(2)}</td>
                      <td style={{ padding: '12px' }}><button className="btn btn-ghost" style={{ padding: '6px', color: 'var(--danger)' }} onClick={() => setItems(items.filter((_, i) => i !== idx))}><Trash2 size={14} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
