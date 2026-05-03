import { useState, useEffect } from 'react'
import Topbar from '../../components/Topbar'
import { assignmentsApi } from '../../api'

export default function AdminAssignments() {
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    assignmentsApi.getAll()
      .then(a => setAssignments(a.data.assignments || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <>
      <Topbar
        title="Assignments"
        subtitle="View operator-asset assignments"
      />
      <div className="page-body">
        <div className="card">
          <div className="card-header">
            <div className="card-title">All Assignments</div>
            <span className="badge badge-gray">{assignments.length} total</span>
          </div>
          {loading ? (
            <div className="loading-center"><div className="spinner" /></div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Operator</th>
                    <th>Asset</th>
                    <th>Plate</th>
                    <th>Assigned At</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {assignments.map(a => (
                    <tr key={a.assignment_id}>
                      <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>#{a.assignment_id}</td>
                      <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{a.operator_name}</td>
                      <td>🚛 {a.asset_name}</td>
                      <td><span className="badge badge-gray">{a.plate_number}</span></td>
                      <td style={{ fontSize: 12 }}>{new Date(a.assigned_at).toLocaleDateString()}</td>
                      <td>
                        {a.status === 'active'
                          ? <span className="badge badge-green">● Active</span>
                          : <span className="badge badge-gray">Completed</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {assignments.length === 0 && (
                <div className="empty-state">
                  <div className="empty-state-icon">📋</div>
                  <div className="empty-state-text">No assignments yet</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}