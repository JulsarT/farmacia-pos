import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Package, Plus, Search, Edit3, Trash2, ChevronLeft, ChevronRight,
  AlertTriangle, Tag, FlaskConical, X, Save, Loader2
} from 'lucide-react'
import api from '../../services/api'
import ProductModal from './components/ProductModal'
import CategoryModal from './components/CategoryModal'
import LaboratoryModal from './components/LaboratoryModal'

export default function ProductsPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [laboratoryId, setLaboratoryId] = useState('')
  const [page, setPage] = useState(1)
  const [lowStock, setLowStock] = useState(false)
  const [tab, setTab] = useState<'products' | 'categories' | 'laboratories'>('products')

  // Modal states
  const [productModalOpen, setProductModalOpen] = useState(false)
  const [categoryModalOpen, setCategoryModalOpen] = useState(false)
  const [laboratoryModalOpen, setLaboratoryModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<any>(null)
  const [editingCategory, setEditingCategory] = useState<any>(null)
  const [editingLaboratory, setEditingLaboratory] = useState<any>(null)

  // Queries
  const { data: productsData, isLoading: loadingProducts } = useQuery({
    queryKey: ['products', search, categoryId, laboratoryId, page, lowStock],
    queryFn: () =>
      api.get('/products', {
        params: { search: search || undefined, categoryId: categoryId || undefined, laboratoryId: laboratoryId || undefined, page, limit: 15, lowStock: lowStock || undefined },
      }).then((r) => r.data),
    placeholderData: (prev) => prev,
  })

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/products/categories').then((r) => r.data),
  })

  const { data: laboratories = [] } = useQuery({
    queryKey: ['laboratories'],
    queryFn: () => api.get('/products/laboratories').then((r) => r.data),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/products/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] }),
  })

  const deleteCategory = useMutation({
    mutationFn: (id: string) => api.delete(`/products/categories/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] }),
  })

  const deleteLaboratory = useMutation({
    mutationFn: (id: string) => api.delete(`/products/laboratories/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['laboratories'] }),
  })

  const products = productsData?.data ?? []
  const totalPages = productsData?.totalPages ?? 1
  const total = productsData?.total ?? 0

  const handleEditProduct = (p: any) => { setEditingProduct(p); setProductModalOpen(true) }
  const handleNewProduct = () => { setEditingProduct(null); setProductModalOpen(true) }

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h2 className="page-title">Inventario</h2>
          <p className="page-subtitle">Gestión de productos, categorías y laboratorios</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {tab === 'products' && (
            <button className="btn btn-primary" id="btn-new-product" onClick={handleNewProduct}>
              <Plus size={16} /> Nuevo Producto
            </button>
          )}
          {tab === 'categories' && (
            <button className="btn btn-primary" id="btn-new-category" onClick={() => { setEditingCategory(null); setCategoryModalOpen(true) }}>
              <Plus size={16} /> Nueva Categoría
            </button>
          )}
          {tab === 'laboratories' && (
            <button className="btn btn-primary" id="btn-new-laboratory" onClick={() => { setEditingLaboratory(null); setLaboratoryModalOpen(true) }}>
              <Plus size={16} /> Nuevo Laboratorio
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid var(--border)' }}>
        {([
          { key: 'products', label: 'Productos', icon: Package },
          { key: 'categories', label: 'Categorías', icon: Tag },
          { key: 'laboratories', label: 'Laboratorios', icon: FlaskConical },
        ] as const).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            style={{
              padding: '10px 18px',
              background: 'none',
              border: 'none',
              borderBottom: tab === key ? '2px solid var(--primary)' : '2px solid transparent',
              color: tab === key ? 'var(--primary)' : 'var(--text-400)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontWeight: tab === key ? 600 : 400,
              transition: 'all 0.2s',
              fontSize: 14,
            }}
          >
            <Icon size={15} />{label}
          </button>
        ))}
      </div>

      {/* PRODUCTS TAB */}
      {tab === 'products' && (
        <>
          {/* Filters */}
          <div className="card" style={{ padding: '16px 20px', marginBottom: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px 200px auto', gap: 12, alignItems: 'center' }}>
              <div style={{ position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-400)' }} />
                <input
                  id="product-search"
                  className="input"
                  style={{ paddingLeft: 38 }}
                  placeholder="Buscar por nombre, código, genérico..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                />
              </div>
              <select className="input" value={categoryId} onChange={(e) => { setCategoryId(e.target.value); setPage(1) }}>
                <option value="">Todas las categorías</option>
                {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <select className="input" value={laboratoryId} onChange={(e) => { setLaboratoryId(e.target.value); setPage(1) }}>
                <option value="">Todos los laboratorios</option>
                {laboratories.map((l: any) => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-300)', cursor: 'pointer', whiteSpace: 'nowrap', fontSize: 13 }}>
                <input type="checkbox" checked={lowStock} onChange={(e) => { setLowStock(e.target.checked); setPage(1) }} />
                <AlertTriangle size={14} color="var(--warning)" /> Stock bajo
              </label>
            </div>
          </div>

          {/* Table */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {loadingProducts ? (
              <div style={{ textAlign: 'center', padding: 60 }}>
                <Loader2 size={36} color="var(--primary)" style={{ animation: 'spin 1s linear infinite' }} />
                <p className="text-muted mt-3">Cargando productos...</p>
              </div>
            ) : products.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 60 }}>
                <Package size={48} color="var(--text-400)" />
                <p className="text-muted mt-3">No se encontraron productos</p>
                <button className="btn btn-primary mt-3" onClick={handleNewProduct}><Plus size={14} /> Agregar Producto</button>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Código', 'Producto', 'Categoría', 'Laboratorio', 'Stock', 'P. Venta', 'Acciones'].map((h) => (
                      <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-400)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {products.map((p: any, i: number) => (
                    <tr key={p.id} style={{ borderBottom: '1px solid var(--border)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)', transition: 'background 0.15s' }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(99,102,241,0.05)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)')}
                    >
                      <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text-400)', fontFamily: 'monospace' }}>{p.barcode || p.internalCode}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: 500, fontSize: 14 }}>{p.commercialName}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-400)' }}>{p.genericName} · {p.pharmaceuticalForm}</div>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 13 }}>
                        <span style={{ background: 'var(--surface-2)', padding: '3px 10px', borderRadius: 20, fontSize: 12 }}>{p.category?.name}</span>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-300)' }}>{p.laboratory?.name}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          fontWeight: 600, fontSize: 15,
                          color: Number(p.currentStock) <= Number(p.minStock) ? 'var(--danger)' : Number(p.currentStock) <= Number(p.minStock) * 1.5 ? 'var(--warning)' : 'var(--success)'
                        }}>
                          {p.currentStock}
                        </span>
                        {Number(p.currentStock) <= Number(p.minStock) && (
                          <AlertTriangle size={12} color="var(--danger)" style={{ marginLeft: 4 }} />
                        )}
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: 600, fontSize: 14 }}>Bs. {Number(p.salePrice1).toFixed(2)}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-ghost" style={{ padding: '6px 10px' }} onClick={() => handleEditProduct(p)} title="Editar">
                            <Edit3 size={14} />
                          </button>
                          <button className="btn btn-ghost" style={{ padding: '6px 10px', color: 'var(--danger)' }}
                            onClick={() => { if (confirm(`¿Eliminar "${p.commercialName}"?`)) deleteMutation.mutate(p.id) }}
                            title="Eliminar"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* Pagination */}
            {!loadingProducts && products.length > 0 && (
              <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: 'var(--text-400)' }}>
                  Mostrando {((page - 1) * 15) + 1}–{Math.min(page * 15, total)} de {total} productos
                </span>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="btn btn-ghost" style={{ padding: '6px 10px' }} disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                    <ChevronLeft size={16} />
                  </button>
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(p => (
                    <button key={p} className={`btn ${p === page ? 'btn-primary' : 'btn-ghost'}`} style={{ padding: '6px 12px', minWidth: 36 }} onClick={() => setPage(p)}>
                      {p}
                    </button>
                  ))}
                  <button className="btn btn-ghost" style={{ padding: '6px 10px' }} disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* CATEGORIES TAB */}
      {tab === 'categories' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Nombre', 'Acciones'].map((h) => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-400)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {categories.map((c: any) => (
                <tr key={c.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 500 }}>{c.name}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-ghost" style={{ padding: '6px 10px' }} onClick={() => { setEditingCategory(c); setCategoryModalOpen(true) }}>
                        <Edit3 size={14} />
                      </button>
                      <button className="btn btn-ghost" style={{ padding: '6px 10px', color: 'var(--danger)' }}
                        onClick={() => { if (confirm(`¿Eliminar la categoría "${c.name}"?`)) deleteCategory.mutate(c.id) }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {categories.length === 0 && (
                <tr><td colSpan={2} style={{ padding: 40, textAlign: 'center', color: 'var(--text-400)' }}>Sin categorías. Agrega una nueva.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* LABORATORIES TAB */}
      {tab === 'laboratories' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Nombre', 'Acciones'].map((h) => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-400)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {laboratories.map((l: any) => (
                <tr key={l.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 500 }}>{l.name}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-ghost" style={{ padding: '6px 10px' }} onClick={() => { setEditingLaboratory(l); setLaboratoryModalOpen(true) }}>
                        <Edit3 size={14} />
                      </button>
                      <button className="btn btn-ghost" style={{ padding: '6px 10px', color: 'var(--danger)' }}
                        onClick={() => { if (confirm(`¿Eliminar el laboratorio "${l.name}"?`)) deleteLaboratory.mutate(l.id) }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {laboratories.length === 0 && (
                <tr><td colSpan={2} style={{ padding: 40, textAlign: 'center', color: 'var(--text-400)' }}>Sin laboratorios. Agrega uno nuevo.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modals */}
      <ProductModal
        open={productModalOpen}
        onClose={() => setProductModalOpen(false)}
        product={editingProduct}
        categories={categories}
        laboratories={laboratories}
        onSaved={() => {
          queryClient.invalidateQueries({ queryKey: ['products'] })
          setProductModalOpen(false)
        }}
      />
      <CategoryModal
        open={categoryModalOpen}
        onClose={() => setCategoryModalOpen(false)}
        category={editingCategory}
        onSaved={() => {
          queryClient.invalidateQueries({ queryKey: ['categories'] })
          setCategoryModalOpen(false)
        }}
      />
      <LaboratoryModal
        open={laboratoryModalOpen}
        onClose={() => setLaboratoryModalOpen(false)}
        laboratory={editingLaboratory}
        onSaved={() => {
          queryClient.invalidateQueries({ queryKey: ['laboratories'] })
          setLaboratoryModalOpen(false)
        }}
      />
    </div>
  )
}
