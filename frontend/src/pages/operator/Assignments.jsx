import { useState, useEffect } from 'react'
import Topbar from '../../components/Topbar'
import { assignmentsApi } from '../../api'

const statusBadge = (s) => {
  if (s === 'active') return <span className="badge badge-green">● Active</span>
  if (s === 'scheduled') return <span className="badge badge-blue">Scheduled</span>
  return <span className="badge badge-gray">Completed</span>
}

export default function OperatorAssignments() {
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState(null)
  const [noteText, setNoteText] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')

  const fetchMy = () => {
    assignmentsApi.getMy()
      .then(r => setAssignments(r.data.assignments || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchMy() }, [])

  const startEdit = (a) => {
    setEditingId(a.assignment_id)
    setNoteText(a.notes || '')
    setSaveMsg('')
  }

  const cancelEdit = () => {
    setEditingId(null)
    setNoteText('')
    setSaveMsg('')
  }

  const saveNotes = async (assignmentId) => {
    setSaving(true)
    setSaveMsg('')
    try {
      await assignmentsApi.updateNotes({ assignment_id: assignmentId, notes: noteText })
      setSaveMsg('✅ Notes saved')
      fetchMy()
      setTimeout(() => {
        setEditingId(null)
        setSaveMsg('')
      }, 1200)
    } catch (err) {
      setSaveMsg('⚠ ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const activeAssignments = assignments.filter(a => a.status === 'active' || a.status === 'scheduled')
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
                        <th>Notes</th>
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
                          <td style={{ maxWidth: 200 }}>
                            {editingId === a.assignment_id ? (
                              <div>
                                <textarea
                                  className="form-input"
                                  style={{ minHeight: 60, fontSize: 12, padding: '6px 8px' }}
                                  value={noteText}
                                  onChange={e => setNoteText(e.target.value)}
                                  placeholder="Add notes about this assignment..."
                                />
                                {saveMsg && (
                                  <div style={{ fontSize: 11, marginTop: 4, color: saveMsg.startsWith('✅') ? 'var(--accent-teal)' : 'var(--accent-red)' }}>
                                    {saveMsg}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                {a.notes || <em>No notes</em>}
                              </span>
                            )}
                          </td>
                          <td>
                            {editingId === a.assignment_id ? (
                              <div style={{ display: 'flex', gap: 6 }}>
                                <button className="btn btn-primary btn-sm" onClick={() => saveNotes(a.assignment_id)} disabled={saving}>
                                  {saving ? '...' : 'Save'}
                                </button>
                                <button className="btn btn-secondary btn-sm" onClick={cancelEdit}>✕</button>
                              </div>
                            ) : (
                              <button className="btn btn-secondary btn-sm" onClick={() => startEdit(a)}>
                                ✏ Edit Notes
                              </button>
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
                      <tr><th>ID</th><th>Asset</th><th>Plate</th><th>Manager</th><th>Assigned At</th><th>Status</th><th>Notes</th></tr>
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
                          <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{a.notes || '—'}</td>
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
