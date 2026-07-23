import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchBooking, fetchPointsBalance, fetchReviews, fileBookingDispute, postReview } from '../api/client'
import { cacheActiveBooking, getCachedBooking } from '../utils/offlineCache'
import PageHeader from '../components/PageHeader'

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

  async function loadPoints(email, subtotal = 0) {
    if (!email?.trim()) return
    try {
      const p = await fetchPointsBalance(email.trim(), subtotal)
      setPointsBalance(p.balance)
    } catch {
      setPointsBalance(null)
    }
  }

  async function recoverBooking(e) {
    e.preventDefault()
    if (!lookupRef.trim()) return
    setLookupLoading(true)
    setLookupError('')
    try {
      const b = await fetchBooking(lookupRef.trim())
      await cacheActiveBooking(b)
      setBooking(b)
      const email = lookupEmail.trim() || b.email
      if (email) {
        setLookupEmail(email)
        await loadPoints(email, b.subtotal || 0)
      }
      if (b.traveler_name) setReviewForm((f) => ({ ...f, author_name: b.traveler_name }))
    } catch {
      setLookupError('Booking not found. Check the reference from your confirmation email and try again.')
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
      setMsg('Support ticket opened — escrow is on hold until GoNorth resolves this.')
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
      setMsg('Thank you — your review is now visible to other travelers.')
      fetchReviews().then(setReviews)
      setReviewForm((f) => ({ ...f, body: '', photo_url: '' }))
    } catch (err) {
      setActionError(err.message)
    }
  }

  if (!booking) {
    return (
      <div className="container tourist-page my-trip-page">
        <PageHeader
          title="Your Trip"
          lead="Enter the reference from your confirmation email to pull up your voucher, driver contact, and itinerary."
        />

        <div className="content-card content-card--narrow">
          <form className="stacked-form" onSubmit={recoverBooking}>
            <label>
              Booking reference
              <input
                value={lookupRef}
                onChange={(e) => setLookupRef(e.target.value)}
                placeholder="e.g. GN-20250723-ABC123"
                autoComplete="off"
                required
              />
            </label>
            <label>
              Email <span className="label-hint">(optional — loads your GoNorth Points balance)</span>
              <input
                type="email"
                value={lookupEmail}
                onChange={(e) => setLookupEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
              />
            </label>
            {lookupError && <p className="form-error">{lookupError}</p>}
            <button type="submit" className="btn-primary btn-enabled" disabled={lookupLoading}>
              {lookupLoading ? 'Looking up…' : 'Find my booking'}
            </button>
          </form>
        </div>

        <p className="page-footer-note">
          Haven&apos;t booked yet? <Link to="/plan">Start Your Adventure</Link>
        </p>
      </div>
    )
  }

  return (
    <div className="container tourist-page my-trip-page">
      <PageHeader
        title="Your Trip"
        lead={`${booking.destination} · ${booking.reference}`}
      />

      {actionError && <p className="form-error">{actionError}</p>}
      {msg && <p className="toast-info trip-status-toast">{msg}</p>}

      {!navigator.onLine && (
        <p className="offline-badge">Offline mode — showing cached trip data</p>
      )}

      <div className="trip-action-grid">
        <Link to={`/trip/pass/${booking.reference}`} className="trip-action-card">
          <strong>Voucher & QR</strong>
          <span>Show at check-in — works offline</span>
        </Link>
        <Link to={`/trip/${booking.reference}`} className="trip-action-card">
          <strong>Day-by-day timeline</strong>
          <span>Your route and daily plan</span>
        </Link>
        <Link to="/forum" className="trip-action-card">
          <strong>Traveler forum</strong>
          <span>Ask locals and fellow travelers</span>
        </Link>
      </div>

      {(booking.points_earned > 0 || pointsBalance != null) && (
        <div className="content-card points-wallet-card">
          <strong>GoNorth Points</strong>
          <p>Balance: {pointsBalance ?? '…'} pts · earned on this trip: {booking.points_earned || 0}</p>
          {booking.points_redeemed > 0 && (
            <p className="muted">Redeemed {booking.points_redeemed} pts (−Rs. {booking.points_discount?.toLocaleString()})</p>
          )}
        </div>
      )}

      {booking.driver_name && (
        <div className="content-card trip-driver-card">
          <span className="trip-driver-label">Your driver</span>
          <div className="trip-driver-row">
            <strong>{booking.driver_name}</strong>
            {booking.driver_phone && (
              <a href={`tel:${booking.driver_phone}`} className="btn-call-driver">Call driver</a>
            )}
          </div>
        </div>
      )}

      <section className="content-card">
        <h2 className="section-title">Traveler reviews</h2>
        <div className="review-list">
          {reviews.slice(0, 5).map((r) => (
            <article key={r.id} className="review-card">
              <strong>{r.author_name}</strong>
              <span className="meta">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
              <p>{r.body}</p>
              {r.photo_url && (
                <a href={r.photo_url} target="_blank" rel="noreferrer" className="review-photo-link">
                  View photo
                </a>
              )}
            </article>
          ))}
          {!reviews.length && <p className="meta">No reviews yet — be the first to share your experience.</p>}
        </div>
        {navigator.onLine && (
          <form className="stacked-form trip-review-form" onSubmit={submitReview}>
            <label>
              Your review
              <textarea
                value={reviewForm.body}
                onChange={(e) => setReviewForm({ ...reviewForm, body: e.target.value })}
                required
                minLength={5}
                rows={3}
                placeholder="What was your trip like?"
              />
            </label>
            <label>
              Photo URL <span className="label-hint">(optional)</span>
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
            <button type="submit" className="btn-secondary">Share your review</button>
          </form>
        )}
      </section>

      {navigator.onLine && (
        <form className="content-card stacked-form dispute-form" onSubmit={submitDispute}>
          <h2 className="section-title">Need help with your booking?</h2>
          <p className="plan-lead">Describe the issue and we&apos;ll open a support ticket. Escrow stays on hold until resolved.</p>
          <label>
            What went wrong?
            <textarea
              value={disputeReason}
              onChange={(e) => setDisputeReason(e.target.value)}
              placeholder="Tell us what happened (min 5 characters)"
              minLength={5}
              required
              rows={4}
            />
          </label>
          <button type="submit" className="btn-secondary">Submit support request</button>
        </form>
      )}
    </div>
  )
}
