import { useState, useEffect } from 'react'
import Topbar from '../../components/Topbar'
import { assignmentsApi } from '../../api'

const statusBadge = (s) => {
  if (s === 'active') return <span className="badge badge-green">● Active</span>
  return <span className="badge badge-gray">Completed</span>
}

export default function OperatorAssignments() {
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchMy = () => {
    assignmentsApi.getMy()
      .then(r => setAssignments(r.data.assignments || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchMy() }, [])

  const handleComplete = async (id) => {
    if (!window.confirm('Mark this assignment as completed?')) return
    try {
      await assignmentsApi.complete({ assignment_id: id })
      fetchMy()
    } catch (err) {
      alert(err.message)
    }
  }

  const activeAssignments = assignments.filter(a => a.status === 'active')
  const pastAssignments = assignments.filter(a => a.status === 'completed')

  return (
    <>
      <Topbar title="My Assignments" subtitle="View your current and past assignments" />
      <div className="page-body">
        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : (
          <>
            <div className="card" style={{ marginBottom: 20 }}>
              <div className="card-header">
                <div className="card-title">Current Assignments</div>
                <span className="badge badge-green">{activeAssignments.length} active</span>
              </div>
              {activeAssignments.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">📋</div>
                  <div className="empty-state-text">No active assignments</div>
                </div>
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Asset</th>
                        <th>Plate</th>
                        <th>Manager</th>
                        <th>Assigned At</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeAssignments.map(a => (
                        <tr key={a.assignment_id}>
                          <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>#{a.assignment_id}</td>
                          <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>🚛 {a.asset_name}</td>
                          <td><span className="badge badge-gray">{a.plate_number}</span></td>
                          <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{a.manager_id}</td>
                          <td style={{ fontSize: 12 }}>{new Date(a.assigned_at).toLocaleDateString()}</td>
                          <td>{statusBadge(a.status)}</td>
                          <td>
                            {a.status === 'active' ? (
                              <button className="btn btn-primary btn-sm" onClick={() => handleComplete(a.assignment_id)}>
                                ✓ Complete
                              </button>
                            ) : (
                              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="card">
              <div className="card-header">
                <div className="card-title">Past Assignments</div>
                <span className="badge badge-gray">{pastAssignments.length} completed</span>
              </div>
              {pastAssignments.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">📂</div>
                  <div className="empty-state-text">No past assignments</div>
                </div>
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr><th>ID</th><th>Asset</th><th>Plate</th><th>Manager</th><th>Assigned At</th><th>Status</th></tr>
                    </thead>
                    <tbody>
                      {pastAssignments.map(a => (
                        <tr key={a.assignment_id}>
                          <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>#{a.assignment_id}</td>
                          <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>🚛 {a.asset_name}</td>
                          <td><span className="badge badge-gray">{a.plate_number}</span></td>
                          <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{a.manager_id}</td>
                          <td style={{ fontSize: 12 }}>{new Date(a.assigned_at).toLocaleDateString()}</td>
                          <td>{statusBadge(a.status)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  )
}