import { Outlet, useLocation } from 'react-router-dom'
import { Bell, Search } from 'lucide-react'
import Sidebar from './Sidebar'
import { useAuthStore } from '../../store/authStore'

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  '/dashboard': { title: 'Dashboard', subtitle: 'Resumen del día y métricas principales' },
  '/pos': { title: 'Punto de Venta', subtitle: 'Gestión de ventas y cobros' },
  '/inventory/products': { title: 'Productos', subtitle: 'Gestión de inventario y medicamentos' },
  '/inventory/kardex': { title: 'Kárdex', subtitle: 'Historial de movimientos de inventario' },
  '/purchases': { title: 'Compras', subtitle: 'Registro de compras a proveedores' },
  '/suppliers': { title: 'Proveedores', subtitle: 'Gestión de proveedores y cuentas por pagar' },
  '/customers': { title: 'Clientes', subtitle: 'Gestión de clientes frecuentes' },
  '/finance/cash': { title: 'Caja', subtitle: 'Control de apertura, movimientos y cierre de caja' },
  '/reports': { title: 'Reportes', subtitle: 'Análisis y reportes del negocio' },
  '/settings/users': { title: 'Usuarios', subtitle: 'Gestión de usuarios y permisos' },
  '/settings': { title: 'Configuración', subtitle: 'Configuración general del sistema' },
}

export default function AppLayout() {
  const location = useLocation()
  const { user } = useAuthStore()
  const page = pageTitles[location.pathname] ?? { title: 'FarmaciaPOS', subtitle: '' }

  const greeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Buenos días'
    if (hour < 18) return 'Buenas tardes'
    return 'Buenas noches'
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="app-main">
        {/* Topbar */}
        <header className="app-topbar">
          <div style={{ flex: 1 }}>
            <h4 style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.9375rem' }}>
              {greeting()}, <span style={{ color: 'var(--primary)' }}>{user?.name?.split(' ')[0]}</span>
            </h4>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: 2 }}>
              {new Date().toLocaleDateString('es-BO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>

          {/* Búsqueda global */}
          <div className="form-input-group" style={{ width: 260 }}>
            <Search size={16} className="form-input-icon" />
            <input
              className="form-input"
              placeholder="Buscar..."
              style={{ padding: '8px 14px 8px 38px', fontSize: '0.8rem' }}
            />
          </div>

          {/* Notificaciones */}
          <button className="btn btn-ghost btn-icon" style={{ position: 'relative', color: 'var(--text-secondary)' }} id="btn-notifications">
            <Bell size={18} />
            <span style={{
              position: 'absolute', top: 6, right: 6, width: 7, height: 7,
              background: 'var(--danger)', borderRadius: '50%', border: '2px solid white'
            }} />
          </button>
        </header>

        {/* Contenido de la página */}
        <div className="app-content">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
