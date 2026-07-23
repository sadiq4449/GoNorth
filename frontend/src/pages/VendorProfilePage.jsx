import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchVendorProfile, updateVendorProfile } from '../api/client'

function StatusPill({ status }) {
  const cls = status === 'approved' ? 'status-approved' : status === 'pending' ? 'status-pending' : 'status-suspended'
  return <span className={`status-pill ${cls}`}>{status.toUpperCase()}</span>
}

export default function VendorProfilePage() {
  const [profile, setProfile] = useState(null)
  const [form, setForm] = useState(null)
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchVendorProfile()
      .then((p) => {
        setProfile(p)
        setForm({
          phone: p.phone || '',
          whatsapp: p.whatsapp || '',
          description: p.description || '',
          policies_text: p.policies_text || '',
          solo_safe: p.solo_safe,
          women_friendly: p.women_friendly,
        })
      })
      .catch((e) => setError(e.message))
  }, [])

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const updated = await updateVendorProfile(form)
      setProfile(updated)
      setMsg('Profile updated successfully.')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (!profile || !form) {
    return (
      <div className="container vendor-page">
        <h1>Business profile</h1>
        {error ? <p className="form-error">{error}</p> : <p>Loading profile…</p>}
      </div>
    )
  }

  const isGuide = profile.vendor_type === 'guide'
  const isHotel = profile.vendor_type === 'hotel' || profile.vendor_type === 'mixed'
  const isTransport = profile.vendor_type === 'transport' || profile.vendor_type === 'mixed'
  const isTourOperator = profile.vendor_type === 'tour_operator' || profile.vendor_type === 'mixed'
  const isExperience = profile.vendor_type === 'restaurant' || profile.vendor_type === 'activity' || profile.vendor_type === 'mixed'

  return (
    <div className="container vendor-page vendor-profile-page">
      <Link to="/vendor" className="back-link">← Dashboard</Link>
      <div className="page-toolbar">
        <div>
          <span className="portal-badge">Business profile</span>
          <h1>{profile.business_name}</h1>
          <p className="plan-lead">{profile.valley} · {profile.vendor_type} · {profile.full_name}</p>
        </div>
        <StatusPill status={profile.status} />
      </div>

      {error && <p className="form-error">{error}</p>}
      {msg && <p className="toast-info">{msg}</p>}

      <div className="vendor-profile-grid">
        <section className="vendor-panel">
          <h2>Verification & trust</h2>
          <ul className="vendor-profile-meta">
            <li><strong>KYC:</strong> {profile.kyc_status}</li>
            <li><strong>Physical vetting:</strong> {profile.physically_vetted ? 'Verified' : 'Not yet'}</li>
            <li><strong>Gold badge:</strong> {profile.gold_badge ? 'Yes' : 'No'}</li>
            <li><strong>Featured listing:</strong> {profile.featured ? 'Active' : 'No'}</li>
            {profile.avg_rating != null && (
              <li><strong>Traveler rating:</strong> {profile.avg_rating} ★ ({profile.review_count} reviews)</li>
            )}
          </ul>
          <div className="vendor-profile-links">
            {profile.slug && profile.status === 'approved' && (
              <Link to={`/vendors/${profile.slug}`} className="btn-secondary-link">Public storefront →</Link>
            )}
            <Link to="/vendor/kyc" className="btn-secondary-link">KYC & payouts →</Link>
            {!profile.onboarding_complete && (
              <Link to="/vendor/onboarding" className="btn-secondary-link">Complete setup →</Link>
            )}
          </div>
        </section>

        <section className="vendor-panel">
          <h2>Services & inventory</h2>
          <div className="vendor-kpi-grid">
            {isHotel && <div className="kpi-card"><span>Rooms</span><strong>{profile.room_count}</strong></div>}
            {isTransport && <div className="kpi-card"><span>Vehicles</span><strong>{profile.vehicle_count}</strong></div>}
            {isTransport && <div className="kpi-card"><span>Drivers</span><strong>{profile.driver_count}</strong></div>}
            {isTransport && <div className="kpi-card"><span>Route tariffs</span><strong>{profile.tariff_count}</strong></div>}
            {(isGuide || profile.guide_count > 0) && (
              <div className="kpi-card"><span>Guides</span><strong>{profile.guide_count}</strong></div>
            )}
            {isHotel && <div className="kpi-card"><span>Blocked nights</span><strong>{profile.blocked_nights}</strong></div>}
          </div>
          <div className="vendor-profile-links">
            {isHotel && <Link to="/vendor/inventory" className="btn-secondary-link">Inventory & calendar →</Link>}
            {isTransport && <Link to="/vendor/tariffs" className="btn-secondary-link">Fleet & tariffs →</Link>}
            {isGuide && <Link to="/vendor/guides" className="btn-secondary-link">Manage guides →</Link>}
            {isTourOperator && <Link to="/vendor/packages" className="btn-secondary-link">Tour packages →</Link>}
            {isExperience && <Link to="/vendor/experiences" className="btn-secondary-link">Restaurants & activities →</Link>}
            <Link to="/vendor/trips" className="btn-secondary-link">Bookings & trips →</Link>
          </div>
        </section>
      </div>

      {profile.gallery.length > 0 && (
        <section className="vendor-panel">
          <h2>Portfolio gallery</h2>
          <div className="vendor-gallery-grid">
            {profile.gallery.map((url) => (
              <a key={url} href={url} target="_blank" rel="noreferrer" className="vendor-gallery-item">
                <img src={url} alt="" loading="lazy" />
              </a>
            ))}
          </div>
        </section>
      )}

      <form className="vendor-panel vendor-profile-form" onSubmit={handleSave}>
        <h2>Contact & business information</h2>
        <div className="form-grid-two">
          <label>
            Business email
            <input type="email" value={profile.email} disabled />
          </label>
          <label>
            Phone
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="03XXXXXXXXX" />
          </label>
          <label>
            WhatsApp
            <input value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} placeholder="03XXXXXXXXX" />
          </label>
        </div>
        <label>
          Business description
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={4}
            minLength={10}
            required
            placeholder="Tell travelers about your property, fleet, or guiding experience…"
          />
        </label>
        <label>
          Cancellation & house policies
          <textarea
            value={form.policies_text}
            onChange={(e) => setForm({ ...form, policies_text: e.target.value })}
            rows={4}
            placeholder="Cancellation window, check-in times, safety rules, refund terms…"
          />
        </label>
        <div className="safety-filter-row">
          <label className="check-label">
            <input type="checkbox" checked={form.solo_safe} onChange={(e) => setForm({ ...form, solo_safe: e.target.checked })} />
            Solo-safe business
          </label>
          <label className="check-label">
            <input type="checkbox" checked={form.women_friendly} onChange={(e) => setForm({ ...form, women_friendly: e.target.checked })} />
            Women-friendly
          </label>
        </div>
        <button type="submit" className="btn-primary btn-enabled" disabled={saving}>
          {saving ? 'Saving…' : 'Save profile'}
        </button>
      </form>
    </div>
  )
}
