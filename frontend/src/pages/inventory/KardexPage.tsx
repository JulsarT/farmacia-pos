import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, History, ArrowUpRight, ArrowDownRight, Package, AlertCircle, Save, Loader2, Info } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../services/api'
import { useAuthStore } from '../../store/authStore'

export default function KardexPage() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null)
  
  const [adjustOpen, setAdjustOpen] = useState(false)
  const [adjustForm, setAdjustForm] = useState({ type: 'ENTRADA', quantity: '', reason: '', notes: '' })

  const { data: searchResults = [] } = useQuery({
    queryKey: ['products-search', search],
    queryFn: () => api.get('/products', { params: { search, limit: 10 } }).then(r => r.data.data),
    enabled: search.length >= 2,
  })

  const { data: kardexData, isLoading: loadingKardex } = useQuery({
    queryKey: ['kardex', selectedProductId],
    queryFn: () => api.get(`/inventory/kardex/${selectedProductId}`).then(r => r.data),
    enabled: !!selectedProductId,
  })

  const product = kardexData?.product
  const movements = kardexData?.data ?? []

  const adjustMutation = useMutation({
    mutationFn: () => api.post('/inventory/adjust', {
      productId: selectedProductId,
      userId: user?.id,
      adjustType: adjustForm.type,
      quantity: Number(adjustForm.quantity),
      reason: adjustForm.reason,
      notes: adjustForm.notes,
    }),
    onSuccess: () => {
      toast.success('Ajuste de inventario registrado')
      queryClient.invalidateQueries({ queryKey: ['kardex'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      setAdjustOpen(false)
      setAdjustForm({ type: 'ENTRADA', quantity: '', reason: '', notes: '' })
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Error al ajustar')
  })

  const handleAdjust = (e: React.FormEvent) => {
    e.preventDefault()
    if (!adjustForm.quantity || Number(adjustForm.quantity) <= 0) return toast.error('Cantidad inválida')
    if (!adjustForm.reason) return toast.error('El motivo es obligatorio')
    adjustMutation.mutate()
  }

  return (
    <div style={{ display: 'flex', gap: 24, height: '100%', alignItems: 'flex-start' }}>
      
      {/* Panel Izquierdo: Buscador de Producto */}
      <div className="card" style={{ width: 350, padding: 20, flexShrink: 0, height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
        <h3 style={{ fontSize: 16, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <History size={18} color="var(--primary)" /> Consultar Kárdex
        </h3>
        <div style={{ position: 'relative', marginBottom: 16 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-400)' }} />
          <input className="input" style={{ paddingLeft: 38 }} placeholder="Buscar producto..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {search.length >= 2 ? (
            searchResults.length === 0 ? <p style={{ fontSize: 13, color: 'var(--text-400)', textAlign: 'center' }}>Sin resultados</p> :
            searchResults.map((p: any) => (
              <button key={p.id} onClick={() => setSelectedProductId(p.id)}
                style={{ width: '100%', textAlign: 'left', padding: '12px', background: selectedProductId === p.id ? 'var(--primary-glow)' : 'transparent', border: '1px solid', borderColor: selectedProductId === p.id ? 'var(--primary)' : 'var(--border)', borderRadius: 8, cursor: 'pointer', marginBottom: 8, transition: 'all 0.2s' }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: selectedProductId === p.id ? 'var(--primary-light)' : 'var(--text-100)' }}>{p.commercialName}</div>
                <div style={{ fontSize: 11, color: 'var(--text-400)', marginTop: 4 }}>{p.genericName}</div>
                <div style={{ fontSize: 11, color: 'var(--text-400)', marginTop: 4, fontWeight: 500 }}>Stock: {p.currentStock}</div>
              </button>
            ))
          ) : (
            <div style={{ textAlign: 'center', padding: 40, opacity: 0.5 }}>
              <Package size={40} style={{ marginBottom: 12, color: 'var(--text-400)' }} />
              <p style={{ fontSize: 13, color: 'var(--text-400)' }}>Busca y selecciona un producto para ver su kárdex</p>
            </div>
          )}
        </div>
      </div>

      {/* Panel Derecho: Detalles del Kárdex */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)' }}>
        {!selectedProductId ? (
          <div className="card" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: 'var(--text-400)' }}>
            <History size={64} style={{ opacity: 0.2, marginBottom: 16 }} />
            <h2 style={{ fontSize: 18, fontWeight: 500 }}>Kárdex de Inventario</h2>
            <p style={{ fontSize: 14 }}>Selecciona un producto para visualizar sus movimientos históricos</p>
          </div>
        ) : loadingKardex ? (
          <div className="card" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Loader2 size={40} className="animate-spin" color="var(--primary)" />
          </div>
        ) : (
          <>
            {/* Cabecera del Producto */}
            <div className="card" style={{ padding: '20px 24px', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: 'var(--text-100)' }}>{product?.commercialName}</h2>
                <p style={{ fontSize: 13, color: 'var(--text-400)', margin: '4px 0 0' }}>{product?.genericName}</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-400)', fontWeight: 600, textTransform: 'uppercase' }}>Stock Actual</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--primary-light)', fontFamily: 'monospace' }}>{product?.currentStock}</div>
                </div>
                <button className="btn btn-primary" onClick={() => setAdjustOpen(true)}>
                  Ajuste Manual
                </button>
              </div>
            </div>

            {/* Tabla de Movimientos */}
            <div className="card" style={{ padding: 0, flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg-800)' }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>Historial de Movimientos</h3>
              </div>
              <div style={{ flex: 1, overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-800)', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0 }}>
                      <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, color: 'var(--text-400)' }}>Fecha</th>
                      <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, color: 'var(--text-400)' }}>Tipo de Movimiento</th>
                      <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, color: 'var(--text-400)' }}>Detalle / Ref.</th>
                      <th style={{ padding: '10px 16px', textAlign: 'right', fontSize: 11, color: 'var(--text-400)' }}>Stock Ant.</th>
                      <th style={{ padding: '10px 16px', textAlign: 'right', fontSize: 11, color: 'var(--text-400)' }}>Cant.</th>
                      <th style={{ padding: '10px 16px', textAlign: 'right', fontSize: 11, color: 'var(--text-400)' }}>Stock Act.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movements.length === 0 ? (
                      <tr><td colSpan={6} style={{ padding: 40, textAlign: 'center', color: 'var(--text-400)' }}>Sin movimientos registrados</td></tr>
                    ) : movements.map((m: any) => {
                      const isEntry = m.movementType.includes('ENTRADA') || m.movementType.includes('AJUSTE_ENTRADA')
                      const isExit = m.movementType.includes('SALIDA') || m.movementType.includes('AJUSTE_SALIDA')
                      
                      return (
                        <tr key={m.id} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text-300)' }}>
                            {new Date(m.createdAt).toLocaleString('es-BO')}
                          </td>
                          <td style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              {isEntry ? <ArrowDownRight size={14} color="var(--success)" /> : <ArrowUpRight size={14} color="var(--danger)" />}
                              <span style={{ color: isEntry ? 'var(--success)' : isExit ? 'var(--danger)' : 'var(--text-100)' }}>
                                {m.movementType.replace(/_/g, ' ')}
                              </span>
                            </div>
                          </td>
                          <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text-300)' }}>
                            {m.notes || m.referenceId || '-'}
                            {m.lotNumber && <div style={{ fontSize: 10, color: 'var(--text-500)' }}>Lote: {m.lotNumber}</div>}
                          </td>
                          <td style={{ padding: '12px 16px', textAlign: 'right', fontSize: 13, fontFamily: 'monospace' }}>{m.previousStock}</td>
                          <td style={{ padding: '12px 16px', textAlign: 'right', fontSize: 13, fontFamily: 'monospace', color: isEntry ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>
                            {isEntry ? '+' : '-'}{m.quantity}
                          </td>
                          <td style={{ padding: '12px 16px', textAlign: 'right', fontSize: 13, fontFamily: 'monospace', fontWeight: 700 }}>{m.currentStock}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modal de Ajuste */}
      {adjustOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={(e) => { if (e.target === e.currentTarget) setAdjustOpen(false) }}>
          <div className="card" style={{ width: 400, animation: 'slideUp 0.2s ease' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 16 }}>Ajuste Manual de Inventario</h3>
            
            <div className="alert alert-warning mb-4" style={{ fontSize: 12, padding: '10px 12px' }}>
              <Info size={16} /> Los ajustes manuales quedan registrados en auditoría bajo tu usuario.
            </div>

            <form onSubmit={handleAdjust} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label className="form-label">Tipo de Ajuste</label>
                <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                  <label style={{ flex: 1, padding: '10px', background: adjustForm.type === 'ENTRADA' ? 'rgba(16,185,129,0.1)' : 'var(--bg-800)', border: `1px solid ${adjustForm.type === 'ENTRADA' ? 'var(--success)' : 'var(--border)'}`, borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input type="radio" checked={adjustForm.type === 'ENTRADA'} onChange={() => setAdjustForm({...adjustForm, type: 'ENTRADA'})} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: adjustForm.type === 'ENTRADA' ? 'var(--success)' : 'var(--text-300)' }}>Entrada (+)</span>
                  </label>
                  <label style={{ flex: 1, padding: '10px', background: adjustForm.type === 'SALIDA' ? 'rgba(239,68,68,0.1)' : 'var(--bg-800)', border: `1px solid ${adjustForm.type === 'SALIDA' ? 'var(--danger)' : 'var(--border)'}`, borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input type="radio" checked={adjustForm.type === 'SALIDA'} onChange={() => setAdjustForm({...adjustForm, type: 'SALIDA'})} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: adjustForm.type === 'SALIDA' ? 'var(--danger)' : 'var(--text-300)' }}>Salida (-)</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="form-label">Cantidad</label>
                <input type="number" min="1" className="input" required value={adjustForm.quantity} onChange={(e) => setAdjustForm({...adjustForm, quantity: e.target.value})} placeholder="Ej: 5" />
              </div>

              <div>
                <label className="form-label">Motivo (Obligatorio)</label>
                <select className="input" required value={adjustForm.reason} onChange={(e) => setAdjustForm({...adjustForm, reason: e.target.value})}>
                  <option value="">Seleccione un motivo...</option>
                  <option value="Merma por caducidad">Merma por caducidad</option>
                  <option value="Producto dañado/roto">Producto dañado/roto</option>
                  <option value="Sobrante de inventario">Sobrante encontrado en inventario físico</option>
                  <option value="Faltante de inventario">Faltante detectado en inventario físico</option>
                  <option value="Devolución a proveedor">Devolución a proveedor</option>
                  <option value="Muestra médica">Salida por muestra médica / uso interno</option>
                  <option value="Otro">Otro (Especificar en notas)</option>
                </select>
              </div>

              <div>
                <label className="form-label">Notas / Observaciones</label>
                <textarea className="input" rows={2} value={adjustForm.notes} onChange={(e) => setAdjustForm({...adjustForm, notes: e.target.value})} placeholder="Detalles adicionales..." />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setAdjustOpen(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={adjustMutation.isPending}>
                  {adjustMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Registrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
