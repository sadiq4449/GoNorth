import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import SosButton from '../components/SosButton'
import AdvisoryBar from '../components/AdvisoryBar'
import ChatWidget from '../components/ChatWidget'
import { getCachedBooking } from '../utils/offlineCache'

export default function TouristLayout() {
  const navigate = useNavigate()

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
          <NavLink to="/" className="brand">
            <span className="brand-mark">GN</span>
            <span>
              <strong>GoNorth</strong>
              <small>Plan your trip</small>
            </span>
          </NavLink>
          <nav className="main-nav">
            <NavLink to="/" end>Home</NavLink>
            <NavLink to="/plan">Plan Trip</NavLink>
            <NavLink to="/trip">My Trip</NavLink>
            <NavLink to="/pools">Ride Pools</NavLink>
            <NavLink to="/forum">Forum</NavLink>
          </nav>
          <div className="header-actions">
            <SosButton />
            <NavLink to="/vendor/login" className="header-portal-link">
              Vendor Login
            </NavLink>
          </div>
        </div>
      </header>
      <AdvisoryBar />
      <main><Outlet /></main>
      <ChatWidget />
      <footer className="site-footer">
        <div className="container footer-inner">
          <span>© 2026 GoNorth — Gilgit-Baltistan travel marketplace</span>
          <NavLink to="/vendor/login" className="footer-portal-link">List your business</NavLink>
        </div>
      </footer>
    </div>
  )
}
