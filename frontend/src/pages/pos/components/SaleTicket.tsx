import { X, Printer, Check } from 'lucide-react'

interface Props {
  sale: any
  onClose: () => void
}

export default function SaleTicket({ sale, onClose }: Props) {
  const handlePrint = () => window.print()

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 3000,
      background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>

        {/* Éxito */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--success)' }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Check size={24} />
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>¡Venta Completada!</div>
            <div style={{ fontSize: 13, color: 'var(--text-400)' }}>{sale.saleNumber}</div>
          </div>
        </div>

        {/* Ticket */}
        <div id="ticket-print" className="card" style={{
          width: 320, padding: '20px 16px', fontFamily: 'monospace',
          background: 'white', color: '#111', borderRadius: 8,
        }}>
          <div style={{ textAlign: 'center', borderBottom: '1px dashed #ccc', paddingBottom: 12, marginBottom: 12 }}>
            <div style={{ fontSize: 16, fontWeight: 800 }}>FARMACIA</div>
            <div style={{ fontSize: 11, color: '#555' }}>Sistema FarmaciaPOS</div>
            <div style={{ fontSize: 11, color: '#555', marginTop: 4 }}>
              {new Date(sale.createdAt).toLocaleString('es-BO', { dateStyle: 'medium', timeStyle: 'short' })}
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, marginTop: 4 }}>{sale.saleNumber}</div>
          </div>

          {/* Cliente */}
          {sale.customer && (
            <div style={{ fontSize: 11, marginBottom: 8 }}>
              <div>Cliente: {sale.customer.name}</div>
              {sale.customer.nit && <div>NIT: {sale.customer.nit}</div>}
            </div>
          )}

          {/* Items */}
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, marginBottom: 10 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #ddd' }}>
                <th style={{ textAlign: 'left', padding: '3px 0', fontSize: 10 }}>Producto</th>
                <th style={{ textAlign: 'center', padding: '3px 2px', fontSize: 10 }}>Cant</th>
                <th style={{ textAlign: 'right', padding: '3px 0', fontSize: 10 }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {sale.items.map((item: any, i: number) => (
                <tr key={i} style={{ borderBottom: '1px dotted #eee' }}>
                  <td style={{ padding: '4px 0', fontSize: 11 }}>
                    <div>{item.product?.commercialName}</div>
                    <div style={{ fontSize: 10, color: '#666' }}>Bs. {Number(item.unitPrice).toFixed(2)} c/u</div>
                  </td>
                  <td style={{ textAlign: 'center', padding: '4px 2px' }}>{item.quantity}</td>
                  <td style={{ textAlign: 'right', padding: '4px 0', fontWeight: 700 }}>
                    Bs. {Number(item.subtotal).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totales */}
          <div style={{ borderTop: '1px dashed #ccc', paddingTop: 8, marginBottom: 10 }}>
            {Number(sale.discount) > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                <span>Descuento:</span>
                <span>- Bs. {Number(sale.discount).toFixed(2)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 14, marginTop: 4 }}>
              <span>TOTAL:</span>
              <span>Bs. {Number(sale.total).toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginTop: 4 }}>
              <span>Pago ({sale.paymentMethod}):</span>
              <span>Bs. {Number(sale.amountPaid).toFixed(2)}</span>
            </div>
            {Number(sale.change) > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#059669' }}>
                <span>Vuelto:</span>
                <span>Bs. {Number(sale.change).toFixed(2)}</span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={{ textAlign: 'center', borderTop: '1px dashed #ccc', paddingTop: 8, fontSize: 10, color: '#888' }}>
            <div>¡Gracias por su compra!</div>
            <div>Este documento no es factura fiscal</div>
          </div>
        </div>

        {/* Acciones */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-ghost" style={{ gap: 8 }} onClick={handlePrint}>
            <Printer size={16} /> Imprimir
          </button>
          <button className="btn btn-primary" style={{ gap: 8 }} onClick={onClose}>
            <Check size={16} /> Nueva Venta
          </button>
        </div>
      </div>
    </div>
  )
}
