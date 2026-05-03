// pages/manager/Dashboard.jsx
import { useState, useEffect } from 'react'
import Topbar from '../../components/Topbar'
import { assignmentsApi, operatorsApi, assetsApi } from '../../api'
import { useAuth } from '../../context/AuthContext'

export function ManagerDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState({ assignments: 0, active: 0, team: 0, assets: 0 })

  useEffect(() => {
    Promise.all([
      assignmentsApi.getAll(),
      operatorsApi.getMyTeam(),
      assetsApi.getAll(),
    ]).then(([a, t, ast]) => {
      const all = a.data.assignments || []
      setStats({
        assignments: all.length,
        active: all.filter(x => x.status === 'active').length,
        team: t.data.operators?.length || 0,
        assets: ast.data.assets?.length || 0,
      })
    }).catch(console.error)
  }, [])

  const dept = user?.username?.includes('manager') ? '' : ''

  return (
    <>
      <Topbar title="Manager Overview" subtitle="Your fleet at a glance" />
      <div className="page-body">
        <div className="stats-grid">
          {[
            { label: 'Total Assignments', value: stats.assignments, icon: '📋', color: 'var(--accent-blue)', bg: 'var(--accent-blue-dim)' },
            { label: 'Active Assignments', value: stats.active, icon: '⚡', color: 'var(--accent-teal)', bg: 'var(--accent-teal-dim)' },
            { label: 'My Team', value: stats.team, icon: '👥', color: 'var(--accent-violet)', bg: 'var(--accent-violet-dim)' },
            { label: 'Fleet Assets', value: stats.assets, icon: '🚛', color: 'var(--accent-amber)', bg: 'var(--accent-amber-dim)' },
          ].map(c => (
            <div className="stat-card" key={c.label}>
              <div className="stat-icon" style={{ background: c.bg, color: c.color }}>{c.icon}</div>
              <div>
                <div className="stat-value" style={{ color: c.color }}>{c.value}</div>
                <div className="stat-label">{c.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

// pages/manager/Assignments.jsx
export function ManagerAssignments() {
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
      setAssets((ast.data.assets || []).filter(a => a.scheduled_status === 'unscheduled' || a.scheduled_status === 'scheduled'))
    }).finally(() => setLoading(false))
  }

  useEffect(() => { fetchAll() }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await assignmentsApi.create({ op_id: form.op_id, asset_id: parseInt(form.asset_id) })
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
                  <tr><th>ID</th><th>Operator</th><th>Asset</th><th>Plate</th><th>Assigned</th><th>Status</th><th>Action</th></tr>
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
                          ? <span className="badge badge-green">Active</span>
                          : <span className="badge badge-gray">Completed</span>}
                      </td>
                      <td>
                        {a.status === 'active' && (
                          <button className="btn btn-secondary btn-sm" onClick={() => handleComplete(a.assignment_id)}>
                            Complete
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
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">Create Assignment</div>
            {error && <div className="alert alert-error"><span>⚠</span> {error}</div>}
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label className="form-label">Operator (active only)</label>
                <select className="form-input" value={form.op_id} onChange={e => setForm(p => ({ ...p, op_id: e.target.value }))} required>
                  <option value="">Select operator</option>
                  {operators.map(o => <option key={o.op_id} value={o.op_id}>{o.name} ({o.op_id})</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Asset (available only)</label>
                <select className="form-input" value={form.asset_id} onChange={e => setForm(p => ({ ...p, asset_id: e.target.value }))} required>
                  <option value="">Select asset</option>
                  {assets.map(a => <option key={a.asset_id} value={a.asset_id}>🚛 {a.asset_name} — {a.plate_number}</option>)}
                </select>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
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

// pages/manager/Team.jsx
export function ManagerTeam() {
  const [operators, setOperators] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchTeam = () => {
    operatorsApi.getMyTeam().then(r => setOperators(r.data.operators || [])).finally(() => setLoading(false))
  }

  useEffect(() => { fetchTeam() }, [])

  const handleToggle = async (opId) => {
    try {
      await operatorsApi.toggle(opId)
      fetchTeam()
    } catch (err) {
      alert(err.message)
    }
  }

  return (
    <>
      <Topbar title="My Team" subtitle="Manage operators on your team" />
      <div className="page-body">
        <div className="card">
          <div className="card-header">
            <div className="card-title">Operators</div>
            <span className="badge badge-gray">{operators.length} total</span>
          </div>
          {loading ? (
            <div className="loading-center"><div className="spinner" /></div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Op ID</th><th>Name</th><th>Username</th><th>Shift Status</th><th>Toggle</th></tr>
                </thead>
                <tbody>
                  {operators.map(o => (
                    <tr key={o.op_id}>
                      <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{o.op_id}</td>
                      <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{o.name}</td>
                      <td style={{ fontSize: 12 }}>{o.username}</td>
                      <td>
                        {o.active_status
                          ? <span className="badge badge-green">● On Shift</span>
                          : <span className="badge badge-gray">○ Off Shift</span>}
                      </td>
                      <td>
                        <button
                          className={`btn btn-sm ${o.active_status ? 'btn-danger' : 'btn-primary'}`}
                          onClick={() => handleToggle(o.op_id)}
                        >
                          {o.active_status ? 'End Shift' : 'Start Shift'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {operators.length === 0 && (
                <div className="empty-state">
                  <div className="empty-state-icon">👥</div>
                  <div className="empty-state-text">No operators in your team</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

// pages/manager/Assets.jsx
export function ManagerAssets() {
  const [assets, setAssets] = useState([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(null)

  const fetchAssets = () => {
    assetsApi.getAll().then(r => setAssets(r.data.assets || [])).finally(() => setLoading(false))
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

  const statusBadge = (s) => {
    if (s === 'in_progress') return <span className="badge badge-amber">In Progress</span>
    if (s === 'scheduled') return <span className="badge badge-blue">Scheduled</span>
    return <span className="badge badge-gray">Unscheduled</span>
  }

  return (
    <>
      <Topbar title="Assets" subtitle="View and update fleet vehicle status" />
      <div className="page-body">
        <div className="card">
          <div className="card-header">
            <div className="card-title">Fleet Vehicles</div>
          </div>
          {loading ? (
            <div className="loading-center"><div className="spinner" /></div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>ID</th><th>Asset Name</th><th>Plate</th><th>Status</th><th>Update Status</th></tr>
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
                          style={{ padding: '5px 10px', fontSize: 12, width: 'auto' }}
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
            </div>
          )}
        </div>
      </div>
    </>
  )
}

// pages/manager/LiveMap.jsx
export function ManagerLiveMap() {
  const [locations, setLocations] = useState([])
  const [zones, setZones] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchData = () => {
    Promise.all([locationApi.latest(), zonesApi.getAll()])
      .then(([l, z]) => {
        setLocations(l.data.locations || [])
        setZones(z.data.zones || [])
      }).catch(console.error).finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 15000)
    return () => clearInterval(interval)
  }, [])

  return (
    <>
      <Topbar title="Live Asset Map" subtitle="Real-time tracking" actions={<button className="btn btn-secondary" onClick={fetchData}>↺ Refresh</button>} />
      <div className="page-body">
        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <MapWidget locations={locations} zones={zones} className="map-container-full" />
          </div>
        )}
      </div>
    </>
  )
}

// pages/manager/Zones.jsx
export function ManagerZones() {
  const [zones, setZones] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    zonesApi.getAll().then(r => setZones(r.data.zones || [])).finally(() => setLoading(false))
  }, [])

  return (
    <>
      <Topbar title="Zones" subtitle="View-only — contact admin to create or delete zones" />
      <div className="page-body">
        <div className="card">
          <div className="card-header">
            <div className="card-title">Defined Zones</div>
          </div>
          {loading ? <div className="loading-center"><div className="spinner" /></div> : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>ID</th><th>Zone Name</th><th>Type</th><th>Created By</th></tr></thead>
                <tbody>
                  {zones.map(z => (
                    <tr key={z.zone_id}>
                      <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>#{z.zone_id}</td>
                      <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{z.zone_name}</td>
                      <td>{z.is_forbidden ? <span className="badge badge-red">⛔ Forbidden</span> : <span className="badge badge-green">✅ Allowed</span>}</td>
                      <td style={{ fontSize: 12 }}>{z.created_by}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {zones.length === 0 && <div className="empty-state"><div className="empty-state-icon">🗺</div><div className="empty-state-text">No zones defined</div></div>}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

// Need these imports at the top
import { locationApi, zonesApi } from '../../api'
import { assetsApi } from '../../api'
