import { useState, useEffect } from 'react'
import Topbar from '../../components/Topbar'
import { assetsApi } from '../../api'

<<<<<<< HEAD
const statusBadge = (s) => {
  if (s === 'in_progress') return <span className="badge badge-amber">● In Progress</span>
=======
function statusBadge(s) {
  if (s === 'in_progress') return <span className="badge badge-amber">In Progress</span>
>>>>>>> f6bba86028646253c4155e021562d250c6128eda
  if (s === 'scheduled') return <span className="badge badge-blue">Scheduled</span>
  return <span className="badge badge-gray">Unscheduled</span>
}

export default function ManagerAssets() {
  const [assets, setAssets] = useState([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(null)

  const fetchAssets = () => {
<<<<<<< HEAD
    assetsApi.getAll().then(r => setAssets(r.data.assets || [])).finally(() => setLoading(false))
=======
    assetsApi.getAll()
      .then(r => setAssets(r.data.assets || []))
      .catch(console.error)
      .finally(() => setLoading(false))
>>>>>>> f6bba86028646253c4155e021562d250c6128eda
  }

  useEffect(() => { fetchAssets() }, [])

<<<<<<< HEAD
  // Manager can only mark an asset "in_progress" (i.e. operator has picked it up)
  // scheduled → set by assignment system automatically
  // unscheduled → set by assignment completion automatically
  const handleMarkInProgress = async (assetId) => {
    setUpdating(assetId)
    try {
      await assetsApi.updateStatus({ asset_id: assetId, scheduled_status: 'in_progress' })
=======
  const handleStatusChange = async (assetId, status) => {
    setUpdating(assetId)
    try {
      await assetsApi.updateStatus({ asset_id: assetId, scheduled_status: status })
>>>>>>> f6bba86028646253c4155e021562d250c6128eda
      fetchAssets()
    } catch (err) {
      alert(err.message)
    } finally {
      setUpdating(null)
    }
  }

  return (
    <>
<<<<<<< HEAD
      <Topbar title="Assets" subtitle="Fleet vehicle status — scheduled/unscheduled is managed by assignments" />
=======
      <Topbar title="Assets" subtitle="View and update fleet vehicle status" />
>>>>>>> f6bba86028646253c4155e021562d250c6128eda
      <div className="page-body">
        <div className="card">
          <div className="card-header">
            <div className="card-title">Fleet Vehicles</div>
<<<<<<< HEAD
            <div style={{ display: 'flex', gap: 8 }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                <span className="badge badge-gray" style={{ marginRight: 4 }}>Unscheduled</span> = available &nbsp;
                <span className="badge badge-blue" style={{ marginRight: 4 }}>Scheduled</span> = assignment pending &nbsp;
                <span className="badge badge-amber" style={{ marginRight: 4 }}>In Progress</span> = in field
              </span>
            </div>
=======
            <span className="badge badge-gray">{assets.length} vehicles</span>
>>>>>>> f6bba86028646253c4155e021562d250c6128eda
          </div>
          {loading ? (
            <div className="loading-center"><div className="spinner" /></div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
<<<<<<< HEAD
                  <tr><th>ID</th><th>Asset Name</th><th>Plate</th><th>Status</th><th>Action</th></tr>
=======
                  <tr>
                    <th>ID</th>
                    <th>Asset Name</th>
                    <th>Plate Number</th>
                    <th>Status</th>
                    <th>Update Status</th>
                  </tr>
>>>>>>> f6bba86028646253c4155e021562d250c6128eda
                </thead>
                <tbody>
                  {assets.map(a => (
                    <tr key={a.asset_id}>
                      <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>#{a.asset_id}</td>
                      <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>🚛 {a.asset_name}</td>
                      <td><span className="badge badge-gray">{a.plate_number}</span></td>
                      <td>{statusBadge(a.scheduled_status)}</td>
                      <td>
<<<<<<< HEAD
                        {a.scheduled_status === 'scheduled' && (
                          <button
                            className="btn btn-secondary btn-sm"
                            disabled={updating === a.asset_id}
                            onClick={() => handleMarkInProgress(a.asset_id)}
                          >
                            {updating === a.asset_id ? '...' : '▶ Mark In Progress'}
                          </button>
                        )}
                        {a.scheduled_status !== 'scheduled' && (
                          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>—</span>
                        )}
=======
                        <select
                          className="form-input"
                          style={{ padding: '5px 10px', fontSize: 12, width: 'auto', minWidth: 140 }}
                          value={a.scheduled_status}
                          onChange={e => handleStatusChange(a.asset_id, e.target.value)}
                          disabled={updating === a.asset_id}
                        >
                          <option value="unscheduled">Unscheduled</option>
                          <option value="scheduled">Scheduled</option>
                          <option value="in_progress">In Progress</option>
                        </select>
>>>>>>> f6bba86028646253c4155e021562d250c6128eda
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
<<<<<<< HEAD
            </div>
          )}
        </div>

        <div className="card" style={{ marginTop: 16 }}>
          <div className="card-header">
            <div className="card-title" style={{ fontSize: 13 }}>ℹ Status Flow</div>
          </div>
          <div style={{ padding: '8px 20px 16px', fontSize: 13, color: 'var(--text-secondary)' }}>
            <strong>Unscheduled</strong> → (create assignment) → <strong>Scheduled</strong> → (mark in progress) → <strong>In Progress</strong> → (complete assignment) → <strong>Unscheduled</strong>
          </div>
        </div>
=======
              {assets.length === 0 && (
                <div className="empty-state">
                  <div className="empty-state-icon">🚛</div>
                  <div className="empty-state-text">No assets registered</div>
                </div>
              )}
            </div>
          )}
        </div>
>>>>>>> f6bba86028646253c4155e021562d250c6128eda
      </div>
    </>
  )
}
