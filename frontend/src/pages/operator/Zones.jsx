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

  // Only show forbidden zones to operators
  const forbiddenZones = zones.filter(z => z.is_forbidden)

  return (
    <>
      <Topbar title="Forbidden Zones" subtitle="Areas you must not enter — entry triggers a security alert" />
      <div className="page-body">
        {loading ? (
          <div className="loading-center"><div className="spinner" /><span>Loading zones...</span></div>
        ) : (
          <>
            <div className="card section" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="card-title">Forbidden Zone Map</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  <span style={{ color: '#ef4444' }}>⛔</span> Red areas = Do not enter
                </div>
              </div>
              <MapWidget zones={forbiddenZones} className="map-container-full" center={[33.72, 73.04]} />
            </div>

            <div className="card">
              <div className="card-header">
                <div className="card-title">Forbidden Zones</div>
                <span className="badge badge-red">{forbiddenZones.length} restricted</span>
              </div>
              {forbiddenZones.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">🗺</div>
                  <div className="empty-state-text">No forbidden zones defined</div>
                </div>
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr><th>Zone Name</th><th>Type</th><th>Warning</th></tr>
                    </thead>
                    <tbody>
                      {forbiddenZones.map(z => (
                        <tr key={z.zone_id}>
                          <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{z.zone_name}</td>
                          <td><span className="badge badge-red">⛔ Forbidden</span></td>
                          <td style={{ fontSize: 12, color: 'var(--accent-red)' }}>
                            Entry will trigger a security alert
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  )
}
