import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Settings, Save, Loader2, Store, Printer, Shield } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../services/api'

export default function ConfigPage() {
  const queryClient = useQueryClient()
  
  const { data: configData, isLoading } = useQuery({
    queryKey: ['system-config'],
    queryFn: () => api.get('/config').then(r => r.data)
  })

  const [form, setForm] = useState({
    farmaciaName: '',
    farmaciaAddress: '',
    farmaciaPhone: '',
    farmaciaNit: '',
    ticketHeader: ''
  })

  useEffect(() => {
    if (configData) {
      setForm({
        farmaciaName: configData.farmaciaName || '',
        farmaciaAddress: configData.farmaciaAddress || '',
        farmaciaPhone: configData.farmaciaPhone || '',
        farmaciaNit: configData.farmaciaNit || '',
        ticketHeader: configData.ticketHeader || ''
      })
    }
  }, [configData])

  const mutation = useMutation({
    mutationFn: () => api.put('/config', form),
    onSuccess: () => {
      toast.success('Configuración guardada')
      queryClient.invalidateQueries({ queryKey: ['system-config'] })
    },
    onError: () => toast.error('Error al guardar configuración')
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    mutation.mutate()
  }

  if (isLoading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Loader2 size={40} className="animate-spin" color="var(--primary)" /></div>

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', paddingBottom: 40 }}>
      <div className="page-header" style={{ marginBottom: 24 }}>
        <div>
          <h2 className="page-title">Configuración del Sistema</h2>
          <p className="page-subtitle">Ajustes generales, datos de la empresa e impresión</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        
        {/* Datos de la Empresa */}
        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 16, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}><Store size={18} color="var(--primary)" /> Datos de la Empresa</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Nombre Comercial de la Farmacia</label>
              <input className="input" required value={form.farmaciaName} onChange={e => setForm({...form, farmaciaName: e.target.value})} placeholder="Ej: Farmacia San Juan" />
            </div>
            <div>
              <label className="form-label">NIT / RUC</label>
              <input className="input" value={form.farmaciaNit} onChange={e => setForm({...form, farmaciaNit: e.target.value})} placeholder="Número de Identificación Tributaria" />
            </div>
            <div>
              <label className="form-label">Teléfono / WhatsApp</label>
              <input className="input" value={form.farmaciaPhone} onChange={e => setForm({...form, farmaciaPhone: e.target.value})} placeholder="Ej: +591 70000000" />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Dirección Fiscal / Sucursal Principal</label>
              <input className="input" value={form.farmaciaAddress} onChange={e => setForm({...form, farmaciaAddress: e.target.value})} placeholder="Av. Principal, Zona Central..." />
            </div>
          </div>
        </div>

        {/* Configuración de Impresión */}
        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 16, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}><Printer size={18} color="var(--primary)" /> Tickets y Facturas</h3>
          <div style={{ display: 'grid', gap: 20 }}>
            <div>
              <label className="form-label">Mensaje en Pie de Ticket</label>
              <textarea className="input" rows={2} value={form.ticketHeader} onChange={e => setForm({...form, ticketHeader: e.target.value})} placeholder="¡Gracias por su compra! Vuelva pronto..." />
              <p style={{ fontSize: 11, color: 'var(--text-400)', marginTop: 4 }}>Este mensaje aparecerá al final de todos los tickets generados en el POS.</p>
            </div>
          </div>
        </div>

        {/* Opciones Avanzadas */}
        <div className="card" style={{ padding: 24, border: '1px solid var(--danger)', background: 'rgba(239,68,68,0.02)' }}>
          <h3 style={{ fontSize: 16, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--danger)' }}><Shield size={18} /> Opciones Avanzadas</h3>
          <p style={{ fontSize: 13, color: 'var(--text-300)', marginBottom: 16 }}>Aquí se configurará la integración con SIAT en la siguiente fase.</p>
          <button type="button" className="btn btn-ghost" disabled style={{ opacity: 0.5 }}>Configurar Credenciales SIAT (Próximamente)</button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', position: 'sticky', bottom: 20 }}>
          <button type="submit" className="btn btn-primary" style={{ padding: '12px 24px', fontSize: 15, boxShadow: '0 4px 12px rgba(99,102,241,0.4)' }} disabled={mutation.isPending}>
            {mutation.isPending ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            Guardar Configuración
          </button>
        </div>
      </form>
    </div>
  )
}
