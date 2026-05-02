import { useNavigate } from 'react-router-dom'
import Topbar from '../../components/Topbar'
import { useAuth } from '../../context/AuthContext'

export default function OperatorDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const actions = [
    { label: 'Log My Location', icon: '📍', desc: 'Submit your current GPS coordinates', path: '/operator/location', color: 'var(--accent-teal)', bg: 'var(--accent-teal-dim)' },
    { label: 'View Zone Map', icon: '🗺', desc: 'See active and forbidden zones on map', path: '/operator/zones', color: 'var(--accent-blue)', bg: 'var(--accent-blue-dim)' },
    { label: 'Asset Search', icon: '🔍', desc: 'Search assets by name', path: '/operator/search', color: 'var(--accent-violet)', bg: 'var(--accent-violet-dim)' },
  ]

  return (
    <>
      <Topbar title="Operator Dashboard" subtitle={`Logged in as ${user?.username}`} />
      <div className="page-body">
        <div className="card" style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 56, height: 56,
              background: 'var(--accent-teal-dim)',
              border: '1px solid rgba(0,212,170,0.2)',
              borderRadius: 16,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 28
            }}>👷</div>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>
                Welcome, {user?.username}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
                Operator · GeoGuard Fleet System
              </div>
            </div>
          </div>
        </div>

        <div className="grid-3">
          {actions.map(a => (
            <div
              key={a.label}
              className="card"
              onClick={() => navigate(a.path)}
              style={{
                cursor: 'pointer',
                border: `1px solid var(--border)`,
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = a.color
                e.currentTarget.style.transform = 'translateY(-3px)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--border)'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              <div style={{
                width: 48, height: 48,
                background: a.bg,
                borderRadius: 12,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 24,
                marginBottom: 16
              }}>{a.icon}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: a.color, marginBottom: 6 }}>
                {a.label}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{a.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
