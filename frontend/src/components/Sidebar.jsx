import { useAuth } from '../context/AuthContext'
import { useNavigate, useLocation } from 'react-router-dom'

const adminNav = [
  { label: 'Overview', icon: '◈', path: '/admin' },
  { label: 'Users', icon: '👤', path: '/admin/users' },
  { label: 'Assets', icon: '🚛', path: '/admin/assets' },
  { label: 'Zones', icon: '🗺', path: '/admin/zones' },
  { label: 'Assignments', icon: '📋', path: '/admin/assignments' },
  { label: 'Breach Logs', icon: '🛡', path: '/admin/breaches' },
  { label: 'Live Map', icon: '📍', path: '/admin/map' },
]

const managerNav = [
  { label: 'Overview', icon: '◈', path: '/manager' },
  { label: 'Assignments', icon: '📋', path: '/manager/assignments' },
  { label: 'My Team', icon: '👥', path: '/manager/team' },
  { label: 'Assets', icon: '🚛', path: '/manager/assets' },
  { label: 'Live Map', icon: '📍', path: '/manager/map' },
  { label: 'Zones', icon: '🗺', path: '/manager/zones' },
]

const operatorNav = [
  { label: 'My Dashboard', icon: '◈', path: '/operator' },
  { label: 'My Assignments', icon: '📋', path: '/operator/assignments' },
  { label: 'Log Location', icon: '📍', path: '/operator/location' },
  { label: 'View Zones', icon: '🗺', path: '/operator/zones' },
  { label: 'Asset Search', icon: '🔍', path: '/operator/search' },
]

export default function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const navItems = user?.role === 'admin' ? adminNav
    : user?.role === 'manager' ? managerNav
    : operatorNav

  const handleLogout = async () => {
    logout()
    navigate('/login')
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-mark">
          <div className="logo-icon">🛡</div>
          <div>
            <div className="logo-text">GeoGuard</div>
            <div className="logo-sub">Asset Management</div>
          </div>
        </div>
      </div>

      <div className="sidebar-user">
        <div className="user-name">{user?.username}</div>
        <div className="user-role">{user?.role}</div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-label">Navigation</div>
        {navItems.map(item => (
          <div
            key={item.path}
            className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
            onClick={() => navigate(item.path)}
          >
            <span className="nav-icon">{item.icon}</span>
            {item.label}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button className="logout-btn" onClick={handleLogout}>
          <span>⎋</span> Sign Out
        </button>
      </div>
    </aside>
  )
}
