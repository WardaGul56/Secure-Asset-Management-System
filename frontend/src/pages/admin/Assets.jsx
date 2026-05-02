import { useState, useEffect } from 'react'
import Topbar from '../../components/Topbar'
import { assetsApi } from '../../api'

function statusBadge(s) {
  if (s === 'in_progress') return <span className="badge badge-amber">In Progress</span>
  if (s === 'scheduled') return <span className="badge badge-blue">Scheduled</span>
  if (s === 'unscheduled') return <span className="badge badge-gray">Unscheduled</span>
  return <span className="badge badge-gray">{s}</span>
}

export default function AdminAssets() {
  const [assets, setAssets] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ asset_name: '', plate_number: '' })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const fetchAssets = () => {
    assetsApi.getAll().then(r => setAssets(r.data.assets || [])).finally(() => setLoading(false))
  }

  useEffect(() => { fetchAssets() }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await assetsApi.create(form)
      fetchAssets()
      setShowModal(false)
      setForm({ asset_name: '', plate_number: '' })
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <Topbar
        title="Assets"
        subtitle="Registered fleet vehicles"
        actions={<button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Register Asset</button>}
      />
      <div className="page-body">
        <div className="card">
          <div className="card-header">
            <div className="card-title">Fleet Assets</div>
            <span className="badge badge-gray">{assets.length} vehicles</span>
          </div>
          {loading ? (
            <div className="loading-center"><div className="spinner" /></div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>ID</th><th>Asset Name</th><th>Plate Number</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {assets.map(a => (
                    <tr key={a.asset_id}>
                      <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>#{a.asset_id}</td>
                      <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>🚛 {a.asset_name}</td>
                      <td><span className="badge badge-gray">{a.plate_number}</span></td>
                      <td>{statusBadge(a.scheduled_status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {assets.length === 0 && (
                <div className="empty-state">
                  <div className="empty-state-icon">🚛</div>
                  <div className="empty-state-text">No assets registered yet</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">Register New Asset</div>
            {error && <div className="alert alert-error"><span>⚠</span> {error}</div>}
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label className="form-label">Asset Name</label>
                <input className="form-input" value={form.asset_name} onChange={e => setForm(p => ({ ...p, asset_name: e.target.value }))} required placeholder="e.g. Truck Alpha-01" />
              </div>
              <div className="form-group">
                <label className="form-label">Plate Number</label>
                <input className="form-input" value={form.plate_number} onChange={e => setForm(p => ({ ...p, plate_number: e.target.value }))} required placeholder="e.g. ABC-1234" />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Registering...' : 'Register'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
