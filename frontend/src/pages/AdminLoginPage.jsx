import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { login } from '../api/client'
import { useAuth } from '../context/AuthContext'

export default function AdminLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { loginSuccess } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const result = await login(email, password)
      if (result.user.role !== 'admin') {
        throw new Error('Admin access only.')
      }
      loginSuccess(result.access_token, result.user)
      navigate('/admin')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="portal-login-page admin-login-page">
      <div className="portal-login-card">
        <span className="portal-badge admin-badge">Super Admin</span>
        <h1>Control Tower sign in</h1>
        <p>Platform operators only — not linked from public tourist site.</p>
        <form className="portal-login-form" onSubmit={handleSubmit}>
          <label>Admin email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
          <label>Password<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></label>
          {error && <p className="form-error">{error}</p>}
          <button type="submit" className="btn-primary admin-btn btn-enabled" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        <p className="portal-note">Demo: admin@baltitour.com / admin123</p>
        <p className="portal-note">Run <code>python -m app.seed</code> in backend if the account does not exist yet.</p>
      </div>
    </div>
  )
}
