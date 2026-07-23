import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchVendorDashboard, vendorBoost } from '../api/client'
import { useAuth } from '../context/AuthContext'

export function VendorDashboardPage() {
  const { user, logout } = useAuth()
  const [dash, setDash] = useState(null)
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')

  useEffect(() => {
    fetchVendorDashboard().then(setDash).catch((e) => setError(e.message))
  }, [])

  const isHotel = dash?.vendor_type === 'hotel' || dash?.vendor_type === 'mixed'
  const isTransport = dash?.vendor_type === 'transport' || dash?.vendor_type === 'mixed'

  async function handleBoost() {
    setError('')
    try {
      const res = await vendorBoost(14)
      setMsg(res.message)
      fetchVendorDashboard().then(setDash)
    } catch (e) {
      setError(e.message)
    }
  }

  return (
    <div className="container vendor-page">
      <div className="page-toolbar">
        <div>
          <span className="portal-badge">Vendor Operations Portal</span>
          <h1>Dashboard</h1>
        </div>
        <button type="button" className="btn-secondary" onClick={logout}>Sign out</button>
      </div>
      <p>Signed in as <strong>{user?.full_name}</strong> ({user?.email})</p>
      {error && <p className="form-error">{error}</p>}
      {msg && <p className="toast-info">{msg}</p>}

      {dash && !dash.onboarding_complete && (
        <div className="onboarding-banner">
          <div>
            <strong>Complete your vendor setup</strong>
            <p>Finish profile, inventory, payout wallet, and KYC to receive bookings and escrow payouts.</p>
          </div>
          <Link to="/vendor/onboarding" className="btn-secondary-link">Continue setup →</Link>
        </div>
      )}

      {dash && (
        <>
          <div className="status-card">
            <h3>{dash.business_name}</h3>
            <p>Valley: {dash.valley} · Type: {dash.vendor_type}</p>
            <span className={`status-pill status-${dash.status}`}>{dash.status.toUpperCase()}</span>
            {dash.featured && (
              <p className="portal-note">⭐ Featured until {dash.featured_until ? new Date(dash.featured_until).toLocaleDateString() : 'soon'}</p>
            )}
            {dash.status === 'pending' && (
              <p className="portal-note">Pending admin approval before tourists see your listings.</p>
            )}
          </div>

          <div className="vendor-kpi-grid">
            {isHotel && <div className="kpi-card"><span>Rooms</span><strong>{dash.room_count}</strong></div>}
            {isTransport && <div className="kpi-card"><span>Vehicles</span><strong>{dash.vehicle_count}</strong></div>}
            {isTransport && <div className="kpi-card"><span>Drivers</span><strong>{dash.driver_count}</strong></div>}
            {isTransport && <div className="kpi-card"><span>Route tariffs</span><strong>{dash.tariff_count}</strong></div>}
            {isHotel && <div className="kpi-card"><span>Blocked nights</span><strong>{dash.blocked_nights}</strong></div>}
          </div>

          <div className="vendor-sub-tabs">
            {isHotel && <Link to="/vendor/inventory" className="vendor-sub-btn">🏨 Inventory & calendar</Link>}
            {isTransport && <Link to="/vendor/tariffs" className="vendor-sub-btn">🚗 Fleet & tariffs</Link>}
            <Link to="/vendor/trips" className="vendor-sub-btn">✅ Trip completion</Link>
            <Link to="/vendor/kyc" className="vendor-sub-btn">🛡️ KYC & payouts</Link>
          </div>

          {!dash.featured && (
            <div className="vendor-panel boost-panel">
              <h3>Boost listing</h3>
              <p className="plan-lead">Pay from wallet to appear at the top of tourist search for 14 days (Rs. 7,000).</p>
              <button type="button" className="btn-primary" onClick={handleBoost}>Boost for 14 days</button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export function VendorPlaceholderPage({ title, subtitle }) {
  return (
    <div className="container placeholder-page">
      <Link to="/vendor" className="back-link">← Dashboard</Link>
      <h1>{title}</h1>
      <p>{subtitle}</p>
    </div>
  )
}
