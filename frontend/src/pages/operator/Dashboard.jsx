import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Topbar from '../../components/Topbar'
import { useAuth } from '../../context/AuthContext'
import { assignmentsApi } from '../../api'

export default function OperatorDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [activeAssignment, setActiveAssignment] = useState(null)
  const [loadingAssignment, setLoadingAssignment] = useState(true)

  useEffect(() => {
    assignmentsApi.getMy()
      .then(r => {
        const all = r.data.assignments || []
        const current = all.find(a => a.status === 'active' || a.status === 'scheduled')
        setActiveAssignment(current || null)
      })
      .catch(console.error)
      .finally(() => setLoadingAssignment(false))
  }, [])

  const actions = [
    { label: 'My Assignments', icon: '📋', desc: 'View and update your current assignments', path: '/operator/assignments', color: 'var(--accent-violet)', bg: 'var(--accent-violet-dim)' },
    { label: 'Log My Location', icon: '📍', desc: 'Submit your current GPS coordinates', path: '/operator/location', color: 'var(--accent-teal)', bg: 'var(--accent-teal-dim)' },
    { label: 'View Zone Map', icon: '🗺', desc: 'See forbidden zones on map', path: '/operator/zones', color: 'var(--accent-blue)', bg: 'var(--accent-blue-dim)' },
  ]

  return (
    <>
      <Topbar title="Operator Dashboard" subtitle={`Logged in as ${user?.username}`} />
      <div className="page-body">
        {/* User Profile Card */}
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
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>
                Welcome, {user?.username}
              </div>
              <div style={{ display: 'flex', gap: 16, marginTop: 6 }}>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                  <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Role: </span>
                  <span className="badge badge-teal" style={{ fontSize: 11 }}>Operator</span>
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                  <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>System: </span>
                  GeoGuard Fleet
                </div>
              </div>
            </div>
            {!loadingAssignment && activeAssignment && (
              <div style={{
                background: 'var(--accent-teal-dim)',
                border: '1px solid rgba(0,212,170,0.25)',
                borderRadius: 12,
                padding: '12px 18px',
                minWidth: 220
              }}>
                <div style={{ fontSize: 11, color: 'var(--accent-teal)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
                  Current Assignment
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>
                  🚛 {activeAssignment.asset_name}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Plate: {activeAssignment.plate_number}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                  <span className="badge badge-green" style={{ fontSize: 10 }}>● {activeAssignment.status}</span>
                </div>
              </div>
            )}
            {!loadingAssignment && !activeAssignment && (
              <div style={{
                background: 'var(--bg-primary)',
                border: '1px solid var(--border)',
                borderRadius: 12,
                padding: '12px 18px',
                minWidth: 180,
                textAlign: 'center'
              }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>No active assignment</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Contact your manager</div>
              </div>
            )}
          </div>
        </div>

        <div className="grid-2" style={{ gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginBottom: 0 }}>
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
