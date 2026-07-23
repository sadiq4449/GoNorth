import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  fetchVendorDashboard,
  fetchVendorVehicles,
  createVendorVehicle,
  updateVendorVehicle,
  fetchVendorTariffs,
  updateVendorTariff,
  createVendorTariff,
  fetchFleetDrivers,
  createFleetDriver,
  uploadVendorImage,
} from '../api/client'

const FEATURES = ['Roof Rack', 'Heater', 'High-Altitude Certified', 'First Aid Kit']
const LANGS = ['Urdu', 'English', 'Balti', 'Shina']

export default function VendorTariffsPage() {
  const [dash, setDash] = useState(null)
  const [vehicles, setVehicles] = useState([])
  const [tariffs, setTariffs] = useState([])
  const [drivers, setDrivers] = useState([])
  const [error, setError] = useState('')
  const [vehicleForm, setVehicleForm] = useState({
    model: '',
    plate: '',
    driver_name: '',
    is_4x4: false,
    has_ac: true,
    daily_rate: 10000,
    languages: ['Urdu'],
    features: [],
    model_year: 2020,
    fleet_driver_id: '',
  })
  const [driverForm, setDriverForm] = useState({
    name: '',
    phone: '',
    languages: ['Urdu'],
    experience_years: 5,
    route_knowledge: '',
  })

  const load = useCallback(async () => {
    try {
      const [d, v, t, dr] = await Promise.all([
        fetchVendorDashboard(),
        fetchVendorVehicles(),
        fetchVendorTariffs(),
        fetchFleetDrivers(),
      ])
      setDash(d)
      setVehicles(v)
      setTariffs(t)
      setDrivers(dr)
      setError('')
    } catch (e) {
      setError(e.message)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function saveTariff(t) {
    await updateVendorTariff(t.id, { daily_rate: Number(t.daily_rate), active: t.active })
    await load()
  }

  async function addVehicle(e) {
    e.preventDefault()
    try {
      await createVendorVehicle({
        ...vehicleForm,
        fleet_driver_id: vehicleForm.fleet_driver_id || null,
        daily_rate: Number(vehicleForm.daily_rate),
        model_year: Number(vehicleForm.model_year),
      })
      setVehicleForm({
        model: '',
        plate: '',
        driver_name: '',
        is_4x4: false,
        has_ac: true,
        daily_rate: 10000,
        languages: ['Urdu'],
        features: [],
        model_year: 2020,
        fleet_driver_id: '',
      })
      await load()
    } catch (err) {
      setError(err.message)
    }
  }

  async function addDriver(e) {
    e.preventDefault()
    try {
      await createFleetDriver(driverForm)
      setDriverForm({ name: '', phone: '', languages: ['Urdu'], experience_years: 5, route_knowledge: '' })
      await load()
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleVehicleImage(e, vehicleId) {
    const file = e.target.files?.[0]
    if (!file) return
    const { url } = await uploadVendorImage(file)
    const v = vehicles.find((x) => x.id === vehicleId)
    await updateVendorVehicle(vehicleId, { images: [...(v?.images || []), url] })
    await load()
  }

  if (dash && dash.vendor_type === 'hotel') {
    return (
      <div className="container placeholder-page">
        <Link to="/vendor" className="back-link">← Dashboard</Link>
        <h1>Fleet & tariffs</h1>
        <p>This account is hotel-only. Manage rooms on the Inventory page.</p>
        <Link to="/vendor/inventory" className="btn-secondary-link">Go to inventory →</Link>
      </div>
    )
  }

  if (dash && dash.vendor_type === 'guide') {
    return (
      <div className="container placeholder-page">
        <Link to="/vendor" className="back-link">← Dashboard</Link>
        <h1>Fleet & tariffs</h1>
        <p>Guide accounts manage services on the Guides page.</p>
        <Link to="/vendor/guides" className="btn-secondary-link">Manage guides →</Link>
      </div>
    )
  }

  return (
    <div className="container vendor-page">
      <Link to="/vendor" className="back-link">← Dashboard</Link>
      <h1>Fleet & route tariffs</h1>
      <p className="plan-lead">Manage vehicles, sub-drivers, and per-route daily rates.</p>
      {error && <p className="form-error">{error}</p>}

      <section className="vendor-panel">
        <h2>Route tariff matrix</h2>
        <table className="tariff-table">
          <thead>
            <tr>
              <th>Route</th>
              <th>Terrain</th>
              <th>Daily rate (PKR)</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {tariffs.map((t) => (
              <tr key={t.id}>
                <td><strong>{t.origin} → {t.destination}</strong></td>
                <td>{t.terrain_type}</td>
                <td>
                  <input
                    className="tariff-input"
                    type="number"
                    value={t.daily_rate}
                    onChange={(e) => setTariffs((rows) => rows.map((r) => r.id === t.id ? { ...r, daily_rate: e.target.value } : r))}
                  />
                </td>
                <td>
                  <select
                    value={t.active ? 'active' : 'inactive'}
                    onChange={(e) => setTariffs((rows) => rows.map((r) => r.id === t.id ? { ...r, active: e.target.value === 'active' } : r))}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </td>
                <td><button type="button" className="btn-secondary-sm" onClick={() => saveTariff(t)}>Save</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="vendor-panel">
        <h2>Fleet drivers</h2>
        <form className="vendor-form inline-grid" onSubmit={addDriver}>
          <label>Name<input value={driverForm.name} onChange={(e) => setDriverForm({ ...driverForm, name: e.target.value })} required /></label>
          <label>Phone<input value={driverForm.phone} onChange={(e) => setDriverForm({ ...driverForm, phone: e.target.value })} /></label>
          <label>Experience (years)<input type="number" min={0} value={driverForm.experience_years} onChange={(e) => setDriverForm({ ...driverForm, experience_years: Number(e.target.value) })} /></label>
          <label className="span-2">Route knowledge<textarea value={driverForm.route_knowledge} onChange={(e) => setDriverForm({ ...driverForm, route_knowledge: e.target.value })} rows={2} /></label>
          <fieldset className="span-2">
            <legend>Languages</legend>
            {LANGS.map((l) => (
              <label key={l} className="check-inline">
                <input
                  type="checkbox"
                  checked={driverForm.languages.includes(l)}
                  onChange={() => setDriverForm((f) => ({
                    ...f,
                    languages: f.languages.includes(l) ? f.languages.filter((x) => x !== l) : [...f.languages, l],
                  }))}
                />
                {l}
              </label>
            ))}
          </fieldset>
          <button type="submit" className="btn-primary btn-enabled">Add team member</button>
        </form>
        <ul className="driver-list">
          {drivers.map((d) => (
            <li key={d.id}>
              <strong>{d.name}</strong> · {d.experience_years} yrs · {d.languages.join(', ')}
              {d.route_knowledge && <p>{d.route_knowledge}</p>}
            </li>
          ))}
        </ul>
      </section>

      <section className="vendor-panel">
        <h2>My vehicles</h2>
        <form className="vendor-form inline-grid" onSubmit={addVehicle}>
          <label>Model<input value={vehicleForm.model} onChange={(e) => setVehicleForm({ ...vehicleForm, model: e.target.value })} required /></label>
          <label>Plate<input value={vehicleForm.plate} onChange={(e) => setVehicleForm({ ...vehicleForm, plate: e.target.value })} required /></label>
          <label>Driver name<input value={vehicleForm.driver_name} onChange={(e) => setVehicleForm({ ...vehicleForm, driver_name: e.target.value })} required /></label>
          <label>Daily rate<input type="number" min={1000} value={vehicleForm.daily_rate} onChange={(e) => setVehicleForm({ ...vehicleForm, daily_rate: Number(e.target.value) })} /></label>
          <label>Assign driver
            <select value={vehicleForm.fleet_driver_id} onChange={(e) => setVehicleForm({ ...vehicleForm, fleet_driver_id: e.target.value })}>
              <option value="">—</option>
              {drivers.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </label>
          <label className="check-inline"><input type="checkbox" checked={vehicleForm.is_4x4} onChange={(e) => setVehicleForm({ ...vehicleForm, is_4x4: e.target.checked })} /> 4x4</label>
          <label className="check-inline"><input type="checkbox" checked={vehicleForm.has_ac} onChange={(e) => setVehicleForm({ ...vehicleForm, has_ac: e.target.checked })} /> AC</label>
          <fieldset className="span-2">
            <legend>Features</legend>
            {FEATURES.map((f) => (
              <label key={f} className="check-inline">
                <input
                  type="checkbox"
                  checked={vehicleForm.features.includes(f)}
                  onChange={() => setVehicleForm((v) => ({
                    ...v,
                    features: v.features.includes(f) ? v.features.filter((x) => x !== f) : [...v.features, f],
                  }))}
                />
                {f}
              </label>
            ))}
          </fieldset>
          <button type="submit" className="btn-primary btn-enabled">Add vehicle</button>
        </form>

        <div className="fleet-manager-grid">
          {vehicles.map((v) => (
            <div key={v.id} className="vehicle-admin-card">
              <div className="vehicle-info-panel">
                <h4>{v.model}{v.model_year ? ` (${v.model_year})` : ''}</h4>
                <p>Plate: {v.plate} · {v.driver_name}</p>
                <p>Rs. {v.daily_rate.toLocaleString()}/day · {v.is_4x4 ? '4x4' : 'Standard'}{v.has_ac ? ' · AC' : ''}</p>
                <div className="pool-meta-row">
                  {v.features.map((f) => <span key={f} className="pool-pill">{f}</span>)}
                </div>
                <label className="file-label">
                  Add photo
                  <input type="file" accept="image/*" onChange={(e) => handleVehicleImage(e, v.id)} />
                </label>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
