import { useState, useEffect } from 'react'
import Topbar from '../../components/Topbar'
import { zonesApi } from '../../api'

export default function ManagerZones() {
  const [zones, setZones] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    zonesApi.getAll().then(r => setZones(r.data.zones || [])).finally(() => setLoading(false))
  }, [])

  const forbidden = zones.filter(z => z.is_forbidden)

  return (
    <>
      <Topbar title="Forbidden Zones" subtitle="View-only — contact admin to create or delete zones" />
      <div className="page-body">
        <div className="card">
          <div className="card-header">
            <div className="card-title">Forbidden Zones</div>
            <span className="badge badge-red">{forbidden.length} restricted</span>
          </div>
          {loading ? <div className="loading-center"><div className="spinner" /></div> : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>ID</th><th>Zone Name</th><th>Created By</th></tr></thead>
                <tbody>
                  {forbidden.map(z => (
                    <tr key={z.zone_id}>
                      <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>#{z.zone_id}</td>
                      <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                        <span style={{ color: '#ef4444', marginRight: 6 }}>⛔</span>{z.zone_name}
                      </td>
                      <td style={{ fontSize: 12 }}>{z.created_by}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {forbidden.length === 0 && <div className="empty-state"><div className="empty-state-icon">🗺</div><div className="empty-state-text">No forbidden zones defined</div></div>}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
