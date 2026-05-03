import { useState, useEffect } from 'react'
import Topbar from '../../components/Topbar'
<<<<<<< HEAD
=======
import MapWidget from '../../components/MapWidget'
>>>>>>> f6bba86028646253c4155e021562d250c6128eda
import { zonesApi } from '../../api'

export default function ManagerZones() {
  const [zones, setZones] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
<<<<<<< HEAD
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
=======
    zonesApi.getAll()
      .then(r => setZones(r.data.zones || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <>
      <Topbar title="Zones" subtitle="View-only — contact admin to make changes" />
      <div className="page-body">
        <div className="card section">
          <div className="card-header">
            <div className="card-title">Zone Map</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              <span style={{ color: '#ef4444' }}>■</span> Forbidden &nbsp;
              <span style={{ color: '#00d4aa' }}>■</span> Allowed
            </div>
          </div>
          <MapWidget zones={zones} className="map-container" center={[33.72, 73.04]} />
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">Zone List</div>
            <span className="badge badge-gray">{zones.length} zones</span>
          </div>
          {loading ? (
            <div className="loading-center"><div className="spinner" /></div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>ID</th><th>Zone Name</th><th>Type</th><th>Created By</th></tr>
                </thead>
                <tbody>
                  {zones.map(z => (
                    <tr key={z.zone_id}>
                      <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>#{z.zone_id}</td>
                      <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{z.zone_name}</td>
                      <td>
                        {z.is_forbidden
                          ? <span className="badge badge-red">⛔ Forbidden</span>
                          : <span className="badge badge-green">✅ Allowed</span>}
>>>>>>> f6bba86028646253c4155e021562d250c6128eda
                      </td>
                      <td style={{ fontSize: 12 }}>{z.created_by}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
<<<<<<< HEAD
              {forbidden.length === 0 && <div className="empty-state"><div className="empty-state-icon">🗺</div><div className="empty-state-text">No forbidden zones defined</div></div>}
=======
              {zones.length === 0 && (
                <div className="empty-state">
                  <div className="empty-state-icon">🗺</div>
                  <div className="empty-state-text">No zones defined yet</div>
                </div>
              )}
>>>>>>> f6bba86028646253c4155e021562d250c6128eda
            </div>
          )}
        </div>
      </div>
    </>
  )
}
