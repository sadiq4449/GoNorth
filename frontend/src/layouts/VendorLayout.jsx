import { NavLink, Outlet } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { fetchVendorDashboard } from '../api/client'
import { useAuth } from '../context/AuthContext'

export default function VendorLayout() {
  const { logout } = useAuth()
  const [vendorType, setVendorType] = useState(null)

  useEffect(() => {
    fetchVendorDashboard()
      .then((d) => setVendorType(d.vendor_type))
      .catch(() => setVendorType(null))
  }, [])

  const isHotel = vendorType === 'hotel' || vendorType === 'mixed'
  const isTransport = vendorType === 'transport' || vendorType === 'mixed'
  const isGuide = vendorType === 'guide'

  return (
    <div className="app-shell vendor-shell">
      <header className="site-header vendor-header">
        <div className="container header-inner">
          <NavLink to="/vendor" className="brand">
            <span className="brand-mark vendor-mark">VN</span>
            <span>
              <strong>GoNorth Vendor</strong>
              <small>Manage your listings</small>
            </span>
          </NavLink>
          <nav className="main-nav">
            <NavLink to="/vendor" end>Dashboard</NavLink>
            <NavLink to="/vendor/profile">Profile</NavLink>
            {isHotel && <NavLink to="/vendor/inventory">Inventory</NavLink>}
            {isTransport && <NavLink to="/vendor/tariffs">Tariffs</NavLink>}
            {isGuide && <NavLink to="/vendor/guides">Guides</NavLink>}
            <NavLink to="/vendor/trips">Trips</NavLink>
            <NavLink to="/vendor/kyc">KYC</NavLink>
            <NavLink to="/vendor/onboarding">Setup</NavLink>
          </nav>
          <div className="header-actions">
            <NavLink to="/" className="header-portal-link">← Tourist site</NavLink>
            <button type="button" className="btn-secondary btn-compact" onClick={logout}>Sign out</button>
          </div>
        </div>
      </header>
      <main><Outlet /></main>
    </div>
  )
}
