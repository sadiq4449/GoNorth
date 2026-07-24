import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const ADMIN_NAV = [
  { to: '/admin', end: true, label: 'Overview' },
  { to: '/admin/vendors', label: 'Vendors & KYC' },
  { to: '/admin/approvals', label: 'Approvals' },
  { to: '/admin/registry', label: 'Registry' },
  { to: '/admin/escrow', label: 'Escrow & Advisories' },
  { to: '/admin/fleet', label: 'Fleet Map' },
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
          <nav className="main-nav admin-nav">
            {ADMIN_NAV.map(({ to, end, label }) => (
              <NavLink key={to} to={to} end={end}>{label}</NavLink>
            ))}
          </nav>
          <button type="button" className="btn-secondary admin-outline admin-signout" onClick={handleSignOut}>
            Sign out
          </button>
        </div>
      </header>
      <main><Outlet /></main>
    </div>
  )
}
