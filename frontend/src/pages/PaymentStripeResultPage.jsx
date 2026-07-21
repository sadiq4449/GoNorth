import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { fetchPaymentStatus, fetchBooking } from '../api/client'
import { cacheActiveBooking } from '../utils/offlineCache'

export default function PaymentStripeResultPage({ success }) {
  const [search] = useSearchParams()
  const sessionId = search.get('session_id')
  const navigate = useNavigate()
  const [msg, setMsg] = useState(success ? 'Confirming payment…' : 'Payment cancelled.')

  useEffect(() => {
    if (!success || !sessionId) return
    let tries = 0
    const poll = setInterval(async () => {
      tries += 1
      try {
        const status = await fetchPaymentStatus(sessionId)
        if (status.booking_confirmed && status.booking_reference) {
          clearInterval(poll)
          const booking = await fetchBooking(status.booking_reference)
          await cacheActiveBooking(booking)
          navigate(`/trip/pass/${status.booking_reference}`)
        } else if (tries > 15) {
          clearInterval(poll)
          setMsg('Payment pending — check My Trip shortly.')
        }
      } catch {
        if (tries > 15) clearInterval(poll)
      }
    }, 1500)
    return () => clearInterval(poll)
  }, [success, sessionId, navigate])

  return (
    <div className="container placeholder-page">
      <h1>{success ? 'Payment successful' : 'Payment cancelled'}</h1>
      <p>{msg}</p>
      {!success && <Link to="/plan">Return to trip builder →</Link>}
    </div>
  )
}
