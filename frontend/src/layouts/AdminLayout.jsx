import { NavLink, Outlet } from 'react-router-dom'

const ADMIN_NAV = [
  { to: '/admin', end: true, label: 'Overview' },
  { to: '/admin/escrow', label: 'Escrow' },
  { to: '/admin/vendors', label: 'Vendors & KYC' },
  { to: '/admin/registry', label: 'Registry' },
  { to: '/admin/fleet', label: 'Fleet Map' },
  { to: '/admin/trips', label: 'Trips & Audit' },
  { to: '/admin/payouts', label: 'Payouts' },
  { to: '/admin/disputes', label: 'Disputes' },
  { to: '/admin/pricing', label: 'Pricing' },
  { to: '/admin/campaigns', label: 'Campaigns' },
]

export default function AdminLayout() {
  return (
    <div className="app-shell admin-shell">
      <header className="site-header admin-header">
        <div className="container header-inner">
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
        </div>
      </header>
      <main><Outlet /></main>
    </div>
  )
}
