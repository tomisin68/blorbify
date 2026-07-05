import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from '@/context/auth-context'
import { ProtectedRoute } from '@/components/protected-route'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { LoginPage } from '@/pages/login'
import { OverviewPage } from '@/pages/overview'
import { SellersPage } from '@/pages/sellers'
import { SubscriptionsPage } from '@/pages/subscriptions'
import { OrdersPage } from '@/pages/orders'
import { NotificationsPage } from '@/pages/notifications'
import { SettingsPage } from '@/pages/settings'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<OverviewPage />} />
            <Route path="/sellers" element={<SellersPage />} />
            <Route path="/subscriptions" element={<SubscriptionsPage />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
