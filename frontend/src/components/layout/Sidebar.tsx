import { NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import {
  LayoutDashboard, ShoppingCart, Package, TrendingUp,
  Users, Truck, DollarSign, BarChart3, Settings, LogOut,
  Pill, FileText, Archive
} from 'lucide-react'

const navItems = [
  {
    section: 'Principal',
    roles: ['ADMIN', 'FARMACEUTICO', 'CAJERO'],
    items: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
      { icon: ShoppingCart, label: 'Punto de Venta', path: '/pos', roles: ['ADMIN', 'CAJERO'] },
    ],
  },
  {
    section: 'Inventario',
    roles: ['ADMIN', 'FARMACEUTICO'],
    items: [
      { icon: Pill, label: 'Productos', path: '/inventory/products' },
      { icon: Archive, label: 'Kárdex', path: '/inventory/kardex' },
    ],
  },
  {
    section: 'Compras',
    roles: ['ADMIN', 'FARMACEUTICO'],
    items: [
      { icon: TrendingUp, label: 'Compras', path: '/purchases' },
      { icon: Truck, label: 'Proveedores', path: '/suppliers' },
    ],
  },
  {
    section: 'Clientes',
    roles: ['ADMIN', 'CAJERO'],
    items: [
      { icon: Users, label: 'Clientes', path: '/customers' },
    ],
  },
  {
    section: 'Finanzas',
    roles: ['ADMIN', 'CAJERO'],
    items: [
      { icon: DollarSign, label: 'Caja', path: '/finance/cash' },
      { icon: BarChart3, label: 'Reportes', path: '/reports', roles: ['ADMIN'] },
    ],
  },
  {
    section: 'Administración',
    roles: ['ADMIN'],
    items: [
      { icon: Users, label: 'Usuarios', path: '/settings/users' },
      { icon: Settings, label: 'Configuración', path: '/settings' },
    ],
  },
]

export default function Sidebar() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U'

  const roleLabel = {
    ADMIN: 'Administrador',
    FARMACEUTICO: 'Farmacéutico',
    CAJERO: 'Cajero',
  }[user?.role ?? 'CAJERO']

  return (
    <aside className="app-sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <Pill size={22} color="white" />
        </div>
        <div className="sidebar-logo-text">
          <h3>FarmaciaPOS</h3>
          <span>Sistema de Farmacia</span>
        </div>
      </div>

      {/* Navegación */}
      <nav className="sidebar-nav">
        {navItems
          .filter(section => !section.roles || section.roles.includes(user?.role || 'CAJERO'))
          .map((section) => {
            const filteredItems = section.items.filter(item => !item.roles || item.roles.includes(user?.role || 'CAJERO'));
            if (filteredItems.length === 0) return null;

            return (
              <div key={section.section}>
                <p className="sidebar-section-title">{section.section}</p>
                {filteredItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      `sidebar-item ${isActive ? 'active' : ''}`
                    }
                  >
                    <item.icon size={18} className="sidebar-item-icon" />
                    {item.label}
                  </NavLink>
                ))}
              </div>
            );
          })}
      </nav>

      {/* Footer con usuario */}
      <div className="sidebar-footer">
        <div className="user-card" onClick={handleLogout} title="Cerrar sesión">
          <div className="user-avatar">{initials}</div>
          <div className="user-info">
            <h5>{user?.name ?? 'Usuario'}</h5>
            <span>{roleLabel}</span>
          </div>
          <LogOut size={15} color="var(--text-400)" style={{ marginLeft: 'auto' }} />
        </div>
      </div>
    </aside>
  )
}
