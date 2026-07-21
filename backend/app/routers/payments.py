import json
from typing import Annotated

from fastapi import APIRouter, Depends, Header, HTTPException, Request
from sqlalchemy.orm import Session

from app.auth.security import get_optional_user
from app.config import settings
from app.db.models import Booking, PaymentSession, User, get_db
from app.models.payment_schemas import (
    GatewayOption,
    GatewayOptionsOut,
    PaymentInitRequest,
    PaymentSessionOut,
    PaymentStatusOut,
    WebhookAck,
)
from app.services.local_wallets import verify_easypaisa_webhook, verify_jazzcash_webhook
from app.services.payment_gateway import gateway_options, select_gateway
from app.services.payments import confirm_payment, get_payment_status, init_payment_session
from app.services.stripe_checkout import verify_stripe_webhook

router = APIRouter(prefix="/api/payments", tags=["payments"])


def _session_out(db: Session, session: PaymentSession) -> PaymentSessionOut:
    booking = db.get(Booking, session.booking_id)
    usd = round(session.amount_usd_cents / 100, 2)
    return PaymentSessionOut(
        id=session.id,
        booking_reference=booking.reference if booking else "",
        gateway=session.gateway,
        amount_pkr=session.amount_pkr,
        amount_usd=usd,
        currency=session.currency,
        status=session.status,
        checkout_url=session.checkout_url or "",
        created_at=session.created_at,
    )


@router.post("/init", response_model=PaymentSessionOut)
def payment_init(
    data: PaymentInitRequest,
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User | None, Depends(get_optional_user)] = None,
):
    try:
        session = init_payment_session(
            db,
            data,
            country=data.country,
            payment_method=data.payment_method,
            is_foreign=data.is_foreign,
            user_id=user.id if user else None,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return _session_out(db, session)


@router.post("/quote-gateways", response_model=GatewayOptionsOut)
def quote_gateways(data: PaymentInitRequest, db: Annotated[Session, Depends(get_db)]):
    from app.services.cart import quote_cart

    sp = data.safety_profile
    try:
        quote = quote_cart(
            db,
            room_id=data.room_id,
            vehicle_id=data.vehicle_id,
            guide_ids=data.guide_ids,
            nights=data.nights,
            guests=data.guests,
            destination=data.destination,
            check_in=data.check_in,
            redeem_points=data.redeem_points,
            email=sp.email,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    options = gateway_options(quote["total"], settings.usd_pkr_rate)
    recommended = select_gateway(
        country=data.country,
        payment_method=data.payment_method,
        is_foreign=data.is_foreign,
    )
    return GatewayOptionsOut(
        recommended=recommended,
        options=[GatewayOption(**o) for o in options],
    )


@router.get("/sessions/{session_id}", response_model=PaymentStatusOut)
def payment_status(session_id: str, db: Annotated[Session, Depends(get_db)]):
    try:
        return PaymentStatusOut(**get_payment_status(db, session_id))
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/sessions/{session_id}/detail", response_model=PaymentSessionOut)
def payment_detail(session_id: str, db: Annotated[Session, Depends(get_db)]):
    session = db.get(PaymentSession, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Payment session not found")
    return _session_out(db, session)


@router.post("/sandbox/complete/{session_id}", response_model=PaymentSessionOut)
def sandbox_complete(session_id: str, db: Annotated[Session, Depends(get_db)]):
    """Local sandbox — simulates JazzCash/EasyPaisa/Stripe success without real credentials."""
    try:
        session = confirm_payment(db, session_id, external_ref=f"sandbox-{session_id[:8]}")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return _session_out(db, session)


@router.post("/webhooks/jazzcash", response_model=WebhookAck)
def jazzcash_webhook(
    payload: dict,
    db: Annotated[Session, Depends(get_db)],
    x_signature: Annotated[str | None, Header()] = None,
):
    if not verify_jazzcash_webhook(payload, x_signature):
        raise HTTPException(status_code=401, detail="Invalid signature")
    session_id = payload.get("session_id") or payload.get("ppmpf_1")
    if not session_id:
        raise HTTPException(status_code=400, detail="Missing session_id")
    try:
        session = confirm_payment(db, session_id, external_ref=payload.get("pp_TxnRefNo"))
        booking = db.get(Booking, session.booking_id)
        return WebhookAck(ok=True, session_id=session.id, booking_reference=booking.reference if booking else None)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/webhooks/easypaisa", response_model=WebhookAck)
def easypaisa_webhook(
    payload: dict,
    db: Annotated[Session, Depends(get_db)],
    x_signature: Annotated[str | None, Header()] = None,
):
    if not verify_easypaisa_webhook(payload, x_signature):
        raise HTTPException(status_code=401, detail="Invalid signature")
    session_id = payload.get("session_id") or payload.get("orderId")
    if not session_id:
        raise HTTPException(status_code=400, detail="Missing session_id")
    try:
        session = confirm_payment(db, session_id, external_ref=payload.get("transactionId"))
        booking = db.get(Booking, session.booking_id)
        return WebhookAck(ok=True, session_id=session.id, booking_reference=booking.reference if booking else None)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/webhooks/stripe", response_model=WebhookAck)
async def stripe_webhook(request: Request, db: Annotated[Session, Depends(get_db)]):
    payload = await request.body()
    sig = request.headers.get("stripe-signature")
    event = verify_stripe_webhook(payload, sig)

    if event is None:
        if not settings.stripe_webhook_secret:
            data = json.loads(payload.decode() or "{}")
            session_id = data.get("session_id") or data.get("data", {}).get("object", {}).get("metadata", {}).get(
                "payment_session_id"
            )
            if session_id:
                session = confirm_payment(db, session_id, external_ref="sandbox-stripe")
                booking = db.get(Booking, session.booking_id)
                return WebhookAck(ok=True, session_id=session.id, booking_reference=booking.reference if booking else None)
        raise HTTPException(status_code=400, detail="Invalid Stripe webhook")

    if event["type"] == "checkout.session.completed":
        obj = event["data"]["object"]
        session_id = obj.get("metadata", {}).get("payment_session_id")
        if session_id:
            session = confirm_payment(db, session_id, external_ref=obj.get("id"))
            booking = db.get(Booking, session.booking_id)
            return WebhookAck(ok=True, session_id=session.id, booking_reference=booking.reference if booking else None)

    return WebhookAck(ok=True)
