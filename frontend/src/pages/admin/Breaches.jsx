import { useState, useEffect } from 'react'
import Topbar from '../../components/Topbar'
import { breachesApi } from '../../api'

export default function AdminBreaches() {
  const [geofence, setGeofence] = useState([])
  const [sqli, setSqli] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('geofence')

  useEffect(() => {
    breachesApi.getAll().then(r => {
      setGeofence(r.data.geofence_breaches || [])
      setSqli(r.data.sqli_attempts || [])
    }).catch(console.error).finally(() => setLoading(false))
  }, [])

  const tabs = [
    { key: 'geofence', label: '🗺 Geofence Breaches', count: geofence.length, color: 'var(--accent-red)' },
    { key: 'sqli', label: '💉 SQL Injection Attempts', count: sqli.length, color: 'var(--accent-amber)' },
  ]

  return (
    <>
      <Topbar title="Security Breach Logs" subtitle="Vault database — read only" />
      <div className="page-body">
        <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
          <div className="stat-card" style={{ flex: 1 }}>
            <div className="stat-icon" style={{ background: 'var(--accent-red-dim)', color: 'var(--accent-red)', fontSize: 24 }}>🗺</div>
            <div>
              <div className="stat-value" style={{ color: 'var(--accent-red)' }}>{geofence.length}</div>
              <div className="stat-label">Geofence Breaches</div>
            </div>
          </div>
          <div className="stat-card" style={{ flex: 1 }}>
            <div className="stat-icon" style={{ background: 'var(--accent-amber-dim)', color: 'var(--accent-amber)', fontSize: 24 }}>💉</div>
            <div>
              <div className="stat-value" style={{ color: 'var(--accent-amber)' }}>{sqli.length}</div>
              <div className="stat-label">SQLi Attempts</div>
            </div>
          </div>
          <div className="stat-card" style={{ flex: 1 }}>
            <div className="stat-icon" style={{ background: 'rgba(139,92,246,0.12)', color: 'var(--accent-violet)', fontSize: 24 }}>🛡</div>
            <div>
              <div className="stat-value" style={{ color: 'var(--accent-violet)' }}>{geofence.length + sqli.length}</div>
              <div className="stat-label">Total Incidents</div>
            </div>
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--border)', marginBottom: 20 }}>
            {tabs.map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                style={{
                  padding: '10px 20px',
                  background: 'none',
                  color: tab === t.key ? t.color : 'var(--text-secondary)',
                  borderBottom: tab === t.key ? `2px solid ${t.color}` : '2px solid transparent',
                  fontFamily: 'var(--font-body)',
                  fontWeight: 600,
                  fontSize: 13,
                  transition: 'all 0.15s',
                  marginBottom: -1,
                }}
              >
                {t.label} <span style={{ marginLeft: 6, opacity: 0.7 }}>({t.count})</span>
              </button>
            ))}
          </div>

          {loading ? (
            <div className="loading-center"><div className="spinner" /></div>
          ) : tab === 'geofence' ? (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>ID</th><th>Log ID</th><th>Asset ID</th><th>Zone ID</th><th>Detected At</th></tr>
                </thead>
                <tbody>
                  {geofence.map(b => (
                    <tr key={b.gb_id}>
                      <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>#{b.gb_id}</td>
                      <td>{b.log_id}</td>
                      <td><span className="badge badge-blue">Asset #{b.asset_id}</span></td>
                      <td><span className="badge badge-red">Zone #{b.zone_id}</span></td>
                      <td style={{ fontSize: 12 }}>{new Date(b.detected_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {geofence.length === 0 && (
                <div className="empty-state">
                  <div className="empty-state-icon"></div>
                  <div className="empty-state-text">No geofence breaches recorded</div>
                </div>
              )}
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>ID</th><th>Attacker IP</th><th>Malicious Input</th><th>Session</th><th>Timestamp</th></tr>
                </thead>
                <tbody>
                  {sqli.map(s => (
                    <tr key={s.sb_id}>
                      <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>#{s.sb_id}</td>
                      <td><span className="badge badge-amber">{s.attacker_ip}</span></td>
                      <td>
                        <code style={{ fontSize: 12, color: 'var(--accent-red)', background: 'var(--accent-red-dim)', padding: '2px 8px', borderRadius: 4 }}>
                          {s.malicious_input}
                        </code>
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.session_id}</td>
                      <td style={{ fontSize: 12 }}>{new Date(s.time_stamp).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {sqli.length === 0 && (
                <div className="empty-state">
                  <div className="empty-state-icon"></div>
                  <div className="empty-state-text">No SQL injection attempts recorded</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
