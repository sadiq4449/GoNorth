import { useState } from 'react'

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']

export default function SafetyProfileModal({ open, onClose, onSubmit, loading, total }) {
  const [form, setForm] = useState({
    traveler_name: '',
    email: '',
    phone: '',
    emergency_contact: '',
    blood_group: 'O+',
  })

  if (!open) return null

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    onSubmit({
      ...form,
      emergency_contact: form.emergency_contact || null,
      blood_group: form.blood_group || null,
    })
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <span className="portal-badge">Safety details</span>
        <h2>Almost there</h2>
        <p className="modal-lead">
          Optional emergency contact for mountain travel — shared with your driver and support team only.
        </p>
        <p className="modal-total">Total due: <strong>Rs. {total?.toLocaleString()}</strong></p>

        <form className="portal-login-form" onSubmit={handleSubmit}>
          <label>
            Full name
            <input value={form.traveler_name} onChange={(e) => update('traveler_name', e.target.value)} required />
          </label>
          <label>
            Email
            <input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} required />
          </label>
          <label>
            Phone (active SIM)
            <input value={form.phone} onChange={(e) => update('phone', e.target.value)} required placeholder="+92 300 1234567" />
          </label>
          <label>
            Emergency contact
            <input value={form.emergency_contact} onChange={(e) => update('emergency_contact', e.target.value)} placeholder="Relative phone" />
          </label>
          <label>
            Blood group
            <select value={form.blood_group} onChange={(e) => update('blood_group', e.target.value)}>
              {BLOOD_GROUPS.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
          </label>
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary btn-enabled" disabled={loading}>
              {loading ? 'Saving…' : 'Continue to payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
