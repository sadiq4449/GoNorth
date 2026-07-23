import { NavLink, Outlet } from 'react-router-dom'

export default function VendorLayout() {
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
            <NavLink to="/vendor/onboarding">Setup</NavLink>
            <NavLink to="/vendor/inventory">Inventory</NavLink>
            <NavLink to="/vendor/tariffs">Tariffs</NavLink>
            <NavLink to="/vendor/trips">Trips</NavLink>
            <NavLink to="/vendor/kyc">KYC</NavLink>
          </nav>
          <NavLink to="/" className="header-portal-link">
            ← Tourist site
          </NavLink>
        </div>
      </header>
      <main><Outlet /></main>
    </div>
  )
}
