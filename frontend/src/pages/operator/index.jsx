import { useState, useEffect } from 'react'
import Topbar from '../../components/Topbar'
import MapWidget from '../../components/MapWidget'
import { locationApi, zonesApi, honeypotApi } from '../../api'
import { useAuth } from '../../context/AuthContext'

// Operator Dashboard
export function OperatorDashboard() {
  const { user } = useAuth()
  return (
    <>
      <Topbar title="Operator Dashboard" subtitle={`Welcome, ${user?.username}`} />
      <div className="page-body">
        <div className="card">
          <div className="card-header">
            <div className="card-title">Quick Actions</div>
          </div>
          <div className="grid-3" style={{ gap: 16 }}>
            {[
              { label: 'Log My Location', icon: '📍', desc: 'Submit your current GPS position', color: 'var(--accent-teal)' },
              { label: 'View Zones', icon: '🗺', desc: 'See active and forbidden zones', color: 'var(--accent-blue)' },
              { label: 'Asset Search', icon: '🔍', desc: 'Search available assets', color: 'var(--accent-violet)' },
            ].map(a => (
              <div key={a.label} className="stat-card" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 10 }}>
                <div style={{ fontSize: 32 }}>{a.icon}</div>
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: a.color, marginBottom: 4 }}>{a.label}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{a.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}

// Log Location Page
export function OperatorLocation() {
  const [form, setForm] = useState({ asset_id: '', latitude: '', longitude: '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setSubmitting(true)
    try {
      const res = await locationApi.log({
        asset_id: parseInt(form.asset_id),
        latitude: parseFloat(form.latitude),
        longitude: parseFloat(form.longitude),
      })
      setSuccess(`Location logged successfully. Log ID: #${res.data.log_id}`)
      setForm(p => ({ ...p, latitude: '', longitude: '' }))
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <Topbar title="Log My Location" subtitle="Submit your current GPS coordinates" />
      <div className="page-body">
        <div className="grid-2" style={{ gap: 24 }}>
          <div className="card">
            <div className="card-title" style={{ marginBottom: 20 }}>Submit Location</div>
            {error && <div className="alert alert-error"><span>⚠</span> {error}</div>}
            {success && <div className="alert alert-success"><span>✅</span> {success}</div>}
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Asset ID</label>
                <input className="form-input" type="number" value={form.asset_id} onChange={e => setForm(p => ({ ...p, asset_id: e.target.value }))} required placeholder="Enter your assigned asset ID" />
              </div>
              <div className="form-group">
                <label className="form-label">Latitude</label>
                <input className="form-input" type="number" step="any" value={form.latitude} onChange={e => setForm(p => ({ ...p, latitude: e.target.value }))} required placeholder="e.g. 33.7215" />
              </div>
              <div className="form-group">
                <label className="form-label">Longitude</label>
                <input className="form-input" type="number" step="any" value={form.longitude} onChange={e => setForm(p => ({ ...p, longitude: e.target.value }))} required placeholder="e.g. 73.0433" />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={submitting}>
                {submitting ? 'Logging...' : '📍 Submit Location'}
              </button>
            </form>

            <div className="divider" />
            <div className="alert alert-info">
              <div>
                <strong>Test coordinates (inside forbidden zone):</strong><br />
                Lat: <code>33.73</code> &nbsp; Lon: <code>73.05</code><br />
                <span style={{ fontSize: 11, marginTop: 4, display: 'block' }}>This will trigger a geofence breach if zone is set up</span>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-title" style={{ marginBottom: 16 }}>Islamabad Reference Map</div>
            <MapWidget
              locations={form.latitude && form.longitude ? [{
                asset_id: form.asset_id || 0,
                asset_name: 'Your Position',
                plate_number: '—',
                op_id: '—',
                latitude: parseFloat(form.latitude) || 33.72,
                longitude: parseFloat(form.longitude) || 73.04,
                timestamp: new Date().toISOString(),
              }] : []}
              className="map-container"
              center={[33.72, 73.04]}
            />
          </div>
        </div>
      </div>
    </>
  )
}

// Zones View (read-only for operators)
export function OperatorZones() {
  const [zones, setZones] = useState([])
  const [locations, setLocations] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([zonesApi.getAll(), locationApi.latest()])
      .then(([z, l]) => {
        setZones(z.data.zones || [])
        setLocations(l.data.locations || [])
      }).finally(() => setLoading(false))
  }, [])

  return (
    <>
      <Topbar title="Zone Map" subtitle="Active and forbidden areas" />
      <div className="page-body">
        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : (
          <>
            <div className="card section" style={{ padding: 0, overflow: 'hidden' }}>
              <MapWidget locations={locations} zones={zones} className="map-container-full" />
            </div>
            <div className="card">
              <div className="card-header"><div className="card-title">Zone List</div></div>
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Zone Name</th><th>Type</th></tr></thead>
                  <tbody>
                    {zones.map(z => (
                      <tr key={z.zone_id}>
                        <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{z.zone_name}</td>
                        <td>{z.is_forbidden ? <span className="badge badge-red">⛔ Forbidden — Avoid</span> : <span className="badge badge-green">✅ Allowed</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  )
}

// Honeypot Search — looks like a generic asset search tool
export function OperatorSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [searched, setSearched] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!query.trim()) return
    setLoading(true)
    setSearched(false)
    try {
      const res = await honeypotApi.search(query)
      setResults(res.data.results || [])
    } catch (err) {
      setResults([])
    } finally {
      setLoading(false)
      setSearched(true)
    }
  }

  return (
    <>
      <Topbar title="Asset Search" subtitle="Search available assets by name" />
      <div className="page-body">
        <div className="card">
          <div className="card-title" style={{ marginBottom: 20 }}>Search Assets</div>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
            <input
              className="form-input"
              style={{ flex: 1 }}
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Enter asset name to search..."
            />
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Searching...' : '🔍 Search'}
            </button>
          </form>

          {loading && <div className="loading-center"><div className="spinner" /></div>}

          {searched && !loading && (
            results.length > 0 ? (
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Asset Name</th><th>Location</th></tr></thead>
                  <tbody>
                    {results.map((r, i) => (
                      <tr key={i}>
                        <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>🚛 {r.asset_name}</td>
                        <td style={{ fontSize: 13 }}>📍 {r.location}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">🔍</div>
                <div className="empty-state-text">No assets found matching "{query}"</div>
              </div>
            )
          )}
        </div>
      </div>
    </>
  )
}
