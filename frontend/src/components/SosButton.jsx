import { useEffect, useState } from 'react'
import { getCachedBooking } from '../utils/offlineCache'
import { sendSos } from '../utils/syncQueue'

export default function SosButton() {
  const [open, setOpen] = useState(false)
  const [coords, setCoords] = useState(null)
  const [phone, setPhone] = useState('')
  const [name, setName] = useState('')
  const [reference, setReference] = useState('')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    getCachedBooking().then((b) => {
      if (b) {
        setPhone(b.phone || '')
        setName(b.traveler_name || '')
        setReference(b.reference || '')
      }
    })
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setCoords({ lat: 35.297, lng: 75.633 })
      )
    }
  }, [])

  async function trigger() {
    if (!phone.trim()) {
      setStatus('Enter your active phone number')
      return
    }
    setLoading(true)
    setStatus('')
    try {
      const res = await sendSos({
        lat: coords?.lat ?? 35.297,
        lng: coords?.lng ?? 75.633,
        phone: phone.trim(),
        traveler_name: name.trim(),
        booking_reference: reference || null,
      })
      setStatus(res.status === 'queued' ? res.message : `SOS dispatched (${res.sms_sent ? 'SMS sent' : 'logged'})`)
    } catch (e) {
      setStatus(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button type="button" className="btn-sos" onClick={() => setOpen(true)}>
        Emergency SOS
      </button>
      {open && (
        <div className="modal-overlay" onClick={() => setOpen(false)}>
          <div className="modal-card sos-modal" onClick={(e) => e.stopPropagation()}>
            <span className="portal-badge sos-badge">1122 + Control Room</span>
            <h2>Need help on the road?</h2>
            <p className="modal-lead">
              Sends your GPS location to rescue services via SMS. Works offline — queued until signal returns.
            </p>
            {coords && (
              <p className="sos-coords">
                GPS: {coords.lat.toFixed(4)}° N, {coords.lng.toFixed(4)}° E
              </p>
            )}
            <div className="stacked-form">
              <label>
                Your phone
                <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+92 300 …" required />
              </label>
              <label>
                Name
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
              </label>
            </div>
            {status && <p className={status.includes('dispatched') || status.includes('queued') ? 'toast-info' : 'form-error'}>{status}</p>}
            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={() => setOpen(false)}>Cancel</button>
              <button type="button" className="btn-sos-confirm" disabled={loading} onClick={trigger}>
                {loading ? 'Sending…' : 'Broadcast SOS'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
