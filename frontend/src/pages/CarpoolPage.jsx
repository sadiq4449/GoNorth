import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchActivePools, joinPool, leavePool } from '../api/client'
import PageHeader from '../components/PageHeader'

const MEMBERS_KEY = 'baltitour_pool_members'

function loadMemberMap() {
  try {
    return JSON.parse(localStorage.getItem(MEMBERS_KEY) || '{}')
  } catch {
    return {}
  }
}

function saveMemberMap(map) {
  localStorage.setItem(MEMBERS_KEY, JSON.stringify(map))
}

export default function CarpoolPage() {
  const [pools, setPools] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionId, setActionId] = useState(null)
  const [joinForm, setJoinForm] = useState({ guest_name: '', guest_phone: '' })
  const [joinTarget, setJoinTarget] = useState(null)
  const [memberMap, setMemberMap] = useState(loadMemberMap)

  const memberIds = Object.values(memberMap).filter(Boolean)

  const refresh = useCallback(async (ids = memberIds) => {
    try {
      const data = await fetchActivePools(ids)
      setPools(data)
      setError('')
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [memberIds.join(',')])

  useEffect(() => {
    refresh()
    const timer = setInterval(refresh, 5000)
    return () => clearInterval(timer)
  }, [refresh])

  async function handleJoin(pool) {
    if (!joinForm.guest_name.trim() || !joinForm.guest_phone.trim()) {
      setError('Enter your name and phone to join')
      return
    }
    setActionId(pool.id)
    setError('')
    try {
      const res = await joinPool(pool.id, joinForm)
      const map = { ...memberMap, [pool.id]: res.member_id }
      saveMemberMap(map)
      setMemberMap(map)
      setJoinTarget(null)
      await refresh(Object.values(map).filter(Boolean))
    } catch (e) {
      setError(e.message)
    } finally {
      setActionId(null)
    }
  }

  async function handleLeave(pool) {
    const memberId = memberMap[pool.id] || pool.my_member_id
    if (!memberId) return
    setActionId(pool.id)
    setError('')
    try {
      await leavePool(pool.id, memberId)
      const map = { ...memberMap }
      delete map[pool.id]
      saveMemberMap(map)
      setMemberMap(map)
      await refresh(Object.values(map).filter(Boolean))
    } catch (e) {
      setError(e.message)
    } finally {
      setActionId(null)
    }
  }

  return (
    <div className="container tourist-page carpool-page">
      <PageHeader
        title="Share the Ride, Split the Fare"
        lead="Join verified ride pools on popular Gilgit-Baltistan routes. Travel with other explorers, pay less per seat, and help local drivers fill their vehicles."
      />

      <div className="pool-econ-banner">
        <strong>Example:</strong> Rs. 10,000 private → Rs. 12,000 shared pool →{' '}
        <strong>Rs. 3,000/seat</strong> with 4 travelers (driver nets Rs. 10,800).
      </div>

      {error && <p className="form-error">{error}</p>}
      {loading && pools.length === 0 && <p>Loading pools…</p>}

      <div className="pool-list">
        {pools.map((pool) => {
          const displayPrice = pool.joined ? pool.per_seat : pool.per_seat_if_join ?? pool.per_seat
          const isJoining = joinTarget === pool.id

          return (
            <div key={pool.id} className="pool-item">
              <div className="pool-info">
                <div className="pool-route">
                  {pool.origin} <span className="arrow">→</span> {pool.destination}
                </div>
                <div className="pool-driver">
                  <span>Driver: {pool.driver_name}</span>
                  <span className="accredited">● Accredited</span>
                </div>
                <div className="pool-meta-row">
                  <span className="pool-pill seats">Seats left: {pool.seats_left}</span>
                  <span className="pool-pill">Departure: {pool.departure_time}</span>
                  <span className="pool-pill">{pool.vehicle_model}</span>
                </div>
                <div className="pool-fare-math">
                  Shared fare: Rs. {pool.shared_fare.toLocaleString()} (120% of Rs.{' '}
                  {pool.private_fare.toLocaleString()}) ÷ {pool.occupied_seats || pool.max_seats}{' '}
                  passengers = <strong>Rs. {displayPrice.toLocaleString()}/seat</strong>
                </div>
                {pool.members.length > 0 && (
                  <p className="pool-members">
                    {pool.members.map((m) => m.guest_name).join(', ')} joined
                  </p>
                )}
              </div>

              <div className="pool-side">
                <div className="pool-price">
                  Rs. {displayPrice.toLocaleString()} <small>/ seat</small>
                </div>

                {pool.joined ? (
                  <button
                    type="button"
                    className="btn-pool-join joined"
                    disabled={actionId === pool.id}
                    onClick={() => handleLeave(pool)}
                  >
                    {actionId === pool.id ? 'Leaving…' : 'Leave pool'}
                  </button>
                ) : isJoining ? (
                  <div className="pool-join-form stacked-form">
                    <label>
                      Your name
                      <input
                        placeholder="Full name"
                        value={joinForm.guest_name}
                        onChange={(e) => setJoinForm((f) => ({ ...f, guest_name: e.target.value }))}
                      />
                    </label>
                    <label>
                      Phone
                      <input
                        placeholder="+92 300 …"
                        value={joinForm.guest_phone}
                        onChange={(e) => setJoinForm((f) => ({ ...f, guest_phone: e.target.value }))}
                      />
                    </label>
                    <button
                      type="button"
                      className="btn-pool-join"
                      disabled={actionId === pool.id || pool.seats_left === 0}
                      onClick={() => handleJoin(pool)}
                    >
                      {actionId === pool.id ? 'Joining…' : 'Confirm join'}
                    </button>
                    <button type="button" className="btn-link-sm" onClick={() => setJoinTarget(null)}>
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="btn-pool-join"
                    disabled={pool.seats_left === 0}
                    onClick={() => {
                      setJoinTarget(pool.id)
                      setJoinForm({ guest_name: '', guest_phone: '' })
                    }}
                  >
                    {pool.seats_left === 0 ? 'Full' : 'Join carpool'}
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {!loading && pools.length === 0 && !error && (
        <p className="invoice-empty">No active pools right now — check back soon or <Link to="/plan">book private transport</Link>.</p>
      )}
    </div>
  )
}
