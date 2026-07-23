import AppIcon from './AppIcon'

export default function InvoiceSidebar({
  quote,
  loading,
  destination,
  nights,
  aiReason,
  onAiBuild,
  aiLoading,
  onCheckout,
  checkoutDisabled,
  redeemPoints,
  onRedeemChange,
  pointsBalance,
  pointsEmail,
  onPointsEmailChange,
}) {
  return (
    <aside className="invoice-sidebar">
      <div className="invoice-card">
        <span className="invoice-type">Trip Invoice</span>
        <h3>{destination || 'Your trip'}</h3>
        <p className="invoice-meta">
          {nights} night{nights !== 1 ? 's' : ''} · 10% platform fee included
        </p>

        {aiReason && <p className="ai-reason-box">{aiReason}</p>}

        {loading && <p className="invoice-loading">Updating quote…</p>}

        {quote && !loading && (
          <>
            <ul className="invoice-lines">
              {quote.line_items.map((item) => (
                <li key={`${item.type}-${item.id}`}>
                  <span>{item.label}</span>
                  <span>Rs. {item.total.toLocaleString()}</span>
                </li>
              ))}
            </ul>
            <div className="invoice-row">
              <span>Subtotal</span>
              <span>Rs. {quote.subtotal.toLocaleString()}</span>
            </div>
            <div className="invoice-row muted">
              <span>Platform fee ({Math.round(quote.platform_fee_rate * 100)}%)</span>
              <span>Rs. {quote.platform_fee.toLocaleString()}</span>
            </div>
            {quote.points_discount > 0 && (
              <div className="invoice-row muted">
                <span>BaltiPoints ({quote.points_redeemed} pts)</span>
                <span>- Rs. {quote.points_discount.toLocaleString()}</span>
              </div>
            )}
            {quote.points_earn_estimate > 0 && (
              <p className="points-earn-hint">Earn ~{quote.points_earn_estimate} BaltiPoints on this trip</p>
            )}
            <label className="redeem-email">
              Email for BaltiPoints
              <input
                type="email"
                value={pointsEmail || ''}
                onChange={(e) => onPointsEmailChange?.(e.target.value)}
                placeholder="you@example.com"
              />
            </label>
            <label className="redeem-row check-inline">
              <input
                type="checkbox"
                checked={redeemPoints}
                onChange={(e) => onRedeemChange?.(e.target.checked)}
                disabled={!pointsBalance}
              />
              Redeem BaltiPoints (max 20%) · balance: {pointsBalance ?? 0}
            </label>
            <div className="invoice-total">
              <span>Total</span>
              <strong>Rs. {quote.total.toLocaleString()}</strong>
            </div>
            <button
              type="button"
              className="btn-primary btn-enabled checkout-btn"
              onClick={onCheckout}
              disabled={checkoutDisabled}
            >
              Confirm booking
            </button>
          </>
        )}

        {!quote && !loading && (
          <p className="invoice-empty">Select a stay and vehicle to see pricing.</p>
        )}

        <button type="button" className="btn-ai sidebar-ai btn-with-icon" onClick={onAiBuild} disabled={aiLoading}>
          {aiLoading ? 'Consulting AI…' : (
            <>
              <AppIcon name="sparkles" size={16} />
              AI Magic Build
            </>
          )}
        </button>
      </div>
    </aside>
  )
}
