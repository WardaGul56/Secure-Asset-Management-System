import { useState, useEffect } from 'react'
import Topbar from '../../components/Topbar'
import MapWidget from '../../components/MapWidget'
import { zonesApi } from '../../api'

export default function OperatorZones() {
  const [zones, setZones] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    zonesApi.getAll()
      .then(r => setZones(r.data.zones || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <>
      <Topbar title="Zone Map" subtitle="Know your boundaries before moving" />
      <div className="page-body">
        {loading ? (
          <div className="loading-center"><div className="spinner" /><span>Loading zones...</span></div>
        ) : (
          <>
            <div className="card section" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="card-title">Live Zone Map</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  <span style={{ color: '#ef4444' }}>⛔</span> Forbidden &nbsp;
                  <span style={{ color: '#00d4aa' }}>✅</span> Allowed
                </div>
              </div>
              <MapWidget zones={zones} className="map-container-full" center={[33.72, 73.04]} />
            </div>

            <div className="card">
              <div className="card-header">
                <div className="card-title">Zone Reference</div>
                <span className="badge badge-red">{zones.filter(z => z.is_forbidden).length} Forbidden</span>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr><th>Zone Name</th><th>Type</th><th>Warning</th></tr>
                  </thead>
                  <tbody>
                    {zones.map(z => (
                      <tr key={z.zone_id}>
                        <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{z.zone_name}</td>
                        <td>
                          {z.is_forbidden
                            ? <span className="badge badge-red">⛔ Forbidden</span>
                            : <span className="badge badge-green">✅ Allowed</span>}
                        </td>
                        <td style={{ fontSize: 12, color: z.is_forbidden ? 'var(--accent-red)' : 'var(--text-muted)' }}>
                          {z.is_forbidden ? 'Entry will trigger security alert' : 'Safe to operate in this area'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {zones.length === 0 && (
                  <div className="empty-state">
                    <div className="empty-state-icon">🗺</div>
                    <div className="empty-state-text">No zones defined yet</div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  )
}
