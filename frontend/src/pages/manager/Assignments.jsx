import { useState, useEffect } from 'react'
import Topbar from '../../components/Topbar'
import { assignmentsApi, operatorsApi, assetsApi } from '../../api'

export default function ManagerAssignments() {
  const [assignments, setAssignments] = useState([])
  const [operators, setOperators] = useState([])
  const [assets, setAssets] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ op_id: '', asset_id: '' })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const fetchAll = () => {
    Promise.all([
      assignmentsApi.getAll(),
      operatorsApi.getMyTeam(),
      assetsApi.getAll(),
    ]).then(([a, o, ast]) => {
      setAssignments(a.data.assignments || [])
      setOperators((o.data.operators || []).filter(op => op.active_status))
      setAssets((ast.data.assets || []).filter(a =>
        a.scheduled_status === 'unscheduled' || a.scheduled_status === 'scheduled'
      ))
    }).catch(console.error).finally(() => setLoading(false))
  }

  useEffect(() => { fetchAll() }, [])

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
        actions={<button className="btn btn-primary" onClick={() => setShowModal(true)}>+ New Assignment</button>}
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
                    <th>Action</th>
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
                      <td>
                        {a.status === 'active' && (
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
                    ⚠ No active operators. Toggle operator shift status in My Team.
                  </div>
                )}
              </div>
              <div className="form-group">
                <label className="form-label">Asset (available only)</label>
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
                    ⚠ No available assets. All assets may be actively assigned.
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
