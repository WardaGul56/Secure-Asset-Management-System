import { useState, useEffect } from 'react'
import Topbar from '../../components/Topbar'
import { assignmentsApi, operatorsApi, assetsApi } from '../../api'
<<<<<<< HEAD
import { useAuth } from '../../context/AuthContext'

export default function ManagerDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState({ assignments: 0, active: 0, team: 0, assets: 0 })
=======

export default function ManagerDashboard() {
  const [stats, setStats] = useState({ assignments: 0, active: 0, team: 0, assets: 0 })
  const [loading, setLoading] = useState(true)
>>>>>>> f6bba86028646253c4155e021562d250c6128eda

  useEffect(() => {
    Promise.all([
      assignmentsApi.getAll(),
      operatorsApi.getMyTeam(),
      assetsApi.getAll(),
    ]).then(([a, t, ast]) => {
      const all = a.data.assignments || []
      setStats({
        assignments: all.length,
<<<<<<< HEAD
        active: all.filter(x => x.status === 'active' || x.status === 'scheduled').length,
        team: t.data.operators?.length || 0,
        assets: ast.data.assets?.length || 0,
      })
    }).catch(console.error)
  }, [])

=======
        active: all.filter(x => x.status === 'active').length,
        team: t.data.operators?.length || 0,
        assets: ast.data.assets?.length || 0,
      })
    }).catch(console.error).finally(() => setLoading(false))
  }, [])

  const cards = [
    { label: 'Total Assignments', value: stats.assignments, icon: '📋', color: 'var(--accent-blue)', bg: 'var(--accent-blue-dim)' },
    { label: 'Active Assignments', value: stats.active, icon: '⚡', color: 'var(--accent-teal)', bg: 'var(--accent-teal-dim)' },
    { label: 'My Team Size', value: stats.team, icon: '👥', color: 'var(--accent-violet)', bg: 'var(--accent-violet-dim)' },
    { label: 'Fleet Assets', value: stats.assets, icon: '🚛', color: 'var(--accent-amber)', bg: 'var(--accent-amber-dim)' },
  ]

>>>>>>> f6bba86028646253c4155e021562d250c6128eda
  return (
    <>
      <Topbar title="Manager Overview" subtitle="Your fleet at a glance" />
      <div className="page-body">
<<<<<<< HEAD
        {/* Manager Profile Card */}
        <div className="card" style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 52, height: 52,
              background: 'var(--accent-blue-dim)',
              border: '1px solid rgba(59,130,246,0.2)',
              borderRadius: 14,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 26
            }}>👔</div>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
                {user?.username}
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
                <span className="badge badge-blue">Manager</span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>GeoGuard Fleet Management System</span>
              </div>
            </div>
          </div>
        </div>

        <div className="stats-grid">
          {[
            { label: 'Total Assignments', value: stats.assignments, icon: '📋', color: 'var(--accent-blue)', bg: 'var(--accent-blue-dim)' },
            { label: 'Active / Scheduled', value: stats.active, icon: '⚡', color: 'var(--accent-teal)', bg: 'var(--accent-teal-dim)' },
            { label: 'My Team', value: stats.team, icon: '👥', color: 'var(--accent-violet)', bg: 'var(--accent-violet-dim)' },
            { label: 'Fleet Assets', value: stats.assets, icon: '🚛', color: 'var(--accent-amber)', bg: 'var(--accent-amber-dim)' },
          ].map(c => (
            <div className="stat-card" key={c.label}>
              <div className="stat-icon" style={{ background: c.bg, color: c.color }}>{c.icon}</div>
              <div>
                <div className="stat-value" style={{ color: c.color }}>{c.value}</div>
                <div className="stat-label">{c.label}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="card" style={{ marginTop: 16 }}>
          <div className="card-header">
            <div className="card-title" style={{ fontSize: 13 }}>ℹ Assignment Status Explained</div>
          </div>
          <div style={{ padding: '8px 20px 16px', display: 'flex', gap: 20, fontSize: 13, color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
            <div><span className="badge badge-blue" style={{ marginRight: 6 }}>Scheduled</span> Assignment created, operator not yet in field</div>
            <div><span className="badge badge-green" style={{ marginRight: 6 }}>Active</span> Operator picked up the asset, in progress</div>
            <div><span className="badge badge-gray" style={{ marginRight: 6 }}>Completed</span> Assignment finished, asset returned to pool</div>
          </div>
        </div>
=======
        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : (
          <div className="stats-grid">
            {cards.map(c => (
              <div className="stat-card" key={c.label}>
                <div className="stat-icon" style={{ background: c.bg, color: c.color }}>{c.icon}</div>
                <div>
                  <div className="stat-value" style={{ color: c.color }}>{c.value}</div>
                  <div className="stat-label">{c.label}</div>
                </div>
              </div>
            ))}
          </div>
        )}
>>>>>>> f6bba86028646253c4155e021562d250c6128eda
      </div>
    </>
  )
}
