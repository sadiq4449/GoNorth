const COUNTRIES = [
  { code: 'PK', label: 'Pakistan' },
  { code: 'US', label: 'United States / other' },
]

export default function PaymentMethodModal({
  open,
  onClose,
  onConfirm,
  loading,
  totalPkr,
  amountUsd,
}) {
  const [country, setCountry] = useState('PK')
  const [method, setMethod] = useState('jazzcash')

  if (!open) return null

  const isForeign = country !== 'PK'

  function handleSubmit(e) {
    e.preventDefault()
    onConfirm({
      country,
      is_foreign: isForeign,
      payment_method: isForeign ? 'card' : method,
    })
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <span className="portal-badge">Secure payment</span>
        <h2>Choose payment method</h2>
        <p className="modal-total">
          Total: <strong>Rs. {totalPkr?.toLocaleString()}</strong>
          {amountUsd != null && <span className="usd-hint"> ≈ ${amountUsd.toFixed(2)} USD</span>}
        </p>

        <form className="portal-login-form" onSubmit={handleSubmit}>
          <label>
            Your country
            <select value={country} onChange={(e) => setCountry(e.target.value)}>
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>{c.label}</option>
              ))}
            </select>
          </label>

          {!isForeign ? (
            <fieldset className="payment-methods">
              <legend>Local wallet (PKR)</legend>
              <label className="check-inline">
                <input type="radio" name="method" value="jazzcash" checked={method === 'jazzcash'} onChange={() => setMethod('jazzcash')} />
                JazzCash
              </label>
              <label className="check-inline">
                <input type="radio" name="method" value="easypaisa" checked={method === 'easypaisa'} onChange={() => setMethod('easypaisa')} />
                EasyPaisa
              </label>
            </fieldset>
          ) : (
            <p className="plan-lead">Foreign travelers pay by card via Stripe (USD). PKR estimate shown for reference.</p>
          )}

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Back</button>
            <button type="submit" className="btn-primary btn-enabled" disabled={loading}>
              {loading ? 'Starting checkout…' : isForeign ? 'Continue to Stripe' : 'Continue to wallet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
