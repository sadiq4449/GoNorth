import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { cartAbandon, fetchCartQuote, fetchRecommendation, fetchSearch, initPayment } from '../api/client'
import { packageStatus, searchAiStatus } from '../lib/aiStatus'
import AiStatusBanner from '../components/AiStatusBanner'
import { StayCard } from '../components/StayCard'
import { RideCard } from '../components/RideCard'
import { GuideCard } from '../components/GuideCard'
import { ExperienceCard } from '../components/ExperienceCard'
import InvoiceSidebar from '../components/InvoiceSidebar'
import TerrainWarning from '../components/TerrainWarning'
import SafetyProfileModal from '../components/SafetyProfileModal'
import PaymentMethodModal from '../components/PaymentMethodModal'
import PageHeader from '../components/PageHeader'
import { VEHICLE_CATEGORIES } from '../lib/vehicleCategories'

const DESTINATIONS = ['Skardu', 'Hunza', 'Gilgit', 'Deosai', 'Khaplu', 'Shigar', 'Astore', 'Basho']
const STOP_OPTIONS = ['Hunza', 'Gilgit', 'Khaplu', 'Shigar', 'Deosai', 'Astore']
const VIBES = ['backpacker', 'adventure', 'luxury']

export default function PlanTripPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const draft = location.state?.draft
  const appliedDraft = useRef(!!draft)
  const abandonSent = useRef(false)

  const [destination, setDestination] = useState(draft?.destination || 'Skardu')
  const [stops, setStops] = useState(draft?.stops || [])
  const [nights, setNights] = useState(draft?.nights || 5)
  const [guests, setGuests] = useState(draft?.guests || 2)
  const [budget, setBudget] = useState(draft?.budget || 60000)
  const [vibe, setVibe] = useState(draft?.vibe || 'backpacker')
  const [soloSafe, setSoloSafe] = useState(false)
  const [womenFriendly, setWomenFriendly] = useState(false)
  const [featuredOnly, setFeaturedOnly] = useState(false)
  const [enablePooling, setEnablePooling] = useState(false)
  const [vehicleCategory, setVehicleCategory] = useState('all')

  const [search, setSearch] = useState(null)
  const [selectedRoom, setSelectedRoom] = useState(draft?.roomId || null)
  const [selectedVehicle, setSelectedVehicle] = useState(draft?.vehicleId || null)
  const [selectedGuides, setSelectedGuides] = useState(draft?.guideIds || [])
  const [selectedExperiences, setSelectedExperiences] = useState(draft?.experienceIds || [])
  const [quote, setQuote] = useState(draft?.quote || null)
  const [aiReason, setAiReason] = useState(draft?.aiReason || '')
  const [packageSource, setPackageSource] = useState(draft?.packageSource || null)
  const [aiAvailable, setAiAvailable] = useState(draft?.aiAvailable ?? true)

  const [loading, setLoading] = useState(true)
  const [quoteLoading, setQuoteLoading] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [safetyProfile, setSafetyProfile] = useState(null)
  const [bookingLoading, setBookingLoading] = useState(false)
  const [pointsEmail, setPointsEmail] = useState('')
  const [redeemPoints, setRedeemPoints] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')

  function toggleStop(stop) {
    setStops((prev) => (prev.includes(stop) ? prev.filter((s) => s !== stop) : [...prev, stop]))
  }

  const loadSearch = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await fetchSearch({
        destination,
        nights,
        guests,
        budget,
        vibe,
        stops,
        soloSafe,
        womenFriendly,
        featuredOnly,
        vehicleCategory,
      })
      setSearch(data)
      if (data.ai_package && !appliedDraft.current && !selectedRoom) {
        applyAiPackage(data.ai_package)
      }
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [destination, nights, guests, budget, vibe, stops, soloSafe, womenFriendly, featuredOnly, vehicleCategory])

  function applyAiPackage(pkg) {
    setSelectedRoom(pkg.room_id)
    setSelectedVehicle(pkg.vehicle_id)
    setSelectedGuides(pkg.guide_ids || [])
    setQuote(pkg.quote)
    const status = packageStatus(pkg)
    setPackageSource(pkg.source)
    setAiAvailable(pkg.ai_available !== false)
    setAiReason(status.kind === 'ai' ? pkg.reason : status.message)
    if (status.kind === 'fallback') {
      setToast(status.message)
    } else {
      setToast('')
    }
  }

  const refreshQuote = useCallback(async (roomId, vehicleId, guideIds, experienceIds) => {
    const hasSelection = roomId || vehicleId || (guideIds?.length > 0) || (experienceIds?.length > 0)
    if (!hasSelection) {
      setQuote(null)
      return
    }
    setQuoteLoading(true)
    try {
      const q = await fetchCartQuote({
        room_id: roomId || undefined,
        vehicle_id: vehicleId || undefined,
        guide_ids: guideIds || [],
        experience_ids: experienceIds || [],
        nights,
        guests,
        destination,
        stops,
        email: pointsEmail || undefined,
        redeem_points: redeemPoints ? 999999 : 0,
      })
      setQuote(q)
    } catch (e) {
      setError(e.message)
    } finally {
      setQuoteLoading(false)
    }
  }, [nights, guests, destination, stops, pointsEmail, redeemPoints])

  useEffect(() => {
    loadSearch()
  }, [loadSearch])

  useEffect(() => {
    refreshQuote(selectedRoom, selectedVehicle, selectedGuides, selectedExperiences)
  }, [selectedRoom, selectedVehicle, selectedGuides, selectedExperiences, refreshQuote])

  const hasCheckoutSelection =
    selectedRoom || selectedVehicle || selectedGuides.length > 0 || selectedExperiences.length > 0

  useEffect(() => {
    if (!pointsEmail || !hasCheckoutSelection || abandonSent.current) return
    const timer = setTimeout(() => {
      cartAbandon({
        email: pointsEmail,
        draft: {
          destination,
          stops,
          nights,
          guests,
          room_id: selectedRoom,
          vehicle_id: selectedVehicle,
        },
      }).catch(() => {})
      abandonSent.current = true
      setToast('Trip draft saved — reminder SMS queued if phone on file')
    }, 12000)
    return () => clearTimeout(timer)
  }, [pointsEmail, selectedRoom, destination, stops, nights, guests, selectedVehicle])

  async function handleAiBuild() {
    if (!budget || budget < 5000) {
      setError('Enter a budget of at least PKR 5,000')
      return
    }
    setAiLoading(true)
    setError('')
    try {
      const pkg = await fetchRecommendation({ destination, nights, budget, vibe })
      applyAiPackage(pkg)
    } catch (e) {
      setError(
        e.message.includes('No approved listings')
          ? 'No verified listings for this destination. Try Skardu or Hunza.'
          : 'Could not auto-build a package. Select a stay and vehicle below.'
      )
    } finally {
      setAiLoading(false)
    }
  }

  function toggleExperience(exp) {
    setSelectedExperiences((prev) =>
      prev.includes(exp.id) ? prev.filter((id) => id !== exp.id) : [...prev, exp.id]
    )
  }

  function toggleGuide(guide) {
    setSelectedGuides((prev) =>
      prev.includes(guide.id) ? prev.filter((id) => id !== guide.id) : [...prev, guide.id]
    )
  }

  async function handleSafetyProfileSubmit(profile) {
    setSafetyProfile(profile)
    setCheckoutOpen(false)
    setPaymentOpen(true)
  }

  async function handlePaymentConfirm({ country, is_foreign, payment_method }) {
    if (!safetyProfile) return
    setBookingLoading(true)
    setError('')
    try {
      const session = await initPayment({
        destination,
        nights,
        guests,
        room_id: selectedRoom || undefined,
        vehicle_id: selectedVehicle || undefined,
        guide_ids: selectedGuides,
        experience_ids: selectedExperiences,
        safety_profile: safetyProfile,
        redeem_points: quote?.points_redeemed || 0,
        country,
        is_foreign,
        payment_method,
        stops,
        enable_pooling: enablePooling,
      })
      setPaymentOpen(false)
      const url = session.checkout_url
      if (session.gateway === 'stripe' && url.includes('checkout.stripe.com')) {
        window.location.href = url
      } else {
        navigate(`/pay/${session.id}?gateway=${session.gateway}`)
      }
    } catch (e) {
      setError(e.message)
    } finally {
      setBookingLoading(false)
    }
  }

  const usdEstimate = quote ? Math.round((quote.total / 280) * 100) / 100 : null
  const routeLabel = [destination, ...stops].join(' → ')
  const aiBanner = searchAiStatus(search)

  return (
    <div className="builder-layout container">
      <div className="builder-main">
        <PageHeader
          title="Build Your Perfect Trip"
          lead="Mix stays, transport, guides, and experiences across Gilgit-Baltistan — your total updates with every choice."
          backTo="/"
        />

        <PromoBanner valley={destination} />

        <div className="builder-filters">
          <label>
            Destination
            <select value={destination} onChange={(e) => setDestination(e.target.value)}>
              {DESTINATIONS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </label>
          <label>
            Nights
            <input type="number" min={1} max={30} value={nights} onChange={(e) => setNights(Number(e.target.value))} />
          </label>
          <label>
            Guests
            <input type="number" min={1} max={20} value={guests} onChange={(e) => setGuests(Number(e.target.value))} />
          </label>
          <label>
            Budget (PKR)
            <input type="number" min={5000} step={1000} value={budget} onChange={(e) => setBudget(Number(e.target.value))} />
          </label>
          <label>
            Vibe
            <select value={vibe} onChange={(e) => setVibe(e.target.value)}>
              {VIBES.map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
          </label>
        </div>

        <div className="multi-leg-panel">
          <h3>Link multiple valleys</h3>
          <p className="meta">Route: {routeLabel}</p>
          <div className="stop-chips">
            {STOP_OPTIONS.filter((s) => s !== destination).map((s) => (
              <button
                key={s}
                type="button"
                className={`chip ${stops.includes(s) ? 'active' : ''}`}
                onClick={() => toggleStop(s)}
              >
                + {s}
              </button>
            ))}
          </div>
        </div>

        <div className="safety-filter-row">
          <label className="check-label">
            <input type="checkbox" checked={soloSafe} onChange={(e) => setSoloSafe(e.target.checked)} />
            Solo-safe listings only
          </label>
          <label className="check-label">
            <input type="checkbox" checked={womenFriendly} onChange={(e) => setWomenFriendly(e.target.checked)} />
            Women-friendly stays & rides
          </label>
          <label className="check-label">
            <input type="checkbox" checked={featuredOnly} onChange={(e) => setFeaturedOnly(e.target.checked)} />
            Featured listings only
          </label>
          <label className="check-label">
            <input type="checkbox" checked={enablePooling} onChange={(e) => setEnablePooling(e.target.checked)} />
            Join a ride pool at checkout (split transport costs)
          </label>
        </div>

        <TerrainWarning show={search?.requires_4x4} />
        <AiStatusBanner status={aiBanner} onRetry={handleAiBuild} retrying={aiLoading} />
        {toast && !aiBanner && <p className="toast-info">{toast}</p>}
        {error && <p className="form-error">{error}</p>}
        {loading && <p>Loading…</p>}

        {search && !loading && (
          <>
            <section className="listing-section">
              <h2>1. Find your ideal stay</h2>
              <div className="listing-grid">
                {search.rooms.map((r) => (
                  <StayCard
                    key={r.id}
                    room={r}
                    selected={selectedRoom === r.id}
                    onSelect={() => setSelectedRoom(r.id)}
                    recommendSource={search.ai_status}
                  />
                ))}
              </div>
            </section>

            <section className="listing-section">
              <h2>2. Book your ride</h2>
              <p className="plan-lead section-hint">
                Prado, Land Cruiser, Hilux, Hiace, Coaster, or sedan — filtered for your route and terrain.
              </p>
              <div className="vehicle-category-filters">
                {VEHICLE_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    className={`chip ${vehicleCategory === cat.id ? 'active' : ''}`}
                    onClick={() => setVehicleCategory(cat.id)}
                    title={cat.description}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
              <div className="listing-grid">
                {search.vehicles.map((v) => (
                  <RideCard
                    key={v.id}
                    vehicle={v}
                    selected={selectedVehicle === v.id}
                    disabled={search.requires_4x4 && !v.terrain_compatible}
                    onSelect={() => setSelectedVehicle(v.id)}
                    recommendSource={search.ai_status}
                  />
                ))}
              </div>
            </section>

            <section className="listing-section">
              <h2>3. Add a local guide (optional)</h2>
              <div className="listing-grid">
                {search.guides.map((g) => (
                  <GuideCard
                    key={g.id}
                    guide={g}
                    selected={selectedGuides.includes(g.id)}
                    onToggle={toggleGuide}
                    recommendSource={search.ai_status}
                  />
                ))}
              </div>
            </section>

            <section className="listing-section">
              <h2>4. Restaurants & experiences (optional)</h2>
              <div className="listing-grid">
                {(search.experiences || []).map((exp) => (
                  <ExperienceCard
                    key={exp.id}
                    experience={exp}
                    selected={selectedExperiences.includes(exp.id)}
                    onToggle={toggleExperience}
                  />
                ))}
              </div>
            </section>
          </>
        )}
      </div>

      <InvoiceSidebar
        quote={quote}
        loading={quoteLoading}
        destination={routeLabel}
        nights={nights}
        aiReason={aiReason}
        packageSource={packageSource}
        aiAvailable={aiAvailable}
        onAiBuild={handleAiBuild}
        aiLoading={aiLoading}
        onCheckout={() => setCheckoutOpen(true)}
        checkoutDisabled={!hasCheckoutSelection || quoteLoading}
        redeemPoints={redeemPoints}
        onRedeemChange={setRedeemPoints}
        pointsBalance={quote?.points_balance}
        pointsEmail={pointsEmail}
        onPointsEmailChange={setPointsEmail}
      />

      <SafetyProfileModal
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        onSubmit={handleSafetyProfileSubmit}
        loading={false}
        total={quote?.total}
      />

      <PaymentMethodModal
        open={paymentOpen}
        onClose={() => setPaymentOpen(false)}
        onConfirm={handlePaymentConfirm}
        loading={bookingLoading}
        totalPkr={quote?.total}
        amountUsd={usdEstimate}
      />
    </div>
  )
}
