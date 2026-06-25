import { useState, useEffect, useRef, useCallback } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import {
  Search, ShoppingCart, Trash2, Plus, Minus, CreditCard,
  DollarSign, QrCode, X, Check, Keyboard, AlertTriangle,
  User, Receipt, Printer, RotateCcw, ChevronRight
} from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../services/api'
import { useAuthStore } from '../../store/authStore'
import PaymentModal from './components/PaymentModal'
import SaleTicket from './components/SaleTicket'
import SalesHistoryPanel from './components/SalesHistoryPanel'

export interface CartItem {
  productId: string
  lotId?: string
  commercialName: string
  genericName: string
  pharmaceuticalForm: string
  barcode?: string
  quantity: number
  unitPrice: number
  discount: number
  subtotal: number
  currentStock: number
  requiresPrescription: boolean
}

export default function PosPage() {
  const { user } = useAuthStore()

  // Estado del carrito
  const [cart, setCart] = useState<CartItem[]>([])
  const [search, setSearch] = useState('')
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null)
  const [priceLevel, setPriceLevel] = useState(1)
  const [customerName, setCustomerName] = useState('')
  const [customerNit, setCustomerNit] = useState('')
  const [globalDiscount, setGlobalDiscount] = useState(0)
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [lastSale, setLastSale] = useState<any>(null)
  const [showTicket, setShowTicket] = useState(false)
  const [showHistory, setShowHistory] = useState(false)

  const searchRef = useRef<HTMLInputElement>(null)
  const searchDebounce = useRef<ReturnType<typeof setTimeout>>()

  // Búsqueda de productos
  const [debouncedSearch, setDebouncedSearch] = useState('')
  useEffect(() => {
    clearTimeout(searchDebounce.current)
    if (search.length < 2) { setDebouncedSearch(''); return }
    searchDebounce.current = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(searchDebounce.current)
  }, [search])

  const { data: searchResults = [], isFetching: searching } = useQuery({
    queryKey: ['pos-search', debouncedSearch],
    queryFn: () =>
      api.get('/products', { params: { search: debouncedSearch, limit: 8 } }).then((r) => r.data.data ?? []),
    enabled: debouncedSearch.length >= 2,
  })

  // Atajos de teclado
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // F2 = Enfocar búsqueda
      if (e.key === 'F2') { e.preventDefault(); searchRef.current?.focus(); searchRef.current?.select() }
      // F4 = Cobrar (si hay items)
      if (e.key === 'F4') { e.preventDefault(); if (cart.length > 0) setPaymentOpen(true) }
      // F5 = Limpiar carrito
      if (e.key === 'F5') { e.preventDefault(); if (cart.length > 0 && confirm('¿Limpiar el carrito?')) clearCart() }
      // F8 = Historial de ventas
      if (e.key === 'F8') { e.preventDefault(); setShowHistory((s) => !s) }
      // Ctrl+Más = Incrementar cantidad del item seleccionado
      if (e.key === '+' && e.ctrlKey && selectedIdx !== null) {
        e.preventDefault()
        changeQty(selectedIdx, 1)
      }
      // Ctrl+Menos = Decrementar
      if (e.key === '-' && e.ctrlKey && selectedIdx !== null) {
        e.preventDefault()
        changeQty(selectedIdx, -1)
      }
      // Delete = Eliminar item seleccionado
      if (e.key === 'Delete' && selectedIdx !== null && document.activeElement?.tagName !== 'INPUT') {
        removeItem(selectedIdx)
      }
      // Escape = Limpiar búsqueda
      if (e.key === 'Escape') { setSearch(''); setDebouncedSearch('') }
    },
    [cart, selectedIdx]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  // Gestión del carrito
  const addToCart = (product: any) => {
    const priceMap: Record<number, string> = { 1: 'salePrice1', 2: 'salePrice2', 3: 'salePrice3' }
    const priceKey = priceMap[priceLevel]
    const price = Number(product[priceKey]) || Number(product.salePrice1) || 0

    if (price <= 0) { toast.error('Este producto no tiene precio de venta configurado'); return }
    if (Number(product.currentStock) <= 0) { toast.error(`Sin stock: ${product.commercialName}`); return }

    const existingIdx = cart.findIndex((i) => i.productId === product.id)
    if (existingIdx >= 0) {
      changeQty(existingIdx, 1)
      setSelectedIdx(existingIdx)
    } else {
      const newItem: CartItem = {
        productId: product.id,
        commercialName: product.commercialName,
        genericName: product.genericName,
        pharmaceuticalForm: product.pharmaceuticalForm,
        barcode: product.barcode,
        quantity: 1,
        unitPrice: price,
        discount: 0,
        subtotal: price,
        currentStock: Number(product.currentStock),
        requiresPrescription: product.requiresPrescription,
      }
      setCart((prev) => [...prev, newItem])
      setSelectedIdx(cart.length)
    }
    setSearch('')
    setDebouncedSearch('')
    searchRef.current?.focus()
  }

  const changeQty = (idx: number, delta: number) => {
    setCart((prev) =>
      prev.map((item, i) => {
        if (i !== idx) return item
        const newQty = Math.max(1, Math.min(item.quantity + delta, item.currentStock))
        if (item.quantity + delta > item.currentStock) toast.error(`Stock máximo: ${item.currentStock}`)
        return { ...item, quantity: newQty, subtotal: newQty * item.unitPrice - item.discount }
      })
    )
  }

  const setQty = (idx: number, qty: number) => {
    setCart((prev) =>
      prev.map((item, i) => {
        if (i !== idx) return item
        const newQty = Math.max(1, Math.min(qty, item.currentStock))
        return { ...item, quantity: newQty, subtotal: newQty * item.unitPrice - item.discount }
      })
    )
  }

  const setItemDiscount = (idx: number, discount: number) => {
    setCart((prev) =>
      prev.map((item, i) => {
        if (i !== idx) return item
        const maxDisc = Number(item.unitPrice) * item.quantity
        const disc = Math.max(0, Math.min(discount, maxDisc))
        return { ...item, discount: disc, subtotal: item.quantity * item.unitPrice - disc }
      })
    )
  }

  const removeItem = (idx: number) => {
    setCart((prev) => prev.filter((_, i) => i !== idx))
    setSelectedIdx(null)
  }

  const clearCart = () => {
    setCart([])
    setSelectedIdx(null)
    setCustomerName('')
    setCustomerNit('')
    setGlobalDiscount(0)
    searchRef.current?.focus()
  }

  // Totales
  const subtotal = cart.reduce((s, i) => s + i.subtotal, 0)
  const total = subtotal - globalDiscount

  // Completar venta
  const saleMutation = useMutation({
    mutationFn: (paymentData: { paymentMethod: string; amountPaid: number }) =>
      api.post('/sales', {
        userId: user?.id,
        items: cart.map((i) => ({
          productId: i.productId,
          lotId: i.lotId,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          discount: i.discount,
        })),
        paymentMethod: paymentData.paymentMethod,
        amountPaid: paymentData.amountPaid,
        priceLevel,
        discount: globalDiscount,
        customerName: customerName || undefined,
        customerNit: customerNit || undefined,
      }).then((r) => r.data),
    onSuccess: (sale) => {
      toast.success(`✅ Venta ${sale.saleNumber} completada`)
      setLastSale(sale)
      setShowTicket(true)
      clearCart()
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Error al procesar la venta')
    },
  })

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 64px)', gap: 0, margin: '-24px', overflow: 'hidden' }}>

      {/* ─── PANEL IZQUIERDO: Búsqueda + Resultados ─────────────── */}
      <div style={{
        width: showHistory ? 0 : 340,
        minWidth: showHistory ? 0 : 340,
        background: 'var(--bg-800)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        transition: 'all 0.3s ease',
      }}>
        <div style={{ padding: '16px 16px 12px' }}>
          {/* Título */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <ShoppingCart size={18} color="var(--primary)" />
              <span style={{ fontWeight: 700, fontSize: 15 }}>Punto de Venta</span>
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              {([1, 2, 3] as const).map((lvl) => (
                <button key={lvl} onClick={() => setPriceLevel(lvl)}
                  style={{
                    padding: '4px 10px', borderRadius: 6, border: '1px solid',
                    fontSize: 11, fontWeight: 600, cursor: 'pointer',
                    background: priceLevel === lvl ? 'var(--primary)' : 'transparent',
                    borderColor: priceLevel === lvl ? 'var(--primary)' : 'var(--border)',
                    color: priceLevel === lvl ? 'white' : 'var(--text-400)',
                  }}>P{lvl}</button>
              ))}
            </div>
          </div>

          {/* Búsqueda */}
          <div style={{ position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-400)', pointerEvents: 'none' }} />
            <input
              ref={searchRef}
              id="pos-search"
              className="input"
              style={{ paddingLeft: 36, paddingRight: 36, fontSize: 14 }}
              placeholder="Buscar producto (F2)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
              autoComplete="off"
            />
            {search && (
              <button onClick={() => { setSearch(''); setDebouncedSearch('') }}
                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-400)' }}>
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Resultados de búsqueda */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 8px 8px' }}>
          {debouncedSearch.length >= 2 && (
            <>
              {searching && (
                <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-400)', fontSize: 13 }}>
                  Buscando...
                </div>
              )}
              {!searching && searchResults.length === 0 && (
                <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-400)', fontSize: 13 }}>
                  Sin resultados para "<strong>{debouncedSearch}</strong>"
                </div>
              )}
              {searchResults.map((p: any) => (
                <button key={p.id} onClick={() => addToCart(p)}
                  style={{
                    width: '100%', textAlign: 'left', padding: '10px 12px',
                    background: 'transparent', border: '1px solid transparent',
                    borderRadius: 8, cursor: 'pointer', marginBottom: 4,
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-600)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)' }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.borderColor = 'transparent' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-100)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {p.commercialName}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-400)', marginTop: 2 }}>
                        {p.genericName} · {p.pharmaceuticalForm}
                      </div>
                      <div style={{ display: 'flex', gap: 8, marginTop: 4, alignItems: 'center' }}>
                        <span style={{ fontSize: 11, color: Number(p.currentStock) <= Number(p.minStock) ? 'var(--danger)' : 'var(--success)', fontWeight: 600 }}>
                          Stock: {p.currentStock}
                        </span>
                        {p.barcode && <span style={{ fontSize: 10, color: 'var(--text-400)', fontFamily: 'monospace' }}>{p.barcode}</span>}
                        {p.requiresPrescription && <span style={{ fontSize: 10, color: 'var(--warning)', fontWeight: 600 }}>⚕ Receta</span>}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 8 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--primary)' }}>
                        Bs. {Number(priceLevel === 1 ? p.salePrice1 : priceLevel === 2 ? p.salePrice2 : p.salePrice3).toFixed(2)}
                      </div>
                      <ChevronRight size={14} color="var(--text-400)" style={{ marginTop: 4 }} />
                    </div>
                  </div>
                </button>
              ))}
            </>
          )}

          {debouncedSearch.length < 2 && (
            <div style={{ padding: '24px 12px' }}>
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <Search size={32} color="var(--text-400)" style={{ opacity: 0.4 }} />
                <p style={{ color: 'var(--text-400)', fontSize: 12, marginTop: 8 }}>Escribe para buscar productos</p>
              </div>
              {/* Atajos */}
              <div style={{ background: 'var(--bg-700)', borderRadius: 8, padding: 12 }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-400)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                  <Keyboard size={12} style={{ marginRight: 4 }} />Atajos de Teclado
                </p>
                {[
                  ['F2', 'Enfocar búsqueda'],
                  ['F4', 'Cobrar'],
                  ['F5', 'Limpiar carrito'],
                  ['F8', 'Historial de ventas'],
                  ['Ctrl+/+', 'Subir cantidad'],
                  ['Ctrl+-', 'Bajar cantidad'],
                  ['Supr', 'Eliminar ítem'],
                  ['Esc', 'Limpiar búsqueda'],
                ].map(([key, desc]) => (
                  <div key={key} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                    <kbd style={{ background: 'var(--bg-500)', padding: '1px 6px', borderRadius: 4, fontFamily: 'monospace', fontWeight: 600, color: 'var(--primary)' }}>{key}</kbd>
                    <span style={{ color: 'var(--text-400)' }}>{desc}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── PANEL CENTRAL: Carrito ──────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--bg-900)' }}>

        {/* Header del carrito */}
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12, background: 'var(--bg-800)' }}>
          {/* Cliente */}
          <User size={14} color="var(--text-400)" />
          <input className="input" style={{ width: 180, fontSize: 13, padding: '6px 10px' }}
            placeholder="Nombre cliente" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
          <input className="input" style={{ width: 120, fontSize: 13, padding: '6px 10px', fontFamily: 'monospace' }}
            placeholder="NIT / CI" value={customerNit} onChange={(e) => setCustomerNit(e.target.value)} />
          <div style={{ flex: 1 }} />
          <button className="btn btn-ghost" style={{ fontSize: 12, gap: 6 }} onClick={() => setShowHistory((s) => !s)}>
            <Receipt size={14} /> Historial (F8)
          </button>
          {cart.length > 0 && (
            <button className="btn btn-ghost" style={{ color: 'var(--danger)', fontSize: 12, gap: 6 }} onClick={() => { if (confirm('¿Limpiar carrito?')) clearCart() }}>
              <RotateCcw size={14} /> Limpiar (F5)
            </button>
          )}
        </div>

        {/* Tabla del carrito */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {cart.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-400)', gap: 12 }}>
              <ShoppingCart size={56} style={{ opacity: 0.2 }} />
              <p style={{ fontSize: 15, fontWeight: 500 }}>Carrito vacío</p>
              <p style={{ fontSize: 13 }}>Busca un producto para comenzar</p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--bg-800)', position: 'sticky', top: 0, zIndex: 1 }}>
                  {['#', 'Producto', 'P.Unit', 'Cant.', 'Dcto.', 'Subtotal', ''].map((h) => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-400)', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cart.map((item, idx) => (
                  <tr key={idx}
                    onClick={() => setSelectedIdx(idx === selectedIdx ? null : idx)}
                    style={{
                      borderBottom: '1px solid var(--border)',
                      background: selectedIdx === idx ? 'rgba(99,102,241,0.08)' : 'transparent',
                      cursor: 'pointer',
                      transition: 'background 0.1s',
                    }}
                  >
                    <td style={{ padding: '10px 12px', fontSize: 13, color: 'var(--text-400)', width: 32 }}>{idx + 1}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <div style={{ fontWeight: 500, fontSize: 13 }}>{item.commercialName}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-400)' }}>{item.genericName} · {item.pharmaceuticalForm}</div>
                      {item.requiresPrescription && (
                        <span style={{ fontSize: 10, color: 'var(--warning)', fontWeight: 600 }}>⚕ Requiere receta</span>
                      )}
                    </td>
                    <td style={{ padding: '10px 12px', fontSize: 13, fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                      Bs. {Number(item.unitPrice).toFixed(2)}
                    </td>
                    <td style={{ padding: '10px 6px', width: 110 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <button onClick={(e) => { e.stopPropagation(); changeQty(idx, -1) }}
                          style={{ background: 'var(--bg-600)', border: 'none', borderRadius: 6, width: 28, height: 28, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-300)' }}>
                          <Minus size={12} />
                        </button>
                        <input
                          type="number" min="1" max={item.currentStock}
                          value={item.quantity}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => setQty(idx, parseInt(e.target.value) || 1)}
                          style={{ width: 42, textAlign: 'center', background: 'var(--bg-700)', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 0', color: 'var(--text-100)', fontSize: 13, fontWeight: 600 }}
                        />
                        <button onClick={(e) => { e.stopPropagation(); changeQty(idx, 1) }}
                          style={{ background: 'var(--bg-600)', border: 'none', borderRadius: 6, width: 28, height: 28, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-300)' }}>
                          <Plus size={12} />
                        </button>
                      </div>
                    </td>
                    <td style={{ padding: '10px 6px', width: 100 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ fontSize: 11, color: 'var(--text-400)' }}>Bs.</span>
                        <input
                          type="number" min="0" step="0.01"
                          value={item.discount || ''}
                          placeholder="0"
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => setItemDiscount(idx, parseFloat(e.target.value) || 0)}
                          style={{ width: 70, textAlign: 'right', background: 'var(--bg-700)', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 6px', color: 'var(--warning)', fontSize: 12 }}
                        />
                      </div>
                    </td>
                    <td style={{ padding: '10px 12px', fontWeight: 700, fontSize: 14, fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                      Bs. {Number(item.subtotal).toFixed(2)}
                    </td>
                    <td style={{ padding: '10px 8px', width: 36 }}>
                      <button onClick={(e) => { e.stopPropagation(); removeItem(idx) }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-400)', display: 'flex', alignItems: 'center', padding: 4, borderRadius: 6 }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--danger)')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-400)')}>
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* ─── PANEL INFERIOR: Totales ─── */}
        <div style={{ background: 'var(--bg-800)', borderTop: '1px solid var(--border)', padding: '12px 16px' }}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end' }}>

            {/* Descuento global */}
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 11, color: 'var(--text-400)', fontWeight: 600, display: 'block', marginBottom: 4 }}>
                DESCUENTO GLOBAL (Bs.)
              </label>
              <input
                type="number" min="0" step="0.01" max={subtotal}
                className="input" style={{ fontSize: 14, color: 'var(--warning)', fontWeight: 600 }}
                value={globalDiscount || ''}
                placeholder="0.00"
                onChange={(e) => setGlobalDiscount(Math.max(0, Math.min(parseFloat(e.target.value) || 0, subtotal)))}
              />
            </div>

            {/* Totales */}
            <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 11, color: 'var(--text-400)', fontWeight: 600 }}>SUBTOTAL</div>
                <div style={{ fontSize: 18, fontWeight: 700, fontFamily: 'monospace' }}>Bs. {subtotal.toFixed(2)}</div>
              </div>
              {globalDiscount > 0 && (
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 11, color: 'var(--warning)', fontWeight: 600 }}>DESCUENTO</div>
                  <div style={{ fontSize: 18, fontWeight: 700, fontFamily: 'monospace', color: 'var(--warning)' }}>- Bs. {globalDiscount.toFixed(2)}</div>
                </div>
              )}
              <div style={{ textAlign: 'right', background: 'var(--primary-glow)', borderRadius: 10, padding: '10px 18px', border: '1px solid rgba(99,102,241,0.3)' }}>
                <div style={{ fontSize: 11, color: 'var(--primary-light)', fontWeight: 600 }}>TOTAL</div>
                <div style={{ fontSize: 26, fontWeight: 800, fontFamily: 'monospace', color: 'white' }}>Bs. {total.toFixed(2)}</div>
              </div>
            </div>

            {/* Botón Cobrar */}
            <button
              className="btn btn-success"
              style={{ padding: '14px 28px', fontSize: 15, gap: 10, opacity: cart.length === 0 ? 0.4 : 1, cursor: cart.length === 0 ? 'not-allowed' : 'pointer' }}
              disabled={cart.length === 0}
              onClick={() => setPaymentOpen(true)}
            >
              <CreditCard size={20} />
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: 13, opacity: 0.8 }}>Cobrar (F4)</div>
                <div style={{ fontWeight: 800 }}>Bs. {total.toFixed(2)}</div>
              </div>
            </button>
          </div>

          {/* Items count */}
          <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-400)' }}>
            {cart.length} {cart.length === 1 ? 'producto' : 'productos'} · {cart.reduce((s, i) => s + i.quantity, 0)} unidades
          </div>
        </div>
      </div>

      {/* ─── PANEL DERECHO: Historial ─────────────────────────────── */}
      {showHistory && (
        <SalesHistoryPanel onClose={() => setShowHistory(false)} />
      )}

      {/* ─── MODAL DE PAGO ─────────────────────────────────────────── */}
      <PaymentModal
        open={paymentOpen}
        onClose={() => setPaymentOpen(false)}
        total={total}
        itemCount={cart.reduce((s, i) => s + i.quantity, 0)}
        customerName={customerName}
        onConfirm={(paymentData) => {
          setPaymentOpen(false)
          saleMutation.mutate(paymentData)
        }}
        isPending={saleMutation.isPending}
      />

      {/* ─── TICKET DE VENTA ─────────────────────────────────────────── */}
      {showTicket && lastSale && (
        <SaleTicket
          sale={lastSale}
          onClose={() => setShowTicket(false)}
        />
      )}
    </div>
  )
}
