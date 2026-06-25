import { useQuery } from '@tanstack/react-query'
import { DollarSign, ShoppingCart, AlertTriangle, TrendingUp, Package, Loader2 } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import api from '../../services/api'
import { useAuthStore } from '../../store/authStore'

export default function DashboardPage() {
  const { user } = useAuthStore()

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => api.get('/reports/dashboard').then(r => r.data),
    refetchInterval: 60000,
  })

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
        <Loader2 size={32} className="animate-spin" color="var(--primary)" />
      </div>
    )
  }

  const stats = data || {
    todayRevenue: 0, todaySalesCount: 0,
    monthRevenue: 0, monthSalesCount: 0,
    lowStockProducts: 0,
    pendingPayablesAmount: 0, pendingPayablesCount: 0,
    salesByDay: [], topProducts: []
  }

  const kpis = [
    {
      label: 'Ventas de Hoy',
      value: `Bs. ${stats.todayRevenue.toFixed(2)}`,
      sub: `${stats.todaySalesCount} transacciones`,
      icon: <DollarSign size={18} />,
      variant: 'primary',
    },
    {
      label: 'Ventas del Mes',
      value: `Bs. ${stats.monthRevenue.toFixed(2)}`,
      sub: `${stats.monthSalesCount} transacciones`,
      icon: <TrendingUp size={18} />,
      variant: 'success',
    },
    {
      label: 'Stock Crítico',
      value: stats.lowStockProducts === 0 ? 'Sin alertas' : `${stats.lowStockProducts} productos`,
      sub: 'Por debajo del mínimo',
      icon: <AlertTriangle size={18} />,
      variant: stats.lowStockProducts > 0 ? 'warning' : 'success',
    },
    {
      label: 'Cuentas por Pagar',
      value: `Bs. ${stats.pendingPayablesAmount.toFixed(2)}`,
      sub: `${stats.pendingPayablesCount} facturas pendientes`,
      icon: <ShoppingCart size={18} />,
      variant: 'danger',
    },
  ]

  // Calcular max para barra horizontal de top productos
  const maxQty = Math.max(...(stats.topProducts.map((p: any) => Number(p.quantity)) || [1]), 1)

  return (
    <div style={{ paddingBottom: 32 }}>
      <div className="page-header" style={{ marginBottom: 20 }}>
        <div>
          <h2 className="page-title">Panel de Control</h2>
          <p className="page-subtitle">Resumen operativo de la farmacia</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 20 }}>
        {kpis.map((k, i) => (
          <div key={i} className="stat-card">
            <div className="stat-card-header">
              <div>
                <div className="stat-card-label">{k.label}</div>
                <div className="stat-card-value">{k.value}</div>
              </div>
              <div className={`stat-card-icon ${k.variant}`}>
                {k.icon}
              </div>
            </div>
            <div className="stat-card-change">{k.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
        
        {/* Gráfico de Ventas */}
        <div className="card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <div className="section-label" style={{ marginBottom: 0 }}>Evolución de Ingresos</div>
              <h3 style={{ fontSize: '0.9375rem', marginTop: 2 }}>Últimos 7 días</h3>
            </div>
          </div>
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.salesByDay} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorGreen" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#2D6A4F" stopOpacity={0.12}/>
                    <stop offset="95%" stopColor="#2D6A4F" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="0" stroke="#F3F4F6" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                  tickFormatter={(v) => {
                    const d = new Date(v + 'T12:00:00')
                    return d.toLocaleDateString('es-BO', { weekday: 'short', day: 'numeric' })
                  }}
                  axisLine={false} tickLine={false}
                />
                <YAxis
                  tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
                  axisLine={false} tickLine={false}
                  tickFormatter={(v) => `Bs.${v}`}
                  width={60}
                />
                <Tooltip
                  contentStyle={{
                    background: '#fff', border: '1px solid #E5E7EB',
                    borderRadius: 8, fontSize: 13,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.10)'
                  }}
                  formatter={(v: any) => [`Bs. ${Number(v).toFixed(2)}`, 'Ventas']}
                  labelFormatter={(l) => {
                    const d = new Date(l + 'T12:00:00')
                    return d.toLocaleDateString('es-BO', { weekday: 'long', day: 'numeric', month: 'long' })
                  }}
                />
                <Area
                  type="monotone" dataKey="total"
                  stroke="#2D6A4F" strokeWidth={2}
                  fillOpacity={1} fill="url(#colorGreen)"
                  dot={{ fill: '#2D6A4F', r: 3, strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: '#2D6A4F' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top 5 Productos */}
        <div className="card" style={{ padding: 24 }}>
          <div style={{ marginBottom: 20 }}>
            <div className="section-label" style={{ marginBottom: 0 }}>Más vendidos</div>
            <h3 style={{ fontSize: '0.9375rem', marginTop: 2 }}>Top 5 del mes</h3>
          </div>

          {stats.topProducts.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 220, gap: 12, color: 'var(--text-muted)' }}>
              <Package size={36} style={{ opacity: 0.3 }} />
              <p style={{ fontSize: 13 }}>Sin ventas este mes aún</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {stats.topProducts.map((p: any, i: number) => {
                const pct = Math.round((Number(p.quantity) / maxQty) * 100)
                return (
                  <div key={i} style={{ padding: '10px 0', borderBottom: i < stats.topProducts.length - 1 ? '1px solid #F3F4F6' : 'none' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', maxWidth: '70%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {p.name}
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--primary)', fontVariantNumeric: 'tabular-nums' }}>
                        {p.quantity} uds.
                      </span>
                    </div>
                    <div style={{ height: 8, background: '#F3F4F6', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', width: `${pct}%`,
                        background: 'var(--primary)',
                        borderRadius: 4,
                        transition: 'width 0.6s ease',
                      }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
