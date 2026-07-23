import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  fetchVendorOnboarding,
  updateVendorProfile,
  createVendorRoom,
  createVendorVehicle,
  createVendorGuide,
  saveVendorKyc,
  submitVendorKyc,
  uploadVendorImage,
} from '../api/client'
import { useAuth } from '../context/AuthContext'

const AMENITIES = ['WiFi', 'Hot Shower', 'Breakfast', 'Mountain View', 'K2 View']
const STEPS = ['profile', 'inventory', 'financial', 'kyc']

export default function VendorOnboardingPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [status, setStatus] = useState(null)
  const [step, setStep] = useState(0)
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(true)

  const [profile, setProfile] = useState({
    phone: '',
    description: '',
    solo_safe: false,
    women_friendly: false,
  })

  const [roomForm, setRoomForm] = useState({
    name: 'Standard Room',
    capacity: 2,
    price_per_night: 5000,
    amenities: ['WiFi', 'Hot Shower'],
    images: [],
  })

  const [vehicleForm, setVehicleForm] = useState({
    model: 'Toyota Prado',
    plate: '',
    driver_name: user?.full_name || '',
    is_4x4: true,
    has_ac: true,
    daily_rate: 12000,
    languages: ['Urdu', 'English'],
    features: ['Roof Rack'],
    model_year: 2020,
  })

  const [guideForm, setGuideForm] = useState({
    name: user?.full_name || '',
    specialty: 'Mountain trekking',
    daily_rate: 4000,
    languages: ['Urdu', 'English', 'Balti'],
  })

  const [financial, setFinancial] = useState({
    cnic_name: '',
    account_title: '',
    payout_method: 'jazzcash',
    account_number: '',
    cnic: '',
  })

  const [kycDocs, setKycDocs] = useState({
    cnic_front_url: '',
    cnic_back_url: '',
    license_url: '',
    insurance_url: '',
  })

  function reload() {
    return fetchVendorOnboarding()
      .then((s) => {
        setStatus(s)
        if (s.complete) return
        const idx = STEPS.indexOf(s.current_step === 'done' ? 'kyc' : s.current_step)
        if (idx >= 0) setStep(idx)
      })
      .catch((e) => setError(e.message))
  }

  useEffect(() => {
    reload().finally(() => setLoading(false))
  }, [])

  async function saveProfile(e) {
    e.preventDefault()
    setError('')
    try {
      const s = await updateVendorProfile(profile)
      setStatus(s)
      setMsg('Profile saved')
      setStep(1)
    } catch (err) {
      setError(err.message)
    }
  }

  async function saveInventory(e) {
    e.preventDefault()
    setError('')
    try {
      const vt = status?.vendor_type
      if (vt === 'hotel') {
        await createVendorRoom(roomForm)
      } else if (vt === 'transport') {
        await createVendorVehicle({ ...vehicleForm, daily_rate: Number(vehicleForm.daily_rate), model_year: Number(vehicleForm.model_year) })
      } else if (vt === 'guide') {
        await createVendorGuide(guideForm)
      } else {
        await createVendorRoom(roomForm)
      }
      await reload()
      setMsg('Inventory added')
      setStep(2)
    } catch (err) {
      setError(err.message)
    }
  }

  async function saveFinancial(e) {
    e.preventDefault()
    setError('')
    try {
      await saveVendorKyc({ ...financial, ...kycDocs })
      await reload()
      setMsg('Payout details saved')
      setStep(3)
    } catch (err) {
      setError(err.message)
    }
  }

  async function uploadDoc(field, e) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const { url } = await uploadVendorImage(file)
      setKycDocs((d) => ({ ...d, [field]: url }))
    } catch (err) {
      setError(err.message)
    }
  }

  async function submitKyc(e) {
    e.preventDefault()
    setError('')
    try {
      await saveVendorKyc({ ...financial, ...kycDocs })
      await submitVendorKyc()
      const s = await fetchVendorOnboarding()
      setStatus(s)
      setMsg('KYC submitted — admin will review within 24–48 hours.')
      if (s.complete) {
        setTimeout(() => navigate('/vendor'), 1500)
      }
    } catch (err) {
      setError(err.message)
    }
  }

  if (loading) return <div className="container loading-page">Loading onboarding…</div>

  if (status?.complete) {
    return (
      <div className="container vendor-page">
        <div className="onboarding-complete-card">
          <h1>Onboarding complete</h1>
          <p>Your profile is ready. Admin approval may still be required before tourists see listings.</p>
          <Link to="/vendor" className="btn-secondary-link">Go to dashboard →</Link>
        </div>
      </div>
    )
  }

  const vendorType = status?.vendor_type || 'hotel'

  return (
    <div className="container vendor-page onboarding-page">
      <span className="portal-badge">Vendor onboarding</span>
      <h1>Set up your business</h1>
      <p className="plan-lead">Complete all four steps to start receiving bookings and escrow payouts.</p>

      <div className="onboarding-stepper">
        {(status?.steps || []).map((s, i) => (
          <button
            key={s.id}
            type="button"
            className={`onboarding-step ${step === i ? 'active' : ''} ${s.complete ? 'done' : ''}`}
            onClick={() => setStep(i)}
          >
            <span className="step-num">{s.complete ? '✓' : i + 1}</span>
            <span>{s.title}</span>
          </button>
        ))}
      </div>

      {error && <p className="form-error">{error}</p>}
      {msg && <p className="toast-info">{msg}</p>}

      {step === 0 && (
        <form className="vendor-panel onboarding-panel" onSubmit={saveProfile}>
          <h2>Step 1 — Profile setup</h2>
          <p className="plan-lead">Help tourists trust your business with a clear description and phone number.</p>
          <label>
            Contact phone (GSM)
            <input value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} required minLength={10} placeholder="03XXXXXXXXX" />
          </label>
          <label>
            Business description
            <textarea value={profile.description} onChange={(e) => setProfile({ ...profile, description: e.target.value })} required minLength={10} rows={4} placeholder="Describe your rooms, vehicles, or guide services…" />
          </label>
          <label className="check-inline">
            <input type="checkbox" checked={profile.solo_safe} onChange={(e) => setProfile({ ...profile, solo_safe: e.target.checked })} />
            Safe for solo travelers
          </label>
          <label className="check-inline">
            <input type="checkbox" checked={profile.women_friendly} onChange={(e) => setProfile({ ...profile, women_friendly: e.target.checked })} />
            Women-friendly certified
          </label>
          <button type="submit" className="btn-primary">Save & continue</button>
        </form>
      )}

      {step === 1 && (
        <form className="vendor-panel onboarding-panel" onSubmit={saveInventory}>
          <h2>Step 2 — Asset inventory</h2>
          <p className="plan-lead">Add your first listing so tourists can book you on GoNorth.</p>

          {vendorType === 'hotel' && (
            <>
              <label>Room name<input value={roomForm.name} onChange={(e) => setRoomForm({ ...roomForm, name: e.target.value })} required /></label>
              <label>Capacity<input type="number" min={1} value={roomForm.capacity} onChange={(e) => setRoomForm({ ...roomForm, capacity: Number(e.target.value) })} /></label>
              <label>Price per night (PKR)<input type="number" min={500} value={roomForm.price_per_night} onChange={(e) => setRoomForm({ ...roomForm, price_per_night: Number(e.target.value) })} /></label>
              <div className="amenity-checks">
                {AMENITIES.map((a) => (
                  <label key={a} className="check-inline">
                    <input
                      type="checkbox"
                      checked={roomForm.amenities.includes(a)}
                      onChange={(e) => {
                        const amenities = e.target.checked
                          ? [...roomForm.amenities, a]
                          : roomForm.amenities.filter((x) => x !== a)
                        setRoomForm({ ...roomForm, amenities })
                      }}
                    />
                    {a}
                  </label>
                ))}
              </div>
            </>
          )}

          {vendorType === 'transport' && (
            <>
              <label>Vehicle model<input value={vehicleForm.model} onChange={(e) => setVehicleForm({ ...vehicleForm, model: e.target.value })} required /></label>
              <label>Number plate<input value={vehicleForm.plate} onChange={(e) => setVehicleForm({ ...vehicleForm, plate: e.target.value })} required /></label>
              <label>Driver name<input value={vehicleForm.driver_name} onChange={(e) => setVehicleForm({ ...vehicleForm, driver_name: e.target.value })} required /></label>
              <label>Daily rate (PKR)<input type="number" min={1000} value={vehicleForm.daily_rate} onChange={(e) => setVehicleForm({ ...vehicleForm, daily_rate: Number(e.target.value) })} /></label>
              <label className="check-inline"><input type="checkbox" checked={vehicleForm.is_4x4} onChange={(e) => setVehicleForm({ ...vehicleForm, is_4x4: e.target.checked })} /> 4x4 capable</label>
              <label className="check-inline"><input type="checkbox" checked={vehicleForm.has_ac} onChange={(e) => setVehicleForm({ ...vehicleForm, has_ac: e.target.checked })} /> AC / Heater</label>
            </>
          )}

          {vendorType === 'guide' && (
            <>
              <label>Guide name<input value={guideForm.name} onChange={(e) => setGuideForm({ ...guideForm, name: e.target.value })} required /></label>
              <label>Specialty<input value={guideForm.specialty} onChange={(e) => setGuideForm({ ...guideForm, specialty: e.target.value })} required placeholder="e.g. K2 Basecamp, Deosai camping" /></label>
              <label>Daily rate (PKR)<input type="number" min={1000} value={guideForm.daily_rate} onChange={(e) => setGuideForm({ ...guideForm, daily_rate: Number(e.target.value) })} /></label>
            </>
          )}

          {!['hotel', 'transport', 'guide'].includes(vendorType) && (
            <p className="plan-lead">Add a room to get started — you can add vehicles later from the dashboard.</p>
          )}

          <button type="submit" className="btn-primary">Add inventory & continue</button>
        </form>
      )}

      {step === 2 && (
        <form className="vendor-panel onboarding-panel" onSubmit={saveFinancial}>
          <h2>Step 3 — Financial setup</h2>
          <p className="plan-lead">Escrow payouts release to this wallet after each completed trip.</p>
          <label>CNIC (without dashes)<input value={financial.cnic} onChange={(e) => setFinancial({ ...financial, cnic: e.target.value })} required minLength={13} /></label>
          <label>Name on CNIC<input value={financial.cnic_name} onChange={(e) => setFinancial({ ...financial, cnic_name: e.target.value })} required /></label>
          <label>Account title<input value={financial.account_title} onChange={(e) => setFinancial({ ...financial, account_title: e.target.value })} required /></label>
          <label>Payout method
            <select value={financial.payout_method} onChange={(e) => setFinancial({ ...financial, payout_method: e.target.value })}>
              <option value="jazzcash">JazzCash</option>
              <option value="easypaisa">EasyPaisa</option>
              <option value="bank">Bank IBFT</option>
            </select>
          </label>
          <label>Account / wallet number<input value={financial.account_number} onChange={(e) => setFinancial({ ...financial, account_number: e.target.value })} required /></label>
          <button type="submit" className="btn-primary">Save payout details</button>
        </form>
      )}

      {step === 3 && (
        <form className="vendor-panel onboarding-panel" onSubmit={submitKyc}>
          <h2>Step 4 — Document KYC</h2>
          <p className="plan-lead">Upload compliance documents for admin review. Required before first payout.</p>
          <label>CNIC front<input type="file" accept="image/*" onChange={(e) => uploadDoc('cnic_front_url', e)} /></label>
          {kycDocs.cnic_front_url && <p className="portal-note">Uploaded ✓</p>}
          <label>CNIC back<input type="file" accept="image/*" onChange={(e) => uploadDoc('cnic_back_url', e)} /></label>
          {kycDocs.cnic_back_url && <p className="portal-note">Uploaded ✓</p>}
          {(vendorType === 'transport' || vendorType === 'guide') && (
            <>
              <label>License / certification<input type="file" accept="image/*" onChange={(e) => uploadDoc('license_url', e)} /></label>
              {vendorType === 'transport' && (
                <label>Passenger liability insurance<input type="file" accept="image/*" onChange={(e) => uploadDoc('insurance_url', e)} /></label>
              )}
            </>
          )}
          <button type="submit" className="btn-primary">Submit KYC for review</button>
        </form>
      )}

      <p className="onboarding-skip">
        <Link to="/vendor">Skip to dashboard</Link> — you can finish setup later from Inventory or KYC pages.
      </p>
    </div>
  )
}
