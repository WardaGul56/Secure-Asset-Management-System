import { useState, useEffect } from 'react'
import Topbar from '../../components/Topbar'
import { assetsApi } from '../../api'

const statusBadge = (s) => {
  if (s === 'in_progress') return <span className="badge badge-amber">● In Progress</span>
  if (s === 'scheduled') return <span className="badge badge-blue">Scheduled</span>
  return <span className="badge badge-gray">Unscheduled</span>
}

export default function ManagerAssets() {
  const [assets, setAssets] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchAssets = () => {
    assetsApi.getAll().then(r => setAssets(r.data.assets || [])).finally(() => setLoading(false))
  }

  useEffect(() => { fetchAssets() }, [])

  return (
    <>
      <Topbar title="Assets" subtitle="Fleet vehicle status — scheduled/unscheduled is managed by assignments" />
      <div className="page-body">
        <div className="card">
          <div className="card-header">
            <div className="card-title">Fleet Vehicles</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                <span className="badge badge-gray" style={{ marginRight: 4 }}>Unscheduled</span> = available &nbsp;
                <span className="badge badge-blue" style={{ marginRight: 4 }}>Scheduled</span> = assignment pending &nbsp;
                <span className="badge badge-amber" style={{ marginRight: 4 }}>In Progress</span> = in field
              </span>
            </div>
          </div>
          {loading ? (
            <div className="loading-center"><div className="spinner" /></div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>ID</th><th>Asset Name</th><th>Plate</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {assets.map(a => (
                    <tr key={a.asset_id}>
                      <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>#{a.asset_id}</td>
                      <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>🚛 {a.asset_name}</td>
                      <td><span className="badge badge-gray">{a.plate_number}</span></td>
                      <td>{statusBadge(a.scheduled_status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card" style={{ marginTop: 16 }}>
          <div className="card-header">
            <div className="card-title" style={{ fontSize: 13 }}>ℹ Status Flow</div>
          </div>
          <div style={{ padding: '8px 20px 16px', fontSize: 13, color: 'var(--text-secondary)' }}>
            <strong>Unscheduled</strong> → (create assignment) → <strong>Scheduled</strong> → (operator logs first location) → <strong>In Progress</strong> → (complete assignment) → <strong>Unscheduled</strong>
          </div>
        </div>
      </div>
    </>
  )
}