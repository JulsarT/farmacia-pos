import { useState, useEffect } from 'react'
import { DollarSign, QrCode, CreditCard, X, Check, Loader2, Banknote } from 'lucide-react'

interface Props {
  open: boolean
  onClose: () => void
  total: number
  itemCount: number
  customerName?: string
  onConfirm: (data: { paymentMethod: string; amountPaid: number }) => void
  isPending: boolean
}

const QUICK_AMOUNTS = [10, 20, 50, 100, 200, 500]

export default function PaymentModal({ open, onClose, total, itemCount, customerName, onConfirm, isPending }: Props) {
  const [method, setMethod] = useState('EFECTIVO')
  const [amountPaid, setAmountPaid] = useState('')

  useEffect(() => {
    if (open) {
      setMethod('EFECTIVO')
      setAmountPaid(String(total.toFixed(2)))
    }
  }, [open, total])

  const paid = parseFloat(amountPaid) || 0
  const change = paid - total

  const handleSubmit = () => {
    if (method === 'EFECTIVO' && paid < total) return
    onConfirm({ paymentMethod: method, amountPaid: method === 'EFECTIVO' ? paid : total })
  }

  if (!open) return null

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 2000,
      background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={(e) => { if (e.target === e.currentTarget && !isPending) onClose() }}>
      <div className="card" style={{ width: 420, maxHeight: '90vh', overflow: 'auto', animation: 'slideUp 0.2s ease' }}>

        {/* Header */}
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: 0 }}>Cobrar Venta</h3>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--text-400)' }}>
              {itemCount} unidades{customerName ? ` · ${customerName}` : ''}
            </p>
          </div>
          <button className="btn btn-ghost" style={{ padding: '6px' }} onClick={onClose} disabled={isPending}><X size={18} /></button>
        </div>

        <div style={{ padding: 24 }}>
          {/* Total */}
          <div style={{
            background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
            borderRadius: 12, padding: '16px 20px', marginBottom: 20, textAlign: 'center',
            boxShadow: '0 4px 20px rgba(99,102,241,0.4)',
          }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: 4 }}>TOTAL A COBRAR</div>
            <div style={{ fontSize: 36, fontWeight: 800, color: 'white', fontFamily: 'monospace' }}>
              Bs. {total.toFixed(2)}
            </div>
          </div>

          {/* Método de pago */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-400)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 8 }}>
              Forma de Pago
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                { key: 'EFECTIVO', label: 'Efectivo', icon: <Banknote size={18} /> },
                { key: 'QR', label: 'QR Bolivia', icon: <QrCode size={18} /> },
                { key: 'TARJETA', label: 'Tarjeta', icon: <CreditCard size={18} /> },
                { key: 'MIXTO', label: 'Mixto', icon: <DollarSign size={18} /> },
              ].map(({ key, label, icon }) => (
                <button key={key} onClick={() => setMethod(key)}
                  style={{
                    padding: '12px 16px', borderRadius: 10, border: '2px solid',
                    background: method === key ? 'var(--primary-glow)' : 'var(--bg-700)',
                    borderColor: method === key ? 'var(--primary)' : 'var(--border)',
                    color: method === key ? 'var(--primary-light)' : 'var(--text-300)',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                    fontWeight: 600, fontSize: 13, transition: 'all 0.15s',
                  }}>
                  {icon}{label}
                </button>
              ))}
            </div>
          </div>

          {/* Monto recibido (solo efectivo/mixto) */}
          {(method === 'EFECTIVO' || method === 'MIXTO') && (
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-400)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 8 }}>
                Monto Recibido (Bs.)
              </label>
              <input
                type="number" min={total} step="0.50"
                className="input"
                style={{ fontSize: 22, fontWeight: 700, textAlign: 'center', fontFamily: 'monospace', padding: '12px' }}
                value={amountPaid}
                onChange={(e) => setAmountPaid(e.target.value)}
                autoFocus
                onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit() }}
              />
              {/* Quick amounts */}
              <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                {QUICK_AMOUNTS.filter((a) => a >= total || a === Math.ceil(total)).map((a) => (
                  <button key={a} onClick={() => setAmountPaid(String(a))}
                    style={{ padding: '5px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-600)', color: 'var(--text-300)', fontSize: 12, cursor: 'pointer', fontWeight: 600, fontFamily: 'monospace' }}>
                    {a}
                  </button>
                ))}
                <button onClick={() => setAmountPaid(String(total.toFixed(2)))}
                  style={{ padding: '5px 12px', borderRadius: 8, border: '1px solid var(--primary)', background: 'var(--primary-glow)', color: 'var(--primary-light)', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>
                  Exacto
                </button>
              </div>
            </div>
          )}

          {/* Vuelto */}
          {(method === 'EFECTIVO' || method === 'MIXTO') && (
            <div style={{
              padding: '12px 16px', borderRadius: 10, marginBottom: 20,
              background: change >= 0 ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
              border: `1px solid ${change >= 0 ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: change >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                {change >= 0 ? '✅ Vuelto' : '❌ Falta'}
              </span>
              <span style={{ fontSize: 22, fontWeight: 800, fontFamily: 'monospace', color: change >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                Bs. {Math.abs(change).toFixed(2)}
              </span>
            </div>
          )}

          {/* Botones */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose} disabled={isPending}>
              Cancelar
            </button>
            <button
              className="btn btn-success"
              style={{ flex: 2, fontSize: 15, padding: '13px' }}
              onClick={handleSubmit}
              disabled={isPending || (method === 'EFECTIVO' && paid < total)}
            >
              {isPending
                ? <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Procesando...</>
                : <><Check size={18} /> Confirmar Venta</>
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
