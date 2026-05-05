import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Sidebar from './components/Sidebar'

// Pages
import Login from './pages/Login'
import HoneypotDashboard from './pages/HoneypotDashboard'

// Admin
import AdminDashboard from './pages/admin/Dashboard'
import AdminUsers from './pages/admin/Users'
import AdminAssets from './pages/admin/Assets'
import AdminZones from './pages/admin/Zones'
import AdminBreaches from './pages/admin/Breaches'
import AdminLiveMap from './pages/admin/LiveMap'
import AdminAssignments from './pages/admin/Assignment'

// Manager
import ManagerDashboard from './pages/manager/Dashboard'
import ManagerAssignments from './pages/manager/Assignments'
import ManagerTeam from './pages/manager/Team'
import ManagerAssets from './pages/manager/Assets'
import ManagerLiveMap from './pages/manager/LiveMap'
import ManagerZones from './pages/manager/Zones'

// Operator
import OperatorDashboard from './pages/operator/Dashboard'
import OperatorLocation from './pages/operator/Location'
import OperatorZones from './pages/operator/Zones'
import OperatorAssignments from './pages/operator/Assignments'

// ============================================
// Auth Guard
// ============================================
function RequireAuth({ children, allowedRoles }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="loading-center" style={{ height: '100vh' }}>
        <div className="spinner" />
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (user.role === 'admin') return <Navigate to="/admin" replace />
    if (user.role === 'manager') return <Navigate to="/manager" replace />
    return <Navigate to="/operator" replace />
  }

  return children
}

// ============================================
// Layout wrapper
// ============================================
function AppLayout({ children }) {
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        {children}
      </div>
    </div>
  )
}

// ============================================
// Root redirect
// ============================================
function RootRedirect() {
  const { user, loading } = useAuth()

  if (loading) {
    return <div className="loading-center" style={{ height: '100vh' }}><div className="spinner" /></div>
  }

  if (!user) return <Navigate to="/login" replace />
  if (user.role === 'admin') return <Navigate to="/admin" replace />
  if (user.role === 'manager') return <Navigate to="/manager" replace />
  if (user.role === 'honeypot') return <Navigate to="/admin-panel" replace />
  return <Navigate to="/operator" replace />
}

// ============================================
// Main App
// ============================================
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginRoute />} />
          <Route path="/admin-panel" element={<HoneypotDashboard />} /> 
          //setting it to admin-panel to avoid suspicion 
          <Route path="/" element={<RootRedirect />} />

          {/* Admin routes */}
          <Route path="/admin" element={
            <RequireAuth allowedRoles={['admin']}>
              <AppLayout><AdminDashboard /></AppLayout>
            </RequireAuth>
          } />
          <Route path="/admin/users" element={
            <RequireAuth allowedRoles={['admin']}>
              <AppLayout><AdminUsers /></AppLayout>
            </RequireAuth>
          } />
          <Route path="/admin/assets" element={
            <RequireAuth allowedRoles={['admin']}>
              <AppLayout><AdminAssets /></AppLayout>
            </RequireAuth>
          } />
          <Route path="/admin/zones" element={
            <RequireAuth allowedRoles={['admin']}>
              <AppLayout><AdminZones /></AppLayout>
            </RequireAuth>
          } />
          <Route path="/admin/breaches" element={
            <RequireAuth allowedRoles={['admin']}>
              <AppLayout><AdminBreaches /></AppLayout>
            </RequireAuth>
          } />
          <Route path="/admin/map" element={
            <RequireAuth allowedRoles={['admin']}>
              <AppLayout><AdminLiveMap /></AppLayout>
            </RequireAuth>
          } />
          <Route path="/admin/assignments" element={
            <RequireAuth allowedRoles={['admin']}>
              <AppLayout><AdminAssignments /></AppLayout>
            </RequireAuth>
          } />

          {/* Manager routes */}
          <Route path="/manager" element={
            <RequireAuth allowedRoles={['manager']}>
              <AppLayout><ManagerDashboard /></AppLayout>
            </RequireAuth>
          } />
          <Route path="/manager/assignments" element={
            <RequireAuth allowedRoles={['manager']}>
              <AppLayout><ManagerAssignments /></AppLayout>
            </RequireAuth>
          } />
          <Route path="/manager/team" element={
            <RequireAuth allowedRoles={['manager']}>
              <AppLayout><ManagerTeam /></AppLayout>
            </RequireAuth>
          } />
          <Route path="/manager/assets" element={
            <RequireAuth allowedRoles={['manager']}>
              <AppLayout><ManagerAssets /></AppLayout>
            </RequireAuth>
          } />
          <Route path="/manager/map" element={
            <RequireAuth allowedRoles={['manager']}>
              <AppLayout><ManagerLiveMap /></AppLayout>
            </RequireAuth>
          } />
          <Route path="/manager/zones" element={
            <RequireAuth allowedRoles={['manager']}>
              <AppLayout><ManagerZones /></AppLayout>
            </RequireAuth>
          } />

          {/* Operator routes */}
          <Route path="/operator" element={
            <RequireAuth allowedRoles={['operator']}>
              <AppLayout><OperatorDashboard /></AppLayout>
            </RequireAuth>
          } />
          <Route path="/operator/location" element={
            <RequireAuth allowedRoles={['operator']}>
              <AppLayout><OperatorLocation /></AppLayout>
            </RequireAuth>
          } />
          <Route path="/operator/zones" element={
            <RequireAuth allowedRoles={['operator']}>
              <AppLayout><OperatorZones /></AppLayout>
            </RequireAuth>
          } />
          <Route path="/operator/assignments" element={
            <RequireAuth allowedRoles={['operator']}>
              <AppLayout><OperatorAssignments /></AppLayout>
            </RequireAuth>
          } />

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

function LoginRoute() {
  const { user, loading } = useAuth()
  if (loading) return <div className="loading-center" style={{ height: '100vh' }}><div className="spinner" /></div>
  if (user) {
    if (user.role === 'admin') return <Navigate to="/admin" replace />
    if (user.role === 'manager') return <Navigate to="/manager" replace />
    if (user.role === 'honeypot') return <Navigate to="/honeypot-dashboard" replace />
    return <Navigate to="/operator" replace />
  }
  return <Login />
}
