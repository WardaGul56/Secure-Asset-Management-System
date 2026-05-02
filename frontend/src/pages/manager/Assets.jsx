import { useState, useEffect } from 'react'
import Topbar from '../../components/Topbar'
import { assetsApi } from '../../api'

function statusBadge(s) {
  if (s === 'in_progress') return <span className="badge badge-amber">In Progress</span>
  if (s === 'scheduled') return <span className="badge badge-blue">Scheduled</span>
  return <span className="badge badge-gray">Unscheduled</span>
}

export default function ManagerAssets() {
  const [assets, setAssets] = useState([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(null)

  const fetchAssets = () => {
    assetsApi.getAll()
      .then(r => setAssets(r.data.assets || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchAssets() }, [])

  const handleStatusChange = async (assetId, status) => {
    setUpdating(assetId)
    try {
      await assetsApi.updateStatus({ asset_id: assetId, scheduled_status: status })
      fetchAssets()
    } catch (err) {
      alert(err.message)
    } finally {
      setUpdating(null)
    }
  }

  return (
    <>
      <Topbar title="Assets" subtitle="View and update fleet vehicle status" />
      <div className="page-body">
        <div className="card">
          <div className="card-header">
            <div className="card-title">Fleet Vehicles</div>
            <span className="badge badge-gray">{assets.length} vehicles</span>
          </div>
          {loading ? (
            <div className="loading-center"><div className="spinner" /></div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Asset Name</th>
                    <th>Plate Number</th>
                    <th>Status</th>
                    <th>Update Status</th>
                  </tr>
                </thead>
                <tbody>
                  {assets.map(a => (
                    <tr key={a.asset_id}>
                      <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>#{a.asset_id}</td>
                      <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>🚛 {a.asset_name}</td>
                      <td><span className="badge badge-gray">{a.plate_number}</span></td>
                      <td>{statusBadge(a.scheduled_status)}</td>
                      <td>
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
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {assets.length === 0 && (
                <div className="empty-state">
                  <div className="empty-state-icon">🚛</div>
                  <div className="empty-state-text">No assets registered</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
