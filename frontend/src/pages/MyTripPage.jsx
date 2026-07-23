import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchBooking, fetchPointsBalance, fetchReviews, fileBookingDispute, postReview } from '../api/client'
import { cacheActiveBooking, getCachedBooking } from '../utils/offlineCache'

export default function MyTripPage() {
  const [booking, setBooking] = useState(null)
  const [lookupRef, setLookupRef] = useState('')
  const [lookupEmail, setLookupEmail] = useState('')
  const [lookupLoading, setLookupLoading] = useState(false)
  const [lookupError, setLookupError] = useState('')
  const [pointsBalance, setPointsBalance] = useState(null)
  const [reviews, setReviews] = useState([])
  const [disputeReason, setDisputeReason] = useState('')
  const [reviewForm, setReviewForm] = useState({ author_name: '', rating: 5, body: '', photo_url: '' })
  const [msg, setMsg] = useState('')
  const [actionError, setActionError] = useState('')

  useEffect(() => {
    getCachedBooking()
      .then((b) => {
        if (b) setBooking(b)
        if (b?.email) {
          fetchPointsBalance(b.email, b.subtotal || 0)
            .then((p) => setPointsBalance(p.balance))
            .catch(() => {})
        }
        if (b?.traveler_name) {
          setReviewForm((f) => ({ ...f, author_name: b.traveler_name }))
        }
      })
      .catch(() => {})
    fetchReviews().then(setReviews).catch(() => {})
  }, [])

  async function recoverBooking(e) {
    e.preventDefault()
    if (!lookupRef.trim()) return
    setLookupLoading(true)
    setLookupError('')
    try {
      const b = await fetchBooking(lookupRef.trim())
      await cacheActiveBooking(b)
      setBooking(b)
      if (b.email) setLookupEmail(b.email)
      if (b.traveler_name) setReviewForm((f) => ({ ...f, author_name: b.traveler_name }))
    } catch (err) {
      setLookupError('Booking not found. Check your reference code from your confirmation email.')
    } finally {
      setLookupLoading(false)
    }
  }

  async function submitDispute(e) {
    e.preventDefault()
    if (!booking?.reference) return
    setActionError('')
    try {
      await fileBookingDispute(booking.reference, {
        filed_by: booking.email || booking.traveler_name,
        reason: disputeReason,
      })
      setMsg('Dispute filed — escrow is on hold until admin review.')
      setDisputeReason('')
    } catch (err) {
      setActionError(err.message)
    }
  }

  async function submitReview(e) {
    e.preventDefault()
    if (!booking?.reference) return
    setActionError('')
    try {
      await postReview({ ...reviewForm, booking_reference: booking.reference })
      setMsg('Thanks — your review is live for other travelers.')
      fetchReviews().then(setReviews)
      setReviewForm((f) => ({ ...f, body: '', photo_url: '' }))
    } catch (err) {
      setActionError(err.message)
    }
  }

  if (!booking) {
    return (
      <div className="container my-trip-page">
        <h1>My Trip</h1>
        <p className="plan-lead">Retrieve your booking with the reference from your confirmation.</p>

        <form className="vendor-panel trip-recovery-form" onSubmit={recoverBooking}>
          <label>
            Booking reference
            <input
              value={lookupRef}
              onChange={(e) => setLookupRef(e.target.value)}
              placeholder="e.g. GN-20250723-ABC123"
              required
            />
          </label>
          <label>
            Email (optional, for BaltiPoints)
            <input
              type="email"
              value={lookupEmail}
              onChange={(e) => setLookupEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </label>
          {lookupError && <p className="form-error">{lookupError}</p>}
          <button type="submit" className="btn-primary btn-enabled" disabled={lookupLoading}>
            {lookupLoading ? 'Looking up…' : 'Find my trip'}
          </button>
        </form>

        <p className="meta">Or <Link to="/plan">plan a new trip</Link> if you have not booked yet.</p>
      </div>
    )
  }

  return (
    <div className="container my-trip-page">
      <h1>My Trip</h1>
      <p>{booking.destination} · {booking.reference}</p>
      {actionError && <p className="form-error">{actionError}</p>}
      {(booking.points_earned > 0 || pointsBalance != null) && (
        <div className="points-wallet-card">
          <strong>BaltiPoints wallet</strong>
          <p>Balance: {pointsBalance ?? '…'} pts · earned on this trip: {booking.points_earned || 0}</p>
          {booking.points_redeemed > 0 && (
            <p className="muted">Redeemed {booking.points_redeemed} pts (−Rs. {booking.points_discount?.toLocaleString()})</p>
          )}
        </div>
      )}
      {booking.driver_name && (
        <p className="driver-contact">
          Driver: <strong>{booking.driver_name}</strong>
          {booking.driver_phone && (
            <a href={`tel:${booking.driver_phone}`} className="btn-call-driver">Call driver</a>
          )}
        </p>
      )}
      {!navigator.onLine && <p className="offline-badge">Offline mode — cached trip data</p>}
      <div className="link-grid">
        <Link to={`/trip/pass/${booking.reference}`}>Voucher & QR →</Link>
        <Link to={`/trip/${booking.reference}`}>Timeline →</Link>
        <Link to="/forum">Traveler forum →</Link>
      </div>

      <section className="vendor-panel">
        <h2>Community reviews</h2>
        <div className="review-list">
          {reviews.slice(0, 5).map((r) => (
            <article key={r.id} className="review-card">
              <strong>{r.author_name}</strong>
              <span className="meta">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
              <p>{r.body}</p>
              {r.photo_url && (
                <a href={r.photo_url} target="_blank" rel="noreferrer" className="review-photo-link">
                  View trek photo
                </a>
              )}
            </article>
          ))}
        </div>
        {navigator.onLine && (
          <form onSubmit={submitReview}>
            <label>
              Your review
              <textarea value={reviewForm.body} onChange={(e) => setReviewForm({ ...reviewForm, body: e.target.value })} required minLength={5} rows={3} />
            </label>
            <label>
              Trek photo URL (optional)
              <input
                type="url"
                value={reviewForm.photo_url}
                onChange={(e) => setReviewForm({ ...reviewForm, photo_url: e.target.value })}
                placeholder="https://…"
              />
            </label>
            <label>
              Rating
              <select value={reviewForm.rating} onChange={(e) => setReviewForm({ ...reviewForm, rating: Number(e.target.value) })}>
                {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} stars</option>)}
              </select>
            </label>
            <button type="submit" className="btn-secondary">Post review</button>
          </form>
        )}
      </section>

      {navigator.onLine && (
        <form className="vendor-panel dispute-form" onSubmit={submitDispute}>
          <h2>File a dispute</h2>
          <p className="plan-lead">Opens a ticket and holds escrow until GoNorth admin resolves it.</p>
          {msg && <p className="toast-info">{msg}</p>}
          <textarea
            value={disputeReason}
            onChange={(e) => setDisputeReason(e.target.value)}
            placeholder="Describe the issue (min 5 characters)"
            minLength={5}
            required
            rows={3}
          />
          <button type="submit" className="btn-secondary">Submit dispute</button>
        </form>
      )}
    </div>
  )
}
