import { useState } from 'react'
import Topbar from '../../components/Topbar'
import MapWidget from '../../components/MapWidget'
import { locationApi } from '../../api'

export default function OperatorLocation() {
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
      setSuccess(`Location logged. Log ID: #${res.data.log_id}`)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const previewLocation = form.latitude && form.longitude ? [{
    asset_id: parseInt(form.asset_id) || 0,
    asset_name: 'Your Position',
    plate_number: '—',
    op_id: '—',
    latitude: parseFloat(form.latitude),
    longitude: parseFloat(form.longitude),
    timestamp: new Date().toISOString(),
  }] : []

  return (
    <>
      <Topbar title="Log My Location" subtitle="Submit your current GPS position" />
      <div className="page-body">
        <div className="grid-2" style={{ gap: 24, alignItems: 'start' }}>
          <div>
            <div className="card section">
              <div className="card-title" style={{ marginBottom: 20 }}>Submit Location</div>

              {error && <div className="alert alert-error"><span>⚠</span> {error}</div>}
              {success && <div className="alert alert-success"><span>✅</span> {success}</div>}

              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label">Asset ID</label>
                  <input
                    className="form-input"
                    type="number"
                    value={form.asset_id}
                    onChange={e => setForm(p => ({ ...p, asset_id: e.target.value }))}
                    required
                    placeholder="Enter your assigned asset ID"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Latitude</label>
                  <input
                    className="form-input"
                    type="number"
                    step="any"
                    value={form.latitude}
                    onChange={e => setForm(p => ({ ...p, latitude: e.target.value }))}
                    required
                    placeholder="e.g. 33.7215"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Longitude</label>
                  <input
                    className="form-input"
                    type="number"
                    step="any"
                    value={form.longitude}
                    onChange={e => setForm(p => ({ ...p, longitude: e.target.value }))}
                    required
                    placeholder="e.g. 73.0433"
                  />
                </div>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: '100%', justifyContent: 'center' }}
                  disabled={submitting}
                >
                  {submitting ? 'Logging...' : '📍 Submit Location'}
                </button>
              </form>
            </div>

          </div>

          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
              <div className="card-title">Position Preview</div>
            </div>
            <MapWidget
              locations={previewLocation}
              className="map-container"
              center={[33.72, 73.04]}
            />
          </div>
        </div>
      </div>
    </>
  )
}
