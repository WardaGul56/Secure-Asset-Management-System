import { useState, useEffect } from 'react'
import Topbar from '../../components/Topbar'
import { assignmentsApi, operatorsApi, assetsApi } from '../../api'
<<<<<<< HEAD
import { useAuth } from '../../context/AuthContext'

const statusBadge = (s) => {
  if (s === 'active') return <span className="badge badge-green">● Active</span>
  if (s === 'scheduled') return <span className="badge badge-blue">Scheduled</span>
  return <span className="badge badge-gray">Completed</span>
}

export default function ManagerAssignments() {
  const { user } = useAuth()
=======

export default function ManagerAssignments() {
>>>>>>> f6bba86028646253c4155e021562d250c6128eda
  const [assignments, setAssignments] = useState([])
  const [operators, setOperators] = useState([])
  const [assets, setAssets] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ op_id: '', asset_id: '' })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
<<<<<<< HEAD
  const [isLogistics, setIsLogistics] = useState(false)
=======
>>>>>>> f6bba86028646253c4155e021562d250c6128eda

  const fetchAll = () => {
    Promise.all([
      assignmentsApi.getAll(),
      operatorsApi.getMyTeam(),
      assetsApi.getAll(),
    ]).then(([a, o, ast]) => {
      setAssignments(a.data.assignments || [])
<<<<<<< HEAD
      // Only show ACTIVE operators — never assign to inactive
      setOperators((o.data.operators || []).filter(op => op.active_status))
      // Only assets that are unscheduled (available to schedule)
      setAssets((ast.data.assets || []).filter(a => a.scheduled_status === 'unscheduled'))
    }).catch(console.error).finally(() => setLoading(false))
  }

  useEffect(() => {
    // Detect if this manager is logistics by checking if they get operators
    // (patrol managers won't need assignment creation anyway)
    // We check department from token if available, else allow attempt and let backend reject
    fetchAll()
    // Check if logistics manager (backend enforces, but we hide the button for patrol)
    // If department info were stored in token we'd use it; for now we optimistically show and backend guards
    setIsLogistics(true) // Backend will enforce; UI will show button but backend rejects patrol managers
  }, [])
=======
      setOperators((o.data.operators || []).filter(op => op.active_status))
      setAssets((ast.data.assets || []).filter(a =>
        a.scheduled_status === 'unscheduled' || a.scheduled_status === 'scheduled'
      ))
    }).catch(console.error).finally(() => setLoading(false))
  }

  useEffect(() => { fetchAll() }, [])
>>>>>>> f6bba86028646253c4155e021562d250c6128eda

  const handleCreate = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await assignmentsApi.create({
        op_id: form.op_id,
        asset_id: parseInt(form.asset_id)
      })
      fetchAll()
      setShowModal(false)
      setForm({ op_id: '', asset_id: '' })
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleComplete = async (id) => {
    if (!window.confirm('Mark this assignment as completed?')) return
    try {
      await assignmentsApi.complete({ assignment_id: id })
      fetchAll()
    } catch (err) {
      alert(err.message)
    }
  }

  const closeModal = () => {
    setShowModal(false)
    setError('')
    setForm({ op_id: '', asset_id: '' })
  }

  return (
    <>
      <Topbar
        title="Assignments"
        subtitle="Manage operator-asset assignments"
<<<<<<< HEAD
        actions={
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            + New Assignment
          </button>
        }
=======
        actions={<button className="btn btn-primary" onClick={() => setShowModal(true)}>+ New Assignment</button>}
>>>>>>> f6bba86028646253c4155e021562d250c6128eda
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
<<<<<<< HEAD
                    <th>Manager</th>
=======
>>>>>>> f6bba86028646253c4155e021562d250c6128eda
                    <th>Operator</th>
                    <th>Asset</th>
                    <th>Plate</th>
                    <th>Assigned At</th>
                    <th>Status</th>
<<<<<<< HEAD
                    <th>Notes</th>
=======
>>>>>>> f6bba86028646253c4155e021562d250c6128eda
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {assignments.map(a => (
                    <tr key={a.assignment_id}>
                      <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>#{a.assignment_id}</td>
<<<<<<< HEAD
                      <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{a.manager_id}</td>
=======
>>>>>>> f6bba86028646253c4155e021562d250c6128eda
                      <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{a.operator_name}</td>
                      <td>🚛 {a.asset_name}</td>
                      <td><span className="badge badge-gray">{a.plate_number}</span></td>
                      <td style={{ fontSize: 12 }}>{new Date(a.assigned_at).toLocaleDateString()}</td>
<<<<<<< HEAD
                      <td>{statusBadge(a.status)}</td>
                      <td style={{ fontSize: 12, color: 'var(--text-muted)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {a.notes || '—'}
                      </td>
                      <td>
                        {(a.status === 'active' || a.status === 'scheduled') && (
=======
                      <td>
                        {a.status === 'active'
                          ? <span className="badge badge-green">● Active</span>
                          : <span className="badge badge-gray">Completed</span>}
                      </td>
                      <td>
                        {a.status === 'active' && (
>>>>>>> f6bba86028646253c4155e021562d250c6128eda
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleComplete(a.assignment_id)}
                          >
                            ✓ Complete
                          </button>
                        )}
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

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">Create New Assignment</div>
<<<<<<< HEAD
            <div className="alert alert-info" style={{ marginBottom: 12 }}>
              <span>ℹ</span> Creating an assignment will automatically set the asset status to <strong>Scheduled</strong>. Only logistics managers can create assignments.
            </div>
=======
>>>>>>> f6bba86028646253c4155e021562d250c6128eda
            {error && <div className="alert alert-error"><span>⚠</span> {error}</div>}
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label className="form-label">Operator (active on-shift only)</label>
                <select
                  className="form-input"
                  value={form.op_id}
                  onChange={e => setForm(p => ({ ...p, op_id: e.target.value }))}
                  required
                >
                  <option value="">Select operator</option>
                  {operators.map(o => (
                    <option key={o.op_id} value={o.op_id}>
                      {o.name} ({o.op_id})
                    </option>
                  ))}
                </select>
                {operators.length === 0 && (
                  <div style={{ fontSize: 11, color: 'var(--accent-amber)', marginTop: 4 }}>
<<<<<<< HEAD
                    ⚠ No active operators on shift. Toggle operator shift status in My Team.
=======
                    ⚠ No active operators. Toggle operator shift status in My Team.
>>>>>>> f6bba86028646253c4155e021562d250c6128eda
                  </div>
                )}
              </div>
              <div className="form-group">
<<<<<<< HEAD
                <label className="form-label">Asset (unscheduled/available only)</label>
=======
                <label className="form-label">Asset (available only)</label>
>>>>>>> f6bba86028646253c4155e021562d250c6128eda
                <select
                  className="form-input"
                  value={form.asset_id}
                  onChange={e => setForm(p => ({ ...p, asset_id: e.target.value }))}
                  required
                >
                  <option value="">Select asset</option>
                  {assets.map(a => (
                    <option key={a.asset_id} value={a.asset_id}>
                      🚛 {a.asset_name} — {a.plate_number}
                    </option>
                  ))}
                </select>
                {assets.length === 0 && (
                  <div style={{ fontSize: 11, color: 'var(--accent-amber)', marginTop: 4 }}>
<<<<<<< HEAD
                    ⚠ No unscheduled assets available.
=======
                    ⚠ No available assets. All assets may be actively assigned.
>>>>>>> f6bba86028646253c4155e021562d250c6128eda
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Assigning...' : 'Create Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
