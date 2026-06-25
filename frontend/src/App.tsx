import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import AppLayout from './components/layout/AppLayout'
import LoginPage from './pages/auth/LoginPage'
import DashboardPage from './pages/dashboard/DashboardPage'
import ProductsPage from './pages/inventory/ProductsPage'
import PosPage from './pages/pos/PosPage'
import SuppliersPage from './pages/suppliers/SuppliersPage'
import PurchasesPage from './pages/purchases/PurchasesPage'
import CustomersPage from './pages/customers/CustomersPage'
import KardexPage from './pages/inventory/KardexPage'
import CashRegisterPage from './pages/finance/CashRegisterPage'
import ReportsPage from './pages/reports/ReportsPage'
import UsersPage from './pages/settings/UsersPage'
import SettingsPage from './pages/settings/SettingsPage'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

function RoleRoute({ children, allowedRoles }: { children: React.ReactNode, allowedRoles: string[] }) {
  const { user } = useAuthStore()
  const role = user?.role || 'CAJERO'
  
  if (!allowedRoles.includes(role)) {
    return <Navigate to="/dashboard" replace />
  }
  
  return <>{children}</>
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <AppLayout />
            </PrivateRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="pos" element={<PosPage />} />
          <Route path="inventory/products" element={<RoleRoute allowedRoles={['ADMIN', 'FARMACEUTICO']}><ProductsPage /></RoleRoute>} />
          <Route path="inventory/kardex" element={<RoleRoute allowedRoles={['ADMIN', 'FARMACEUTICO']}><KardexPage /></RoleRoute>} />
          <Route path="purchases" element={<RoleRoute allowedRoles={['ADMIN', 'FARMACEUTICO']}><PurchasesPage /></RoleRoute>} />
          <Route path="suppliers" element={<RoleRoute allowedRoles={['ADMIN', 'FARMACEUTICO']}><SuppliersPage /></RoleRoute>} />
          <Route path="customers" element={<RoleRoute allowedRoles={['ADMIN', 'CAJERO']}><CustomersPage /></RoleRoute>} />
          <Route path="finance/cash" element={<RoleRoute allowedRoles={['ADMIN', 'CAJERO']}><CashRegisterPage /></RoleRoute>} />
          <Route path="reports" element={<RoleRoute allowedRoles={['ADMIN']}><ReportsPage /></RoleRoute>} />
          <Route path="settings/users" element={<RoleRoute allowedRoles={['ADMIN']}><UsersPage /></RoleRoute>} />
          <Route path="settings" element={<RoleRoute allowedRoles={['ADMIN']}><SettingsPage /></RoleRoute>} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
