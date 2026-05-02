import { useState, useEffect } from 'react'
import Topbar from '../../components/Topbar'
import { operatorsApi } from '../../api'

export default function ManagerTeam() {
  const [operators, setOperators] = useState([])
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState(null)

  const fetchTeam = () => {
    operatorsApi.getMyTeam()
      .then(r => setOperators(r.data.operators || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchTeam() }, [])

  const handleToggle = async (opId) => {
    setToggling(opId)
    try {
      await operatorsApi.toggle(opId)
      fetchTeam()
    } catch (err) {
      alert(err.message)
    } finally {
      setToggling(null)
    }
  }

  const onShift = operators.filter(o => o.active_status).length
  const offShift = operators.filter(o => !o.active_status).length

  return (
    <>
      <Topbar title="My Team" subtitle="Manage your operators' shift status" />
      <div className="page-body">
        <div className="stats-grid" style={{ marginBottom: 24 }}>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'var(--accent-emerald-dim)', color: 'var(--accent-emerald)' }}>👤</div>
            <div>
              <div className="stat-value" style={{ color: 'var(--accent-emerald)' }}>{onShift}</div>
              <div className="stat-label">On Shift</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'rgba(75,85,99,0.2)', color: 'var(--text-secondary)' }}>👤</div>
            <div>
              <div className="stat-value">{offShift}</div>
              <div className="stat-label">Off Shift</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'var(--accent-blue-dim)', color: 'var(--accent-blue)' }}>👥</div>
            <div>
              <div className="stat-value" style={{ color: 'var(--accent-blue)' }}>{operators.length}</div>
              <div className="stat-label">Total Operators</div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">Team Members</div>
          </div>
          {loading ? (
            <div className="loading-center"><div className="spinner" /></div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Op ID</th>
                    <th>Full Name</th>
                    <th>Username</th>
                    <th>Shift Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {operators.map(o => (
                    <tr key={o.op_id}>
                      <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{o.op_id}</td>
                      <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{o.name}</td>
                      <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{o.username}</td>
                      <td>
                        {o.active_status
                          ? <span className="badge badge-green">● On Shift</span>
                          : <span className="badge badge-gray">○ Off Shift</span>}
                      </td>
                      <td>
                        <button
                          className={`btn btn-sm ${o.active_status ? 'btn-danger' : 'btn-primary'}`}
                          onClick={() => handleToggle(o.op_id)}
                          disabled={toggling === o.op_id}
                        >
                          {toggling === o.op_id ? '...' : o.active_status ? 'End Shift' : 'Start Shift'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {operators.length === 0 && (
                <div className="empty-state">
                  <div className="empty-state-icon">👥</div>
                  <div className="empty-state-text">No operators assigned to your team</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
