import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import SosButton from '../components/SosButton'
import AdvisoryBar from '../components/AdvisoryBar'
import ChatWidget from '../components/ChatWidget'
import { getCachedBooking } from '../utils/offlineCache'
import { BRAND_LOGO_ALT, BRAND_LOGO_URL } from '../lib/brand'

const NAV_LINKS = [
  { to: '/', end: true, label: 'Home' },
  { to: '/packages', label: 'Packages' },
  { to: '/destinations', label: 'Destinations' },
  { to: '/explore', label: 'Explore' },
  { to: '/plan', label: 'Plan Trip' },
  { to: '/trip', label: 'Your Trip' },
  { to: '/pools', label: 'Ride Pools' },
  { to: '/forum', label: 'Forum' },
]

export default function TouristLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const [navOpen, setNavOpen] = useState(false)

  useEffect(() => {
    setNavOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!navigator.onLine) {
      getCachedBooking().then((b) => {
        if (b?.reference && window.location.pathname === '/') {
          navigate('/trip', { replace: true })
        }
      })
    }
  }, [navigate])

  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="container header-inner">
          <NavLink to="/" className="brand brand--logo">
            <img src={BRAND_LOGO_URL} alt={BRAND_LOGO_ALT} className="brand-logo" width={220} height={44} />
          </NavLink>
          <button
            type="button"
            className="nav-toggle"
            aria-expanded={navOpen}
            aria-label={navOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setNavOpen((open) => !open)}
          >
            {navOpen ? '✕' : '☰'}
          </button>
          <nav className={`main-nav ${navOpen ? 'is-open' : ''}`} aria-label="Main">
            {NAV_LINKS.map((link) => (
              <NavLink key={link.to} to={link.to} end={link.end}>
                {link.label}
              </NavLink>
            ))}
          </nav>
          <div className="header-actions">
            <SosButton />
            <NavLink to="/vendor/login" className="header-portal-link">
              Partner login
            </NavLink>
          </div>
        </div>
      </header>
      <AdvisoryBar />
      <main><Outlet /></main>
      <ChatWidget />
      <footer className="site-footer">
        <div className="container footer-inner">
          <div className="footer-brand">
            <img src={BRAND_LOGO_URL} alt="" className="footer-logo" width={180} height={36} aria-hidden="true" />
            <span>© 2026 GoNorth — The Gilgit-Baltistan travel marketplace</span>
          </div>
          <NavLink to="/vendor/login" className="footer-portal-link">List your business</NavLink>
        </div>
      </footer>
    </div>
  )
}
