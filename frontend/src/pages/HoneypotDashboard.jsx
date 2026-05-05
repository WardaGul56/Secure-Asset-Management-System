import { useEffect, useState } from 'react'
import { honeypotApi } from '../api'

export default function HoneypotDashboard() {
  const [assets, setAssets] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    honeypotApi.getData()
      .then(r => setAssets(r.data.results || []))
      .catch(() => setAssets([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      fontFamily: 'var(--font-body)',
      color: 'var(--text-primary)'
    }}>
      {/* Fake topbar */}
      <div style={{
        height: 64,
        background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 32px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32,
            background: 'linear-gradient(135deg, var(--accent-teal), var(--accent-blue))',
            borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16
          }}>🛡</div>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16 }}>GeoGuard</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span className="badge badge-green">● System Online</span>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Admin Panel</span>
        </div>
      </div>

      <div style={{ display: 'flex', height: 'calc(100vh - 64px)' }}>
        {/* Fake sidebar */}
        <div style={{
          width: 220,
          background: 'var(--bg-secondary)',
          borderRight: '1px solid var(--border)',
          padding: '20px 12px'
        }}>
          {['Dashboard', 'Assets', 'Users', 'Reports', 'Settings'].map((item, i) => (
            <div key={item} style={{
              padding: '10px 12px',
              borderRadius: 8,
              marginBottom: 2,
              background: i === 1 ? 'var(--accent-teal-dim)' : 'transparent',
              color: i === 1 ? 'var(--accent-teal)' : 'var(--text-secondary)',
              fontSize: 13,
              fontWeight: i === 1 ? 600 : 400,
              cursor: 'default'
            }}>
              {['◈', '🚛', '👤', '📊', '⚙'][i]} &nbsp; {item}
            </div>
          ))}
        </div>

        {/* Fake content */}
        <div style={{ flex: 1, padding: 28, overflowY: 'auto' }}>
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, marginBottom: 4 }}>
              Asset Management
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              All registered fleet vehicles — live data
            </div>
          </div>

          {/* Fake stat cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
            {[
              { label: 'Total Assets', value: assets.length, icon: '🚛', color: 'var(--accent-teal)' },
              { label: 'Active Routes', value: 3, icon: '📍', color: 'var(--accent-blue)' },
              { label: 'Users Online', value: 7, icon: '👤', color: 'var(--accent-violet)' },
              { label: 'Alerts', value: 0, icon: '🛡', color: 'var(--accent-emerald)' },
            ].map(c => (
              <div key={c.label} style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 12,
                padding: '18px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: 14
              }}>
                <div style={{ fontSize: 28 }}>{c.icon}</div>
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800, color: c.color }}>
                    {c.value}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>
                    {c.label}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Asset table */}
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>Fleet Assets</div>
              <span className="badge badge-teal">Live</span>
            </div>

            {loading ? (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
                <div className="spinner" style={{ margin: '0 auto 12px' }} />
                Loading asset data...
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['#', 'Asset Name', 'Last Known Location', 'Status'].map(h => (
                      <th key={h} style={{
                        padding: '10px 16px',
                        textAlign: 'left',
                        fontSize: 11,
                        fontWeight: 600,
                        color: 'var(--text-muted)',
                        textTransform: 'uppercase',
                        letterSpacing: 1
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {assets.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                        No assets found
                      </td>
                    </tr>
                  ) : (
                    assets.map((a, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '13px 16px', fontSize: 12, color: 'var(--text-muted)' }}>{i + 1}</td>
                        <td style={{ padding: '13px 16px', color: 'var(--text-primary)', fontWeight: 500 }}>
                          🚛 {a.asset_name}
                        </td>
                        <td style={{ padding: '13px 16px', fontSize: 13, color: 'var(--text-secondary)' }}>
                          📍 {a.location}
                        </td>
                        <td style={{ padding: '13px 16px' }}>
                          <span className="badge badge-green">● Active</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}