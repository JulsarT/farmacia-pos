import { useState } from 'react'
import { FileText, Download, Filter, Loader2 } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import api from '../../services/api'
import toast from 'react-hot-toast'

export default function ReportsPage() {
  const [reportType, setReportType] = useState('sales')
  const [dateFrom, setDateFrom] = useState(new Date().toISOString().slice(0, 10))
  const [dateTo, setDateTo] = useState(new Date().toISOString().slice(0, 10))

  const { data, isLoading } = useQuery({
    queryKey: ['reports-data', reportType, dateFrom, dateTo],
    queryFn: () => {
      let endpoint = '/sales'
      if (reportType === 'purchases') endpoint = '/purchases'
      if (reportType === 'kardex') endpoint = '/inventory/kardex/all' // Requiere endpoint que lo consolide (falso por ahora)
      
      return api.get(endpoint, { params: { dateFrom, dateTo, limit: 100 } }).then(r => r.data)
    },
  })

  const results = data?.data || []

  const handleExport = () => {
    toast.success('Descargando reporte en Excel...')
    // En producción aquí se genera el archivo Excel o PDF y se inicia la descarga
  }

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', paddingBottom: 40 }}>
      <div className="page-header" style={{ marginBottom: 24 }}>
        <div>
          <h2 className="page-title">Reportes y Exportaciones</h2>
          <p className="page-subtitle">Consulta de datos consolidados para análisis</p>
        </div>
        <button className="btn btn-primary" onClick={handleExport} disabled={isLoading || results.length === 0}>
          <Download size={16} /> Exportar Excel
        </button>
      </div>

      <div className="card" style={{ padding: 20, marginBottom: 24, display: 'flex', gap: 20, alignItems: 'flex-end' }}>
        <div style={{ flex: 1 }}>
          <label className="form-label">Tipo de Reporte</label>
          <select className="input mt-1" value={reportType} onChange={e => setReportType(e.target.value)}>
            <option value="sales">Ventas Realizadas</option>
            <option value="purchases">Compras a Proveedores</option>
            <option value="kardex">Movimientos de Inventario</option>
          </select>
        </div>
        <div style={{ flex: 1 }}>
          <label className="form-label">Fecha Inicio</label>
          <input type="date" className="input mt-1" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
        </div>
        <div style={{ flex: 1 }}>
          <label className="form-label">Fecha Fin</label>
          <input type="date" className="input mt-1" value={dateTo} onChange={e => setDateTo(e.target.value)} />
        </div>
        <button className="btn btn-ghost" style={{ border: '1px solid var(--border)' }}><Filter size={16} /> Filtrar</button>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Loader2 size={30} className="animate-spin" color="var(--primary)" /></div>
        ) : results.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-400)' }}>
            <FileText size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
            <p>No se encontraron registros para los filtros aplicados</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg-800)', borderBottom: '1px solid var(--border)' }}>
                {reportType === 'sales' && ['N° Venta', 'Fecha', 'Método', 'Estado', 'Total'].map(h => <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, color: 'var(--text-400)' }}>{h}</th>)}
                {reportType === 'purchases' && ['N° Compra', 'Fecha', 'Factura', 'Pago', 'Total'].map(h => <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, color: 'var(--text-400)' }}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {results.slice(0, 20).map((r: any) => (
                <tr key={r.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 600, fontFamily: 'monospace' }}>{r.saleNumber || r.purchaseNumber}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13 }}>{new Date(r.createdAt).toLocaleDateString()}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13 }}>{r.paymentMethod || r.invoiceNumber || '-'}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13 }}>{r.status || 'COMPLETADA'}</td>
                  <td style={{ padding: '12px 16px', fontWeight: 700, fontFamily: 'monospace' }}>Bs. {Number(r.total).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {results.length > 20 && <div style={{ padding: 16, textAlign: 'center', fontSize: 12, color: 'var(--text-400)' }}>Mostrando los primeros 20 resultados. Exporte a Excel para ver el listado completo.</div>}
      </div>
    </div>
  )
}
