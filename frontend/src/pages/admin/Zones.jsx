import { useState, useEffect, useRef } from 'react'
import Topbar from '../../components/Topbar'
import { zonesApi } from '../../api'
import L from 'leaflet'

export default function AdminZones() {
  const [zones, setZones] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [coords, setCoords] = useState('')
  const [form, setForm] = useState({ zone_name: '', is_forbidden: true })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const mapRef = useRef(null)
  const mapInstance = useRef(null)
  const zonesLayerRef = useRef([])

  const fetchZones = () => {
    zonesApi.getAll().then(r => setZones(r.data.zones || [])).finally(() => setLoading(false))
  }

  useEffect(() => { fetchZones() }, [])

  // Init map
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return
    mapInstance.current = L.map(mapRef.current, { center: [33.72, 73.04], zoom: 12 })
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap', maxZoom: 19
    }).addTo(mapInstance.current)
    return () => { if (mapInstance.current) { mapInstance.current.remove(); mapInstance.current = null } }
  }, [])

  // Draw zones on map
  useEffect(() => {
    if (!mapInstance.current) return
    zonesLayerRef.current.forEach(l => l.remove())
    zonesLayerRef.current = []
    zones.forEach(zone => {
      if (!zone.boundary) return
      try {
        const geo = typeof zone.boundary === 'string' ? JSON.parse(zone.boundary) : zone.boundary
        const layer = L.geoJSON(geo, {
          style: {
            color: zone.is_forbidden ? '#ef4444' : '#00d4aa',
            fillColor: zone.is_forbidden ? '#ef4444' : '#00d4aa',
            fillOpacity: 0.1, weight: 2, dashArray: zone.is_forbidden ? '6 4' : null
          }
        }).addTo(mapInstance.current)
          .bindPopup(`<b>${zone.zone_name}</b><br>${zone.is_forbidden ? '⛔ Forbidden' : '✅ Allowed'}`)
        zonesLayerRef.current.push(layer)
      } catch (e) {}
    })
  }, [zones])

  const parseCoords = (raw) => {
    try {
      const pairs = raw.trim().split('\n').map(line => {
        const [lon, lat] = line.trim().split(',').map(Number)
        return [lon, lat]
      })
      if (pairs.some(p => isNaN(p[0]) || isNaN(p[1]))) return null
      return pairs
    } catch { return null }
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    setError('')
    const coordinates = parseCoords(coords)
    if (!coordinates || coordinates.length < 3) {
      setError('Enter at least 3 valid coordinate pairs (longitude, latitude per line)')
      return
    }
    setSubmitting(true)
    try {
      await zonesApi.create({ ...form, coordinates })
      fetchZones()
      setShowModal(false)
      setCoords('')
      setForm({ zone_name: '', is_forbidden: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this zone?')) return
    try {
      await zonesApi.delete(id)
      fetchZones()
    } catch (err) {
      alert(err.message)
    }
  }

  return (
    <>
      <Topbar
        title="Zone Management"
        subtitle="Define and manage geographic boundaries"
        actions={<button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Create Zone</button>}
      />
      <div className="page-body">
        <div className="card section">
          <div className="card-header">
            <div className="card-title">Zone Map</div>
            <div style={{ display: 'flex', gap: 10 }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                <span style={{ color: '#ef4444' }}>■</span> Forbidden &nbsp;
                <span style={{ color: '#00d4aa' }}>■</span> Allowed
              </span>
            </div>
          </div>
          <div ref={mapRef} className="map-container" />
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">All Zones</div>
            <span className="badge badge-gray">{zones.length} zones</span>
          </div>
          {loading ? (
            <div className="loading-center"><div className="spinner" /></div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>ID</th><th>Zone Name</th><th>Type</th><th>Created By</th><th>Action</th></tr>
                </thead>
                <tbody>
                  {zones.map(z => (
                    <tr key={z.zone_id}>
                      <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>#{z.zone_id}</td>
                      <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{z.zone_name}</td>
                      <td>{z.is_forbidden
                        ? <span className="badge badge-red">⛔ Forbidden</span>
                        : <span className="badge badge-green">✅ Allowed</span>}
                      </td>
                      <td style={{ fontSize: 12 }}>{z.created_by}</td>
                      <td>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(z.zone_id)}>Delete</button>
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
          )}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">Create New Zone</div>
            {error && <div className="alert alert-error"><span>⚠</span> {error}</div>}
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label className="form-label">Zone Name</label>
                <input className="form-input" value={form.zone_name} onChange={e => setForm(p => ({ ...p, zone_name: e.target.value }))} required placeholder="e.g. Restricted Warehouse A" />
              </div>
              <div className="form-group">
                <label className="form-label">Zone Type</label>
                <select className="form-input" value={form.is_forbidden} onChange={e => setForm(p => ({ ...p, is_forbidden: e.target.value === 'true' }))}>
                  <option value="true">⛔ Forbidden (restricted area)</option>
                  <option value="false">✅ Allowed (patrol area)</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Coordinates (one per line: longitude, latitude)</label>
                <textarea
                  className="form-input"
                  rows={6}
                  value={coords}
                  onChange={e => setCoords(e.target.value)}
                  placeholder={`73.04, 33.72\n73.06, 33.72\n73.06, 33.74\n73.04, 33.74`}
                  required
                />
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                  Format: longitude, latitude — one coordinate pair per line. Minimum 3 points.
                </div>
              </div>
              
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Creating...' : 'Create Zone'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
