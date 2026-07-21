from app.config import settings


def pkr_to_usd_cents(amount_pkr: int) -> int:
    usd = amount_pkr / settings.usd_pkr_rate
    return max(50, int(round(usd * 100)))


def create_stripe_checkout(
    *,
    session_id: str,
    booking_reference: str,
    amount_pkr: int,
    customer_email: str,
) -> tuple[str, str | None]:
    """Return (checkout_url, stripe_session_id). Uses mock URL when Stripe key missing."""
    usd_cents = pkr_to_usd_cents(amount_pkr)
    mock_url = f"{settings.public_web_url.rstrip('/')}/pay/{session_id}?gateway=stripe"

    if not settings.stripe_secret_key:
        return mock_url, f"mock_stripe_{session_id}"

    import stripe

    stripe.api_key = settings.stripe_secret_key
    success = f"{settings.public_web_url.rstrip('/')}/pay/stripe/success?session_id={session_id}"
    cancel = f"{settings.public_web_url.rstrip('/')}/pay/stripe/cancel?session_id={session_id}"

    session = stripe.checkout.Session.create(
        mode="payment",
        customer_email=customer_email,
        line_items=[
            {
                "price_data": {
                    "currency": "usd",
                    "unit_amount": usd_cents,
                    "product_data": {
                        "name": f"BaltiTour — {booking_reference}",
                        "description": f"Trip booking (≈ Rs. {amount_pkr:,} PKR)",
                    },
                },
                "quantity": 1,
            }
        ],
        success_url=success,
        cancel_url=cancel,
        metadata={"payment_session_id": session_id, "booking_reference": booking_reference},
    )
    return session.url, session.id


def verify_stripe_webhook(payload: bytes, sig_header: str | None) -> dict | None:
    if not settings.stripe_webhook_secret:
        return None
    import stripe

    stripe.api_key = settings.stripe_secret_key
    try:
        event = stripe.Webhook.construct_event(payload, sig_header, settings.stripe_webhook_secret)
        return event
    except Exception:
        return None
