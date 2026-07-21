import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  fetchVendorKyc,
  saveVendorKyc,
  submitVendorKyc,
  startPennyTest,
  verifyPennyTest,
  fetchVendorWallet,
  uploadVendorImage,
  completeTripScan,
} from '../api/client'

const API_BASE = import.meta.env.VITE_API_URL || ''

export default function VendorKycPage() {
  const [kyc, setKyc] = useState(null)
  const [wallet, setWallet] = useState(null)
  const [form, setForm] = useState({
    cnic: '',
    cnic_name: '',
    account_title: '',
    payout_method: 'jazzcash',
    account_number: '',
    cnic_front_url: '',
    cnic_back_url: '',
    license_url: '',
    insurance_url: '',
  })
  const [pennyCode, setPennyCode] = useState('')
  const [sandboxCode, setSandboxCode] = useState('')
  const [completeToken, setCompleteToken] = useState('')
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([fetchVendorKyc(), fetchVendorWallet()])
      .then(([k, w]) => {
        setKyc(k)
        setWallet(w)
        if (k.status !== 'none') {
          setForm({
            cnic: k.cnic || '',
            cnic_name: k.cnic_name || '',
            account_title: k.account_title || '',
            payout_method: k.payout_method || 'jazzcash',
            account_number: k.account_number || '',
            cnic_front_url: k.cnic_front_url || '',
            cnic_back_url: k.cnic_back_url || '',
            license_url: k.license_url || '',
            insurance_url: k.insurance_url || '',
          })
        }
      })
      .catch((e) => setError(e.message))
  }, [])

  async function handleSave(e) {
    e.preventDefault()
    setError('')
    try {
      const updated = await saveVendorKyc(form)
      setKyc(updated)
      setMsg('KYC draft saved')
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleSubmit() {
    try {
      await saveVendorKyc(form)
      const updated = await submitVendorKyc()
      setKyc(updated)
      setMsg('KYC submitted for admin review')
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleDocUpload(field, e) {
    const file = e.target.files?.[0]
    if (!file) return
    const { url } = await uploadVendorImage(file)
    setForm((f) => ({ ...f, [field]: url }))
  }

  async function handlePennyTest() {
    try {
      const res = await startPennyTest()
      setSandboxCode(res.sandbox_code)
      setMsg(res.message)
    } catch (err) {
      setError(err.message)
    }
  }

  async function handlePennyVerify() {
    try {
      const updated = await verifyPennyTest(pennyCode)
      setKyc(updated)
      setSandboxCode('')
      setMsg('Penny test verified')
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleCompleteScan() {
    try {
      const res = await completeTripScan({ token: completeToken })
      setMsg(`Trip completed — escrow ${res.status}, release at ${res.release_at ? new Date(res.release_at).toLocaleString() : 'pending'}`)
      if (res.geofence_flag) setMsg((m) => `${m} · Geofence flagged for review`)
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="container vendor-page">
      <Link to="/vendor" className="back-link">← Dashboard</Link>
      <h1>KYC & payouts</h1>
      <p className="plan-lead">JazzCash/EasyPaisa wallet verification with title match and penny test.</p>

      {wallet && (
        <div className="kpi-card wallet-banner">
          <span>Wallet balance</span>
          <strong>Rs. {wallet.balance.toLocaleString()}</strong>
        </div>
      )}

      {kyc && (
        <div className="kyc-status-row">
          <span className={`status-pill status-${kyc.status === 'approved' ? 'approved' : 'pending'}`}>{kyc.status}</span>
          {kyc.title_match_ok && <span className="pool-pill">Title match ✓</span>}
          {kyc.penny_verified && <span className="pool-pill">Penny verified ✓</span>}
        </div>
      )}

      {msg && <p className="toast-info">{msg}</p>}
      {error && <p className="form-error">{error}</p>}

      <form className="vendor-panel vendor-form" onSubmit={handleSave}>
        <h2>Financial setup</h2>
        <label>CNIC<input value={form.cnic} onChange={(e) => setForm({ ...form, cnic: e.target.value })} placeholder="35202-1234567-1" required /></label>
        <label>Name on CNIC<input value={form.cnic_name} onChange={(e) => setForm({ ...form, cnic_name: e.target.value })} required /></label>
        <label>Account title<input value={form.account_title} onChange={(e) => setForm({ ...form, account_title: e.target.value })} required /></label>
        <label>Payout method
          <select value={form.payout_method} onChange={(e) => setForm({ ...form, payout_method: e.target.value })}>
            <option value="jazzcash">JazzCash</option>
            <option value="easypaisa">EasyPaisa</option>
            <option value="bank">Bank IBAN</option>
          </select>
        </label>
        <label>Account / mobile<input value={form.account_number} onChange={(e) => setForm({ ...form, account_number: e.target.value })} required /></label>

        <label>CNIC front<input type="file" accept="image/*" onChange={(e) => handleDocUpload('cnic_front_url', e)} /></label>
        {form.cnic_front_url && <img src={`${API_BASE}${form.cnic_front_url}`} alt="CNIC front" className="kyc-thumb" />}
        <label>CNIC back<input type="file" accept="image/*" onChange={(e) => handleDocUpload('cnic_back_url', e)} /></label>
        <label>Business license (optional)<input type="file" accept="image/*" onChange={(e) => handleDocUpload('license_url', e)} /></label>
        <label>Insurance (drivers)<input type="file" accept="image/*" onChange={(e) => handleDocUpload('insurance_url', e)} /></label>

        <div className="modal-actions">
          <button type="submit" className="btn-secondary">Save draft</button>
          <button type="button" className="btn-primary btn-enabled" onClick={handleSubmit}>Submit for review</button>
        </div>
      </form>

      <section className="vendor-panel">
        <h2>Penny verification</h2>
        <p className="plan-lead">After title match, send 1 PKR sandbox credit and confirm the code.</p>
        <button type="button" className="btn-secondary" onClick={handlePennyTest}>Send 1 PKR test</button>
        {sandboxCode && <p className="sandbox-code">Sandbox code: <strong>{sandboxCode}</strong></p>}
        <div className="penny-row">
          <input placeholder="Enter 6-digit code" value={pennyCode} onChange={(e) => setPennyCode(e.target.value)} />
          <button type="button" className="btn-primary btn-enabled" onClick={handlePennyVerify}>Verify</button>
        </div>
      </section>

      <section className="vendor-panel">
        <h2>Scan trip completion QR</h2>
        <p className="plan-lead">Paste the tourist&apos;s completion token after the excursion.</p>
        <textarea rows={3} value={completeToken} onChange={(e) => setCompleteToken(e.target.value)} placeholder="Completion JWT from tourist pass" />
        <button type="button" className="btn-primary btn-enabled" onClick={handleCompleteScan}>Mark trip complete</button>
      </section>
    </div>
  )
}
