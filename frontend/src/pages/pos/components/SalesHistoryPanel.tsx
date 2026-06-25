import { useQuery } from '@tanstack/react-query'
import { X, Receipt, ChevronRight, Loader2, AlertTriangle } from 'lucide-react'
import api from '../../../services/api'

interface Props {
  onClose: () => void
}

export default function SalesHistoryPanel({ onClose }: Props) {
  const today = new Date().toISOString().slice(0, 10)

  const { data, isLoading } = useQuery({
    queryKey: ['sales-history-panel'],
    queryFn: () => api.get('/sales', { params: { dateFrom: today, dateTo: today, limit: 30 } }).then((r) => r.data),
    refetchInterval: 30000,
  })

  const sales = data?.data ?? []

  const statusColors: Record<string, string> = {
    COMPLETADA: 'var(--success)',
    ANULADA: 'var(--danger)',
    PENDIENTE: 'var(--warning)',
  }

  return (
    <div style={{
      width: 380,
      background: 'var(--bg-800)',
      borderLeft: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Receipt size={16} color="var(--primary)" />
          <span style={{ fontWeight: 700, fontSize: 14 }}>Ventas del día</span>
        </div>
        <button className="btn btn-ghost" style={{ padding: '4px 8px' }} onClick={onClose}><X size={16} /></button>
      </div>

      {/* Resumen del día */}
      <DailySummary />

      {/* Lista de ventas */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {isLoading ? (
          <div style={{ padding: 30, textAlign: 'center' }}>
            <Loader2 size={24} color="var(--primary)" style={{ animation: 'spin 1s linear infinite' }} />
          </div>
        ) : sales.length === 0 ? (
          <div style={{ padding: 30, textAlign: 'center', color: 'var(--text-400)', fontSize: 13 }}>
            Sin ventas hoy
          </div>
        ) : (
          sales.map((sale: any) => (
            <div key={sale.id} style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', cursor: 'pointer', transition: 'background 0.1s' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-700)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13, fontFamily: 'monospace' }}>{sale.saleNumber}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-400)', marginTop: 2 }}>
                    {new Date(sale.createdAt).toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' })}
                    {' · '}{sale.paymentMethod}
                    {' · '}{sale.items?.length} producto(s)
                  </div>
                  {sale.customer && (
                    <div style={{ fontSize: 11, color: 'var(--text-400)' }}>{sale.customer.name}</div>
                  )}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700, fontSize: 14, fontFamily: 'monospace' }}>Bs. {Number(sale.total).toFixed(2)}</div>
                  <div style={{ fontSize: 10, fontWeight: 600, color: statusColors[sale.status] ?? 'var(--text-400)', marginTop: 2 }}>
                    {sale.status}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function DailySummary() {
  const { data, isLoading } = useQuery({
    queryKey: ['sales-daily-summary'],
    queryFn: () => api.get('/sales/summary/daily').then((r) => r.data),
    refetchInterval: 60000,
  })

  if (isLoading) return null

  return (
    <div style={{ padding: '12px 16px', background: 'var(--bg-700)', borderBottom: '1px solid var(--border)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {[
          { label: 'Ventas', value: data?.totalSales ?? 0, format: (v: number) => String(v) },
          { label: 'Ingresos', value: data?.totalRevenue ?? 0, format: (v: number) => `Bs. ${v.toFixed(2)}` },
          { label: 'Unidades', value: data?.totalItems ?? 0, format: (v: number) => String(v) },
          { label: 'Ticket Prom.', value: data?.avgTicket ?? 0, format: (v: number) => `Bs. ${v.toFixed(2)}` },
        ].map(({ label, value, format }) => (
          <div key={label} style={{ background: 'var(--bg-800)', borderRadius: 8, padding: '8px 10px' }}>
            <div style={{ fontSize: 10, color: 'var(--text-400)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
            <div style={{ fontSize: 15, fontWeight: 700, marginTop: 2, fontFamily: 'monospace' }}>{format(value)}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
