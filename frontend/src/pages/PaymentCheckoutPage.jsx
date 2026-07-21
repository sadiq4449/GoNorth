import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { completeSandboxPayment, fetchPaymentDetail, fetchBooking } from '../api/client'
import { cacheActiveBooking } from '../utils/offlineCache'

const GATEWAY_LABELS = {
  jazzcash: 'JazzCash',
  easypaisa: 'EasyPaisa',
  stripe: 'Stripe (card)',
}

export default function PaymentCheckoutPage() {
  const { sessionId } = useParams()
  const [search] = useSearchParams()
  const gateway = search.get('gateway') || 'jazzcash'
  const navigate = useNavigate()
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchPaymentDetail(sessionId)
      .then(setSession)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [sessionId])

  async function handlePay() {
    setPaying(true)
    setError('')
    try {
      const paid = await completeSandboxPayment(sessionId)
      const booking = await fetchBooking(paid.booking_reference)
      await cacheActiveBooking(booking)
      navigate(`/trip/pass/${paid.booking_reference}`)
    } catch (e) {
      setError(e.message)
    } finally {
      setPaying(false)
    }
  }

  if (loading) return <div className="container placeholder-page"><p>Loading checkout…</p></div>
  if (!session) return <div className="container placeholder-page"><p>{error || 'Session not found'}</p></div>

  const label = GATEWAY_LABELS[session.gateway] || GATEWAY_LABELS[gateway] || 'Payment'

  return (
    <div className="container payment-checkout-page">
      <Link to="/plan" className="back-link">← Back to trip</Link>
      <div className="payment-checkout-card">
        <span className="portal-badge">Sandbox checkout</span>
        <h1>Pay with {label}</h1>
        <p className="plan-lead">Booking ref: <strong>{session.booking_reference}</strong></p>
        <div className="payment-amount-box">
          {session.currency === 'USD' ? (
            <>
              <strong>${session.amount_usd.toFixed(2)} USD</strong>
              <span className="muted">≈ Rs. {session.amount_pkr.toLocaleString()} PKR</span>
            </>
          ) : (
            <strong>Rs. {session.amount_pkr.toLocaleString()} PKR</strong>
          )}
        </div>
        <p className="sandbox-note">
          Sandbox mode — no real charge. Click below to simulate a successful {label} payment and confirm your booking.
        </p>
        {error && <p className="form-error">{error}</p>}
        <button type="button" className="btn-primary btn-enabled" onClick={handlePay} disabled={paying || session.status === 'paid'}>
          {session.status === 'paid' ? 'Already paid' : paying ? 'Processing…' : `Simulate ${label} payment`}
        </button>
      </div>
    </div>
  )
}
