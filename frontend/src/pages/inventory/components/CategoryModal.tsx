import { useState, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { X, Save, Loader2, Tag } from 'lucide-react'
import api from '../../../services/api'

interface Props {
  open: boolean
  onClose: () => void
  category: any | null
  onSaved: () => void
}

export default function CategoryModal({ open, onClose, category, onSaved }: Props) {
  const [name, setName] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    setName(category?.name || '')
    setError('')
  }, [category, open])

  const mutation = useMutation({
    mutationFn: (data: { name: string }) =>
      category
        ? api.put(`/products/categories/${category.id}`, data)
        : api.post('/products/categories', data),
    onSuccess: onSaved,
    onError: (err: any) => setError(err?.response?.data?.message || 'Error al guardar'),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) { setError('El nombre es requerido'); return }
    mutation.mutate({ name: name.trim() })
  }

  if (!open) return null

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1100, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="card" style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Tag size={18} color="var(--primary)" />
            <h3 style={{ margin: 0, fontSize: 16 }}>{category ? 'Editar Categoría' : 'Nueva Categoría'}</h3>
          </div>
          <button className="btn btn-ghost" style={{ padding: '4px 8px' }} onClick={onClose}><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: 20 }}>
          {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 6, padding: '8px 12px', marginBottom: 14, color: 'var(--danger)', fontSize: 13 }}>{error}</div>}
          <label style={{ display: 'block', fontSize: 12, fontWeight: 500, marginBottom: 6, color: 'var(--text-300)' }}>Nombre de la Categoría *</label>
          <input className="input" placeholder="Ej: Analgésicos, Antibióticos..." value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={mutation.isPending}>
              {mutation.isPending ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={14} />}
              {mutation.isPending ? ' Guardando...' : ' Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
