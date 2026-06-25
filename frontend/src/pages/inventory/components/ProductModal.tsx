import { useState, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { X, Save, Loader2, Package } from 'lucide-react'
import api from '../../../services/api'

interface Props {
  open: boolean
  onClose: () => void
  product: any | null
  categories: any[]
  laboratories: any[]
  onSaved: () => void
}

const EMPTY: any = {
  barcode: '',
  commercialName: '',
  genericName: '',
  categoryId: '',
  laboratoryId: '',
  pharmaceuticalForm: '',
  concentration: '',
  activeIngredient: '',
  measureUnit: 'UNIDAD',
  description: '',
  purchasePrice: '',
  profitMargin: '',
  salePrice1: '',
  salePrice2: '',
  salePrice3: '',
  minDiscountPrice: '',
  minStock: 5,
  requiresPrescription: false,
}

export default function ProductModal({ open, onClose, product, categories, laboratories, onSaved }: Props) {
  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (product) {
      setForm({
        barcode: product.barcode || '',
        commercialName: product.commercialName || '',
        genericName: product.genericName || '',
        categoryId: product.categoryId || '',
        laboratoryId: product.laboratoryId || '',
        pharmaceuticalForm: product.pharmaceuticalForm || '',
        concentration: product.concentration || '',
        activeIngredient: product.activeIngredient || '',
        measureUnit: product.measureUnit || 'UNIDAD',
        description: product.description || '',
        purchasePrice: product.purchasePrice || '',
        profitMargin: product.profitMargin || '',
        salePrice1: product.salePrice1 || '',
        salePrice2: product.salePrice2 || '',
        salePrice3: product.salePrice3 || '',
        minDiscountPrice: product.minDiscountPrice || '',
        minStock: product.minStock || 5,
        requiresPrescription: product.requiresPrescription || false,
      })
    } else {
      setForm(EMPTY)
    }
    setErrors({})
  }, [product, open])

  // Auto-calc salePrice1
  useEffect(() => {
    if (form.purchasePrice && form.profitMargin) {
      const price = Number(form.purchasePrice) * (1 + Number(form.profitMargin) / 100)
      setForm((f: any) => ({ ...f, salePrice1: price.toFixed(2) }))
    }
  }, [form.purchasePrice, form.profitMargin])

  const mutation = useMutation({
    mutationFn: (data: any) =>
      product ? api.put(`/products/${product.id}`, data) : api.post('/products', data),
    onSuccess: onSaved,
  })

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.commercialName.trim()) e.commercialName = 'Nombre comercial requerido'
    if (!form.genericName.trim()) e.genericName = 'Nombre genérico requerido'
    if (!form.categoryId) e.categoryId = 'Categoría requerida'
    if (!form.laboratoryId) e.laboratoryId = 'Laboratorio requerido'
    if (!form.pharmaceuticalForm.trim()) e.pharmaceuticalForm = 'Forma farmacéutica requerida'
    if (!form.purchasePrice || Number(form.purchasePrice) <= 0) e.purchasePrice = 'Precio de compra inválido'
    if (!form.salePrice1 || Number(form.salePrice1) <= 0) e.salePrice1 = 'Precio de venta inválido'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    const payload = {
      ...form,
      purchasePrice: Number(form.purchasePrice),
      profitMargin: Number(form.profitMargin || 0),
      salePrice1: Number(form.salePrice1),
      salePrice2: Number(form.salePrice2 || 0),
      salePrice3: Number(form.salePrice3 || 0),
      minDiscountPrice: Number(form.minDiscountPrice || 0),
      minStock: Number(form.minStock || 0),
    }
    mutation.mutate(payload)
  }

  const f = (field: string) => ({
    value: form[field],
    onChange: (e: any) => {
      const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value
      setForm((prev: any) => ({ ...prev, [field]: val }))
    },
  })

  if (!open) return null

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
    }} onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="card" style={{
        width: '100%', maxWidth: 720, maxHeight: '90vh',
        overflow: 'hidden', display: 'flex', flexDirection: 'column',
        animation: 'slideUp 0.2s ease',
      }}>
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Package size={20} color="var(--primary)" />
            <h3 style={{ margin: 0, fontSize: 18 }}>{product ? 'Editar Producto' : 'Nuevo Producto'}</h3>
          </div>
          <button className="btn btn-ghost" style={{ padding: '6px 10px' }} onClick={onClose}><X size={18} /></button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ overflow: 'auto', flex: 1, padding: 24 }}>
          {mutation.isError && (
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '10px 14px', marginBottom: 20, color: 'var(--danger)', fontSize: 13 }}>
              ❌ {(mutation.error as any)?.response?.data?.message || 'Error al guardar el producto'}
            </div>
          )}

          <Section title="Identificación">
            <Grid cols={3}>
              <Field label="Código de Barras" error={errors.barcode}>
                <input className="input" placeholder="EAN-13 o código interno" {...f('barcode')} />
              </Field>
              <Field label="Nombre Comercial *" error={errors.commercialName}>
                <input className="input" placeholder="Ej: Paracetamol 500mg" {...f('commercialName')} />
              </Field>
              <Field label="Nombre Genérico *" error={errors.genericName}>
                <input className="input" placeholder="Ej: Acetaminofén" {...f('genericName')} />
              </Field>
            </Grid>
            <Grid cols={3}>
              <Field label="Categoría *" error={errors.categoryId}>
                <select className="input" {...f('categoryId')}>
                  <option value="">Seleccionar...</option>
                  {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </Field>
              <Field label="Laboratorio *" error={errors.laboratoryId}>
                <select className="input" {...f('laboratoryId')}>
                  <option value="">Seleccionar...</option>
                  {laboratories.map((l: any) => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </Field>
              <Field label="Unidad de Medida">
                <select className="input" {...f('measureUnit')}>
                  {['UNIDAD', 'CAJA', 'FRASCO', 'SOBRE', 'AMPOLLA', 'VIAL', 'BLISTER', 'TABLETA', 'CAPSULA', 'ML', 'GR'].map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </Field>
            </Grid>
            <Grid cols={3}>
              <Field label="Forma Farmacéutica *" error={errors.pharmaceuticalForm}>
                <input className="input" placeholder="Ej: Tabletas, Jarabe..." {...f('pharmaceuticalForm')} />
              </Field>
              <Field label="Concentración">
                <input className="input" placeholder="Ej: 500mg, 10mg/5ml" {...f('concentration')} />
              </Field>
              <Field label="Principio Activo">
                <input className="input" placeholder="Principio activo principal" {...f('activeIngredient')} />
              </Field>
            </Grid>
          </Section>

          <Section title="Precios">
            <Grid cols={4}>
              <Field label="P. Compra (Bs.) *" error={errors.purchasePrice}>
                <input className="input" type="number" step="0.01" min="0" placeholder="0.00" {...f('purchasePrice')} />
              </Field>
              <Field label="Margen (%)">
                <input className="input" type="number" step="0.1" min="0" max="1000" placeholder="0" {...f('profitMargin')} />
              </Field>
              <Field label="P. Venta 1 (Bs.) *" error={errors.salePrice1}>
                <input className="input" type="number" step="0.01" min="0" placeholder="0.00" {...f('salePrice1')} />
              </Field>
              <Field label="P. Límite Descuento (Bs.)">
                <input className="input" type="number" step="0.01" min="0" placeholder="0.00" {...f('minDiscountPrice')} />
              </Field>
            </Grid>
            <Grid cols={2}>
              <Field label="P. Venta 2 - Mayoreo (Bs.)">
                <input className="input" type="number" step="0.01" min="0" placeholder="0.00" {...f('salePrice2')} />
              </Field>
              <Field label="P. Venta 3 - Especial (Bs.)">
                <input className="input" type="number" step="0.01" min="0" placeholder="0.00" {...f('salePrice3')} />
              </Field>
            </Grid>
          </Section>

          <Section title="Stock y Control">
            <Grid cols={2}>
              <Field label="Stock Mínimo (alerta)">
                <input className="input" type="number" min="0" step="1" placeholder="5" {...f('minStock')} />
              </Field>
              <Field label="">
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 26, cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.requiresPrescription} onChange={(e) => setForm((p: any) => ({ ...p, requiresPrescription: e.target.checked }))} />
                  <span style={{ fontSize: 13 }}>Requiere receta médica</span>
                </label>
              </Field>
            </Grid>
            <Field label="Descripción / Notas">
              <textarea className="input" rows={2} placeholder="Observaciones adicionales..." {...f('description')} style={{ resize: 'vertical' }} />
            </Field>
          </Section>
        </form>

        {/* Footer */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={mutation.isPending}
            onClick={handleSubmit}
          >
            {mutation.isPending ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Guardando...</> : <><Save size={16} /> Guardar Producto</>}
          </button>
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <h4 style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--primary)', marginBottom: 14, paddingBottom: 6, borderBottom: '1px solid var(--border)' }}>
        {title}
      </h4>
      {children}
    </div>
  )
}

function Grid({ cols, children }: { cols: number; children: React.ReactNode }) {
  return <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 12, marginBottom: 12 }}>{children}</div>
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      {label && <label style={{ display: 'block', fontSize: 12, fontWeight: 500, marginBottom: 4, color: 'var(--text-300)' }}>{label}</label>}
      {children}
      {error && <p style={{ fontSize: 11, color: 'var(--danger)', marginTop: 3 }}>{error}</p>}
    </div>
  )
}
