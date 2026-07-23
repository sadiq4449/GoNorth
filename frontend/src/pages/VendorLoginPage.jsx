import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { login, registerVendor, smsVendorRegister } from '../api/client'
import { useAuth } from '../context/AuthContext'
import BrandLogo from '../components/BrandLogo'

export default function VendorLoginPage() {
  const [mode, setMode] = useState('login')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { loginSuccess } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname

  const [smsPhone, setSmsPhone] = useState('')
  const [smsMessage, setSmsMessage] = useState('REG HOTEL My Guest House')
  const [smsMsg, setSmsMsg] = useState('')
  const [form, setForm] = useState({
    email: '',
    password: '',
    full_name: '',
    business_name: '',
    vendor_type: 'hotel',
    valley: 'Skardu',
  })

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSmsRegister(e) {
    e.preventDefault()
    setSmsMsg('')
    try {
      const lead = await smsVendorRegister({ phone: smsPhone, message: smsMessage })
      setSmsMsg(`Lead captured: ${lead.business_name} (${lead.parsed_type}) — admin will follow up.`)
    } catch (err) {
      setSmsMsg(err.message)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      let result
      if (mode === 'login') {
        result = await login(form.email, form.password)
      } else {
        result = await registerVendor(form)
      }
      if (result.user.role !== 'vendor') {
        throw new Error('This account is not a vendor. Use the correct portal.')
      }
      loginSuccess(result.access_token, result.user)
      navigate(
        mode === 'register' ? '/vendor/onboarding' : (from && from.startsWith('/vendor') ? from : '/vendor')
      )
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="portal-login-page">
      <div className="portal-login-card">
        <Link to="/" className="portal-brand-link">
          <BrandLogo className="portal-brand-logo" />
        </Link>
        <span className="portal-badge">Vendor Portal</span>
        <h1>{mode === 'login' ? 'Sign in' : 'Register your business'}</h1>
        <p>Hotels, drivers, and guides — separate from the tourist trip planner.</p>

        <div className="auth-tabs">
          <button type="button" className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>Login</button>
          <button type="button" className={mode === 'register' ? 'active' : ''} onClick={() => setMode('register')}>Register</button>
        </div>

        <form className="portal-login-form" onSubmit={handleSubmit}>
          {mode === 'register' && (
            <>
              <label>Your name<input value={form.full_name} onChange={(e) => update('full_name', e.target.value)} required /></label>
              <label>Business name<input value={form.business_name} onChange={(e) => update('business_name', e.target.value)} required /></label>
              <label>Type
                <select value={form.vendor_type} onChange={(e) => update('vendor_type', e.target.value)}>
                  <option value="hotel">Hotel / Hostel</option>
                  <option value="transport">Transport</option>
                  <option value="guide">Guide</option>
                </select>
              </label>
              <label>Valley<input value={form.valley} onChange={(e) => update('valley', e.target.value)} required /></label>
            </>
          )}
          <label>Email<input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} required /></label>
          <label>Password<input type="password" value={form.password} onChange={(e) => update('password', e.target.value)} minLength={6} required /></label>
          {error && <p className="form-error">{error}</p>}
          <button type="submit" className="btn-primary btn-enabled" disabled={loading}>
            {loading ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>
        <p className="portal-note">Demo: hostel@skardu.com / vendor123</p>

        <form className="portal-login-form sms-register-form" onSubmit={handleSmsRegister}>
          <h2>SMS-lite registration</h2>
          <p className="plan-lead">No smartphone? Simulate texting <code>REG HOTEL Name</code> or <code>REG TRANSPORT Name</code>.</p>
          <label>Phone<input value={smsPhone} onChange={(e) => setSmsPhone(e.target.value)} required minLength={10} placeholder="03XXXXXXXXX" /></label>
          <label>Message<input value={smsMessage} onChange={(e) => setSmsMessage(e.target.value)} required minLength={8} /></label>
          {smsMsg && <p className="portal-note">{smsMsg}</p>}
          <button type="submit" className="btn-secondary">Submit SMS lead</button>
        </form>

        <Link to="/" className="back-link">← Back to tourist site</Link>
      </div>
    </div>
  )
}
