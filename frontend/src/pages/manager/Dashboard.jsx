import { useState, useEffect } from 'react'
import Topbar from '../../components/Topbar'
import { assignmentsApi, operatorsApi, assetsApi } from '../../api'

export default function ManagerDashboard() {
  const [stats, setStats] = useState({ assignments: 0, active: 0, team: 0, assets: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      assignmentsApi.getAll(),
      operatorsApi.getMyTeam(),
      assetsApi.getAll(),
    ]).then(([a, t, ast]) => {
      const all = a.data.assignments || []
      setStats({
        assignments: all.length,
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

  return (
    <>
      <Topbar title="Manager Overview" subtitle="Your fleet at a glance" />
      <div className="page-body">
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
      </div>
    </>
  )
}
