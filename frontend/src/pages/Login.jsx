import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi } from '../api'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await authApi.login(form)
      const { token, role, username } = res.data
      login(token, { username, role })
      if (role === 'admin') navigate('/admin')
      else if (role === 'manager') navigate('/manager')
      else navigate('/operator')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-bg" />
      <div className="login-card">
        <div className="login-logo">
          <div className="login-logo-icon">🛡</div>
          <div>
            <div className="login-logo-text">GeoGuard</div>
            <div className="login-logo-sub">Secure Asset Management</div>
          </div>
        </div>

        <h2 className="login-heading">Welcome back</h2>
        <p className="login-sub">Sign in to your account to continue</p>

        {error && (
          <div className="alert alert-error">
            <span>⚠</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Username</label>
            <input
              className="form-input"
              type="text"
              placeholder="e.g. admin_001"
              value={form.username}
              onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              className="form-input"
              type="password"
              placeholder="Enter your password"
              value={form.password}
              onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
              required
            />
          </div>
          <button className="login-btn" type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In →'}
          </button>
        </form>

        <div style={{ marginTop: 24, padding: '14px 16px', background: 'rgba(59,130,246,0.08)', borderRadius: 8, border: '1px solid rgba(59,130,246,0.15)' }}>
          <div style={{ fontSize: 11, color: '#3b82f6', fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>Default Credentials</div>
          <div style={{ fontSize: 12, color: '#8899bb' }}>Username and password are the same as the assigned username (e.g. <code style={{ color: '#00d4aa' }}>admin_001</code>)</div>
        </div>
      </div>
    </div>
  )
}
