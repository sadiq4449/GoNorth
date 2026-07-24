import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'

const ADMIN_NAV = [
  { to: '/admin', end: true, label: 'Overview' },
  { to: '/admin/vendors', label: 'Vendors & KYC' },
  { to: '/admin/approvals', label: 'Approvals' },
  { to: '/admin/registry', label: 'Registry' },
  { to: '/admin/escrow', label: 'Escrow & Advisories' },
  { to: '/admin/fleet', label: 'Fleet (Demo)' },
  { to: '/admin/trips', label: 'Trips & Audit' },
  { to: '/admin/payouts', label: 'Payouts' },
  { to: '/admin/disputes', label: 'Disputes' },
  { to: '/admin/pricing', label: 'Pricing' },
  { to: '/admin/campaigns', label: 'Campaigns' },
  { to: '/admin/settings', label: 'Settings' },
  { to: '/admin/security', label: 'Security' },
]

export default function AdminLayout() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [navOpen, setNavOpen] = useState(false)

  useEffect(() => {
    setNavOpen(false)
  }, [location.pathname])

  function handleSignOut() {
    logout()
    navigate('/admin/login', { replace: true })
  }

  return (
    <div className="app-shell admin-shell">
      <header className="site-header admin-header">
        <div className="container header-inner admin-header-inner">
          <NavLink to="/admin" className="brand">
            <span className="brand-mark admin-mark">SA</span>
            <span>
              <strong>GoNorth Control Tower</strong>
              <small>Super Admin</small>
            </span>
          </NavLink>

          <nav
            className={`main-nav admin-nav ${navOpen ? 'is-open' : ''}`}
            aria-label="Admin navigation"
            id="admin-main-nav"
          >
            {ADMIN_NAV.map(({ to, end, label }) => (
              <NavLink key={to} to={to} end={end}>{label}</NavLink>
            ))}
            <button type="button" className="btn-secondary admin-outline admin-signout admin-signout--mobile" onClick={handleSignOut}>
              Sign out
            </button>
          </nav>

          <div className="admin-header-actions">
            <button type="button" className="btn-secondary admin-outline admin-signout admin-signout--desktop" onClick={handleSignOut}>
              Sign out
            </button>
            <button
              type="button"
              className="nav-toggle admin-nav-toggle"
              aria-expanded={navOpen}
              aria-controls="admin-main-nav"
              aria-label={navOpen ? 'Close admin menu' : 'Open admin menu'}
              onClick={() => setNavOpen((open) => !open)}
            >
              <span className="nav-toggle-icon" aria-hidden>{navOpen ? '✕' : '☰'}</span>
            </button>
          </div>
        </div>
      </header>
      <main><Outlet /></main>
    </div>
  )
}
