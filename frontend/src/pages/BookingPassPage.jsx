import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { fetchBooking, fetchCompletionToken } from '../api/client'
import QrVoucher from '../components/QrVoucher'
import { cacheActiveBooking } from '../utils/offlineCache'

export default function BookingPassPage() {
  const { reference } = useParams()
  const [booking, setBooking] = useState(null)
  const [completionToken, setCompletionToken] = useState('')
  const [error, setError] = useState('')
  const [cached, setCached] = useState(false)

  useEffect(() => {
    fetchBooking(reference)
      .then(async (b) => {
        setBooking(b)
        await cacheActiveBooking(b)
        setCached(true)
        return fetchCompletionToken(reference)
      })
      .then((t) => setCompletionToken(t.token))
      .catch((e) => setError(e.message))
  }, [reference])

  if (error) {
    return (
      <div className="container placeholder-page">
        <p className="form-error">{error}</p>
        <Link to="/plan" className="back-link">← Start Your Adventure</Link>
      </div>
    )
  }

  if (!booking) return <div className="container loading-page">Loading pass…</div>

  return (
    <div className="container pass-page">
      <div className="pass-card">
        <span className="pass-badge">You’re all set</span>
        <h1>Your trip pass</h1>
        <p className="pass-meta">{booking.destination} · {booking.nights} nights · {booking.guests} guests — Gilgit-Baltistan</p>

        <QrVoucher token={booking.voucher_token} reference={booking.reference} />

        <div className="pass-details">
          {booking.driver_name && (
            <div><span>Driver</span><strong>{booking.driver_name}{booking.driver_phone && <> · <a href={`tel:${booking.driver_phone}`}>Call</a></>}</strong></div>
          )}
          <div><span>Phone</span><strong>{booking.phone}</strong></div>
          {booking.blood_group && <div><span>Blood group</span><strong>{booking.blood_group}</strong></div>}
          {booking.emergency_contact && <div><span>Emergency</span><strong>{booking.emergency_contact}</strong></div>}
          <div><span>Total paid</span><strong>Rs. {booking.total.toLocaleString()}</strong></div>
          <div><span>Status</span><strong className="status-pill status-approved">{booking.status}</strong></div>
          {booking.escrow && (
            <div><span>Escrow</span><strong>{booking.escrow.status}{booking.escrow.release_at ? ` · release ${new Date(booking.escrow.release_at).toLocaleDateString()}` : ''}</strong></div>
          )}
        </div>

        {completionToken && booking.escrow?.status === 'held' && (
          <div className="completion-qr">
            <h3>Trip completion QR</h3>
            <p className="plan-lead">Show this to your driver at trip end to start escrow release.</p>
            <QrVoucher token={completionToken} reference={`${booking.reference}-done`} />
          </div>
        )}

        {cached && (
          <p className="offline-note">Saved offline — accessible without internet.</p>
        )}

        <div className="pass-actions">
          <Link to={`/trip/${booking.reference}`} className="btn-secondary-link">View trip timeline →</Link>
          <Link to="/plan" className="back-link">Build Your Perfect Trip</Link>
        </div>
      </div>
    </div>
  )
}
