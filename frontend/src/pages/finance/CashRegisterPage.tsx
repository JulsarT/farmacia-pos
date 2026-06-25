import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Wallet, LogIn, LogOut, ArrowRightLeft, Loader2, Save, FileText } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../services/api'
import { useAuthStore } from '../../store/authStore'

export default function CashRegisterPage() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  
  const [amount, setAmount] = useState('')
  const [notes, setNotes] = useState('')
  const [moveType, setMoveType] = useState<'INGRESO'|'EGRESO'>('INGRESO')

  const { data: activeRegister, isLoading } = useQuery({
    queryKey: ['active-register', user?.id],
    queryFn: () => api.get(`/finance/cash-register/active/${user?.id}`).then(r => r.data),
    enabled: !!user?.id,
  })

  const openMutation = useMutation({
    mutationFn: () => api.post('/finance/cash-register/open', { userId: user?.id, openingAmount: Number(amount), notes }),
    onSuccess: () => { toast.success('Caja abierta exitosamente'); queryClient.invalidateQueries({ queryKey: ['active-register'] }); setAmount(''); setNotes('') },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Error al abrir caja')
  })

  const closeMutation = useMutation({
    mutationFn: () => api.post(`/finance/cash-register/${activeRegister?.id}/close`, { closingAmount: Number(amount), notes }),
    onSuccess: () => { toast.success('Caja cerrada exitosamente'); queryClient.invalidateQueries({ queryKey: ['active-register'] }); setAmount(''); setNotes('') },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Error al cerrar caja')
  })

  const moveMutation = useMutation({
    mutationFn: () => api.post(`/finance/cash-register/${activeRegister?.id}/movement`, { type: moveType, amount: Number(amount), description: notes }),
    onSuccess: () => { toast.success('Movimiento registrado'); queryClient.invalidateQueries({ queryKey: ['active-register'] }); setAmount(''); setNotes('') },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Error al registrar')
  })

  if (isLoading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Loader2 size={40} className="animate-spin" color="var(--primary)" /></div>

  const handleAction = (action: 'open' | 'close' | 'move') => {
    if (!amount || Number(amount) < 0) return toast.error('Monto inválido')
    if (action === 'open') openMutation.mutate()
    if (action === 'close') closeMutation.mutate()
    if (action === 'move') {
      if (!notes) return toast.error('Descripción obligatoria para movimientos')
      moveMutation.mutate()
    }
  }

  // Cálculos de la caja activa
  const movements = activeRegister?.movements || []
  const expected = movements.reduce((s: number, m: any) => s + Number(m.amount), 0)
  const salesCash = movements.filter((m: any) => m.type === 'VENTA').reduce((s: number, m: any) => s + Number(m.amount), 0)

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      <div className="page-header" style={{ marginBottom: 24 }}>
        <div>
          <h2 className="page-title">Caja y Finanzas</h2>
          <p className="page-subtitle">Control de apertura, cierre y arqueo diario</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <span style={{ fontSize: 13, color: 'var(--text-400)' }}>Usuario actual:</span>
          <div className="badge badge-primary">{user?.name}</div>
        </div>
      </div>

      {!activeRegister ? (
        <div className="card" style={{ maxWidth: 450, margin: '40px auto', padding: 30, textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: 'var(--primary)' }}>
            <Wallet size={32} />
          </div>
          <h3 style={{ fontSize: 20, marginBottom: 8 }}>Abrir Caja</h3>
          <p style={{ fontSize: 14, color: 'var(--text-400)', marginBottom: 24 }}>Inicia tu turno registrando el monto base en efectivo.</p>

          <div style={{ textAlign: 'left' }}>
            <label className="form-label">Monto de Apertura (Bs.)</label>
            <input type="number" min="0" step="0.5" className="input" style={{ fontSize: 24, textAlign: 'center', fontWeight: 700, marginBottom: 16 }} value={amount} onChange={e => setAmount(e.target.value)} autoFocus />
            <label className="form-label">Observaciones</label>
            <textarea className="input" rows={2} style={{ marginBottom: 24 }} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Ej: 5 billetes de 10, 10 monedas de 5..." />
            
            <button className="btn btn-primary" style={{ width: '100%', padding: 14, fontSize: 16 }} onClick={() => handleAction('open')} disabled={openMutation.isPending}>
              {openMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : <LogIn size={18} />} Aperturar Caja
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: 24 }}>
          
          {/* Columna Izquierda: Resumen y Movimientos */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div className="card" style={{ padding: 24, background: 'linear-gradient(135deg, var(--bg-800), var(--bg-900))', border: '1px solid var(--border)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', right: -20, top: -20, opacity: 0.05, transform: 'scale(2)' }}><Wallet size={120} /></div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, position: 'relative' }}>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--success)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--success)', display: 'inline-block', boxShadow: '0 0 8px var(--success)' }}></span> CAJA ABIERTA</div>
                  <div style={{ fontSize: 13, color: 'var(--text-400)' }}>Aperturada: {new Date(activeRegister.openedAt).toLocaleString('es-BO')}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-400)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Total Esperado en Efectivo</div>
                  <div style={{ fontSize: 32, fontWeight: 800, fontFamily: 'monospace', color: 'white' }}>Bs. {expected.toFixed(2)}</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                <div style={{ background: 'var(--bg-700)', padding: 16, borderRadius: 12 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-400)', marginBottom: 4 }}>Apertura</div>
                  <div style={{ fontSize: 18, fontWeight: 700, fontFamily: 'monospace' }}>Bs. {Number(activeRegister.openingAmount).toFixed(2)}</div>
                </div>
                <div style={{ background: 'var(--bg-700)', padding: 16, borderRadius: 12 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-400)', marginBottom: 4 }}>Ventas en Efectivo</div>
                  <div style={{ fontSize: 18, fontWeight: 700, fontFamily: 'monospace', color: 'var(--success)' }}>+Bs. {salesCash.toFixed(2)}</div>
                </div>
                <div style={{ background: 'var(--bg-700)', padding: 16, borderRadius: 12 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-400)', marginBottom: 4 }}>Total de Movimientos</div>
                  <div style={{ fontSize: 18, fontWeight: 700, fontFamily: 'monospace' }}>{movements.length} trans.</div>
                </div>
              </div>
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: 16, margin: 0 }}>Historial de Transacciones (Turno actual)</h3>
                <button className="btn btn-ghost" style={{ fontSize: 12 }}><FileText size={14} /> Imprimir</button>
              </div>
              <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-800)', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0 }}>
                      <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, color: 'var(--text-400)' }}>Hora</th>
                      <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, color: 'var(--text-400)' }}>Tipo</th>
                      <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, color: 'var(--text-400)' }}>Descripción</th>
                      <th style={{ padding: '10px 16px', textAlign: 'right', fontSize: 11, color: 'var(--text-400)' }}>Monto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movements.map((m: any) => (
                      <tr key={m.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text-300)' }}>{new Date(m.createdAt).toLocaleTimeString('es-BO')}</td>
                        <td style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600 }}>{m.type}</td>
                        <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text-300)' }}>{m.description}</td>
                        <td style={{ padding: '12px 16px', textAlign: 'right', fontSize: 13, fontFamily: 'monospace', color: Number(m.amount) > 0 ? 'var(--success)' : 'var(--danger)', fontWeight: 700 }}>
                          {Number(m.amount) > 0 ? '+' : ''}{Number(m.amount).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Columna Derecha: Acciones (Cierre y Ajustes) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            
            {/* Realizar Cierre */}
            <div className="card" style={{ padding: 24 }}>
              <h3 style={{ fontSize: 16, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--danger)' }}><LogOut size={18} /> Cerrar Caja (Arqueo)</h3>
              <p style={{ fontSize: 12, color: 'var(--text-400)', marginBottom: 16 }}>Cuenta el dinero físico en caja e ingrésalo aquí. El sistema calculará la diferencia.</p>
              
              <label className="form-label">Efectivo Real Contado (Bs.)</label>
              <input type="number" min="0" step="0.5" className="input" style={{ fontSize: 24, textAlign: 'center', fontWeight: 700, marginBottom: 16 }} value={amount} onChange={e => setAmount(e.target.value)} />
              
              {amount && (
                <div style={{ padding: 12, borderRadius: 8, marginBottom: 16, background: (Number(amount) - expected) === 0 ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)' }}>
                  <div style={{ fontSize: 12, color: 'var(--text-400)', marginBottom: 4 }}>Diferencia:</div>
                  <div style={{ fontSize: 18, fontWeight: 700, fontFamily: 'monospace', color: (Number(amount) - expected) === 0 ? 'var(--success)' : 'var(--danger)' }}>
                    {(Number(amount) - expected) > 0 ? '+' : ''}{(Number(amount) - expected).toFixed(2)} Bs.
                  </div>
                </div>
              )}

              <label className="form-label">Observaciones / Motivo de descuadre</label>
              <textarea className="input" rows={2} style={{ marginBottom: 16 }} value={notes} onChange={e => setNotes(e.target.value)} />
              
              <button className="btn btn-ghost" style={{ width: '100%', padding: 12, color: 'var(--danger)', border: '1px solid var(--danger)' }} onClick={() => handleAction('close')} disabled={closeMutation.isPending}>
                {closeMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : 'Realizar Cierre de Caja'}
              </button>
            </div>

            {/* Ingreso/Egreso Manual */}
            <div className="card" style={{ padding: 24 }}>
              <h3 style={{ fontSize: 16, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}><ArrowRightLeft size={18} color="var(--primary)" /> Movimiento de Caja</h3>
              
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <button className={`btn ${moveType === 'INGRESO' ? 'btn-primary' : 'btn-ghost'}`} style={{ flex: 1 }} onClick={() => setMoveType('INGRESO')}>Ingreso</button>
                <button className={`btn ${moveType === 'EGRESO' ? 'btn-primary' : 'btn-ghost'}`} style={{ flex: 1 }} onClick={() => setMoveType('EGRESO')}>Egreso</button>
              </div>

              <label className="form-label">Monto (Bs.)</label>
              <input type="number" min="0" step="0.5" className="input" style={{ marginBottom: 12 }} value={amount} onChange={e => setAmount(e.target.value)} />
              
              <label className="form-label">Descripción</label>
              <input type="text" className="input" style={{ marginBottom: 16 }} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Ej: Pago de servicios, Sencillo..." />
              
              <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => handleAction('move')} disabled={moveMutation.isPending}>
                Registrar Movimiento
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  )
}
