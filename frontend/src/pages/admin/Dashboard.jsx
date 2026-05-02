import { useState, useEffect } from 'react'
import Topbar from '../../components/Topbar'
import { usersApi, assetsApi, zonesApi, breachesApi } from '../../api'

export default function AdminDashboard() {
  const [stats, setStats] = useState({ users: 0, assets: 0, zones: 0, breaches: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      usersApi.getAll(),
      assetsApi.getAll(),
      zonesApi.getAll(),
      breachesApi.getAll(),
    ]).then(([u, a, z, b]) => {
      setStats({
        users: u.data.users?.length || 0,
        assets: a.data.assets?.length || 0,
        zones: z.data.zones?.length || 0,
        breaches: (b.data.geofence_breaches?.length || 0) + (b.data.sqli_attempts?.length || 0),
      })
    }).catch(console.error).finally(() => setLoading(false))
  }, [])

  const cards = [
    { label: 'Total Users', value: stats.users, icon: '👤', color: 'var(--accent-blue)', bg: 'var(--accent-blue-dim)' },
    { label: 'Registered Assets', value: stats.assets, icon: '🚛', color: 'var(--accent-teal)', bg: 'var(--accent-teal-dim)' },
    { label: 'Active Zones', value: stats.zones, icon: '🗺', color: 'var(--accent-violet)', bg: 'var(--accent-violet-dim)' },
    { label: 'Security Incidents', value: stats.breaches, icon: '🛡', color: 'var(--accent-red)', bg: 'var(--accent-red-dim)' },
  ]

  return (
    <>
      <Topbar title="Admin Overview" subtitle="System status and quick metrics" />
      <div className="page-body">
        {loading ? (
          <div className="loading-center"><div className="spinner" /><span>Loading stats...</span></div>
        ) : (
          <>
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

            <div className="card">
              <div className="card-header">
                <div className="card-title">System Status</div>
                <span className="badge badge-green">● All Systems Operational</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                {[
                  { label: 'Main Database', status: 'Online', color: 'badge-green' },
                  { label: 'Vault Database', status: 'Online', color: 'badge-green' },
                  { label: 'Geofence Trigger', status: 'Active', color: 'badge-teal' },
                ].map(s => (
                  <div key={s.label} style={{ padding: '14px 16px', background: 'var(--bg-primary)', borderRadius: 8, border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{s.label}</span>
                    <span className={`badge ${s.color}`}>{s.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  )
}
