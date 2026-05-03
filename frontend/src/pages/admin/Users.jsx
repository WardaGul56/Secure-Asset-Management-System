import { useState, useEffect } from 'react'
import Topbar from '../../components/Topbar'
import { usersApi } from '../../api'

function roleBadge(role) {
  if (role === 'admin') return <span className="badge badge-violet">Admin</span>
  if (role === 'manager') return <span className="badge badge-blue">Manager</span>
  return <span className="badge badge-teal">Operator</span>
}

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [managers, setManagers] = useState([])
  const [form, setForm] = useState({ name: '', email: '', role: 'operator', department: '', manager_id: '' })
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const fetchUsers = () => {
    usersApi.getAll()
      .then(r => setUsers(r.data.users || []))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchUsers() }, [])

  // Fetch real manager list from dedicated endpoint
  useEffect(() => {
    if (form.role === 'operator') {
      usersApi.getManagers()
        .then(r => setManagers(r.data.managers || []))
        .catch(() => setManagers([]))
    }
  }, [form.role])

  const handleCreate = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const payload = {
        name: form.name,
        email: form.email,
        role: form.role,
        department: form.role === 'manager' ? form.department : null,
        manager_id: form.role === 'operator' ? form.manager_id : null,
      }
      const res = await usersApi.create(payload)
      setResult(res.data)
      fetchUsers()
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeactivate = async (userId) => {
    if (!window.confirm('Deactivate this user?')) return
    try {
      await usersApi.deactivate({ user_id: userId })
      fetchUsers()
    } catch (err) {
      alert(err.message)
    }
  }

  const closeModal = () => {
    setShowModal(false)
    setResult(null)
    setError('')
    setForm({ name: '', email: '', role: 'operator', department: '', manager_id: '' })
  }

  return (
    <>
      <Topbar
        title="User Management"
        subtitle="Create and manage system accounts"
        actions={<button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Create User</button>}
      />
      <div className="page-body">
        <div className="card">
          <div className="card-header">
            <div className="card-title">All Users</div>
            <span className="badge badge-gray">{users.length} total</span>
          </div>
          {loading ? (
            <div className="loading-center"><div className="spinner" /></div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>ID</th><th>Name</th><th>Email</th><th>Role</th><th>Joined</th><th>Status</th><th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.user_id}>
                      <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>#{u.user_id}</td>
                      <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{u.name}</td>
                      <td>{u.email}</td>
                      <td>{roleBadge(u.role)}</td>
                      <td>{new Date(u.joining_date).toLocaleDateString()}</td>
                      <td>
                        {u.is_active
                          ? <span className="badge badge-green">Active</span>
                          : <span className="badge badge-red">Inactive</span>}
                      </td>
                      <td>
                        {u.is_active && (
                          <button className="btn btn-danger btn-sm" onClick={() => handleDeactivate(u.user_id)}>
                            Deactivate
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {users.length === 0 && (
                <div className="empty-state">
                  <div className="empty-state-icon">👤</div>
                  <div className="empty-state-text">No users found</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            {result ? (
              <>
                <div className="modal-title">✅ User Created</div>
                <div className="alert alert-success">Account created successfully. Share credentials below.</div>
                <div style={{ background: 'var(--bg-primary)', borderRadius: 8, padding: 16, border: '1px solid var(--border)' }}>
                  <div style={{ marginBottom: 10 }}>
                    <div className="form-label">Username</div>
                    <code style={{ color: 'var(--accent-teal)', fontSize: 16 }}>{result.username}</code>
                  </div>
                  <div>
                    <div className="form-label">Default Password</div>
                    <code style={{ color: 'var(--accent-amber)', fontSize: 16 }}>{result.default_password}</code>
                  </div>
                </div>
                <div className="alert alert-warning" style={{ marginTop: 12 }}>
                  <span>⚠</span> Share these credentials securely. Password should be changed after first login.
                </div>
                <div className="modal-footer">
                  <button className="btn btn-primary" onClick={closeModal}>Done</button>
                </div>
              </>
            ) : (
              <>
                <div className="modal-title">Create New User</div>
                {error && <div className="alert alert-error"><span>⚠</span> {error}</div>}
                <form onSubmit={handleCreate}>
                  <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <input className="form-input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required placeholder="Enter full name" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input className="form-input" type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required placeholder="user@example.com" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Role</label>
                    <select className="form-input" value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value, department: '', manager_id: '' }))}>
                      <option value="admin">Admin</option>
                      <option value="manager">Fleet Manager</option>
                      <option value="operator">Operator</option>
                    </select>
                  </div>
                  {form.role === 'manager' && (
                    <div className="form-group">
                      <label className="form-label">Department</label>
                      <select className="form-input" value={form.department} onChange={e => setForm(p => ({ ...p, department: e.target.value }))} required>
                        <option value="">Select department</option>
                        <option value="logistics">Logistics</option>
                        <option value="security_patrol">Security Patrol</option>
                      </select>
                    </div>
                  )}
                  {form.role === 'operator' && (
                    <div className="form-group">
                      <label className="form-label">Assign to Manager</label>
                      <select className="form-input" value={form.manager_id} onChange={e => setForm(p => ({ ...p, manager_id: e.target.value }))} required>
                        <option value="">Select manager</option>
                        {managers.map(m => (
                          <option key={m.manager_id} value={m.manager_id}>
                            {m.name} — {m.department} ({m.manager_id})
                          </option>
                        ))}
                      </select>
                      {managers.length === 0 && (
                        <div style={{ fontSize: 11, color: 'var(--accent-amber)', marginTop: 4 }}>
                          ⚠ No active managers found. Create a manager first.
                        </div>
                      )}
                    </div>
                  )}
                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
                    <button type="submit" className="btn btn-primary" disabled={submitting}>
                      {submitting ? 'Creating...' : 'Create User'}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
