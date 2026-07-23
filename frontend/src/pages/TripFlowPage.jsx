import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { fetchBooking } from '../api/client'
import { getCachedBooking } from '../utils/offlineCache'
import PageHeader from '../components/PageHeader'

export default function TripFlowPage() {
  const { reference } = useParams()
  const [booking, setBooking] = useState(null)
  const [offline, setOffline] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchBooking(reference)
      .then(setBooking)
      .catch(async () => {
        const cached = await getCachedBooking()
        if (cached?.reference === reference) {
          setBooking(cached)
          setOffline(true)
        } else {
          setError('Booking not found')
        }
      })
  }, [reference])

  if (error) {
    return (
      <div className="container placeholder-page">
        <p className="form-error">{error}</p>
        <Link to="/" className="back-link">← Home</Link>
      </div>
    )
  }

  if (!booking) return <div className="container loading-page">Loading timeline…</div>

  return (
    <div className="container tourist-page trip-flow-page">
      <PageHeader
        title="Your journey"
        lead={
          <>
            Day-by-day plan for {booking.destination} · {booking.reference}
            {offline && <span className="offline-badge"> · Offline mode</span>}
          </>
        }
        backTo={`/trip/pass/${booking.reference}`}
        backLabel="Voucher"
      />

      <div className="timeline">
        {booking.timeline.map((day) => (
          <div key={day.day} className="timeline-day">
            <div className="day-marker">
              <div className="day-num">{String(day.day).padStart(2, '0')}</div>
              <div className="day-label">{day.label}</div>
            </div>
            <div className="day-content">
              {day.events.map((ev, i) => (
                <div key={i} className="timeline-event">
                  <span className="event-icon">{ev.icon}</span>
                  <span>{ev.text}</span>
                </div>
              ))}
              <div className="advisory-pill">{day.advisory}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
