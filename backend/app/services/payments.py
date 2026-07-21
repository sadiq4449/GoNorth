import json
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.config import settings
from app.db.models import Booking, EscrowEntry, PaymentSession
from app.models.booking_schemas import BookingCreateRequest
from app.services.bookings import create_booking
from app.services.local_wallets import easypaisa_checkout_url, jazzcash_checkout_url
from app.services.payment_gateway import gateway_options, select_gateway
from app.services.stripe_checkout import create_stripe_checkout, pkr_to_usd_cents


def _checkout_url(gateway: str, session_id: str) -> str:
    if gateway == "jazzcash":
        return jazzcash_checkout_url(session_id)
    if gateway == "easypaisa":
        return easypaisa_checkout_url(session_id)
    return create_stripe_checkout(
        session_id=session_id,
        booking_reference="pending",
        amount_pkr=0,
        customer_email="",
    )[0]


def init_payment_session(
    db: Session,
    data: BookingCreateRequest,
    *,
    country: str,
    payment_method: str | None,
    is_foreign: bool,
    user_id: str | None = None,
) -> PaymentSession:
    gateway = select_gateway(country=country, payment_method=payment_method, is_foreign=is_foreign)
    sp = data.safety_profile

    booking = create_booking(
        db,
        destination=data.destination,
        nights=data.nights,
        guests=data.guests,
        room_id=data.room_id,
        vehicle_id=data.vehicle_id,
        guide_ids=data.guide_ids,
        traveler_name=sp.traveler_name,
        email=sp.email,
        phone=sp.phone,
        emergency_contact=sp.emergency_contact,
        blood_group=sp.blood_group,
        check_in=data.check_in,
        user_id=user_id,
        redeem_points=data.redeem_points,
        booking_status="pending_payment",
        escrow_status="pending",
        stops=data.stops,
        enable_pooling=data.enable_pooling,
    )

    usd_cents = pkr_to_usd_cents(booking.total)
    currency = "USD" if gateway == "stripe" else "PKR"

    session = PaymentSession(
        booking_id=booking.id,
        gateway=gateway,
        amount_pkr=booking.total,
        amount_usd_cents=usd_cents,
        currency=currency,
        status="pending",
        metadata_json=json.dumps({"country": country, "is_foreign": is_foreign}),
    )
    db.add(session)
    db.flush()

    if gateway == "stripe":
        checkout_url, external_id = create_stripe_checkout(
            session_id=session.id,
            booking_reference=booking.reference,
            amount_pkr=booking.total,
            customer_email=sp.email,
        )
    elif gateway == "easypaisa":
        checkout_url = easypaisa_checkout_url(session.id)
        external_id = None
    else:
        checkout_url = jazzcash_checkout_url(session.id)
        external_id = None

    session.checkout_url = checkout_url
    session.external_id = external_id
    db.commit()
    db.refresh(session)
    return session


def confirm_payment(db: Session, session_id: str, *, external_ref: str | None = None) -> PaymentSession:
    session = db.get(PaymentSession, session_id)
    if not session:
        raise ValueError("Payment session not found")
    if session.status == "paid":
        return session

    booking = db.get(Booking, session.booking_id)
    if not booking:
        raise ValueError("Booking not found for payment session")

    session.status = "paid"
    session.paid_at = datetime.now(timezone.utc)
    if external_ref:
        session.external_id = external_ref
    booking.status = "confirmed"

    escrow = db.query(EscrowEntry).filter(EscrowEntry.booking_id == booking.id).first()
    if escrow and escrow.status == "pending":
        escrow.status = "held"

    from app.services.points import apply_points_delta

    if booking.points_redeemed > 0:
        apply_points_delta(db, booking.email, -booking.points_redeemed, "redeem", booking.reference)
    apply_points_delta(db, booking.email, booking.points_earned, "earn", booking.reference)

    if booking.enable_pooling:
        from app.services.pools import auto_pool_for_booking

        auto_pool_for_booking(db, booking)

    db.commit()
    db.refresh(session)
    return session


def get_payment_status(db: Session, session_id: str) -> dict:
    session = db.get(PaymentSession, session_id)
    if not session:
        raise ValueError("Payment session not found")
    booking = db.get(Booking, session.booking_id)
    return {
        "id": session.id,
        "status": session.status,
        "booking_reference": booking.reference if booking else None,
        "booking_confirmed": booking.status == "confirmed" if booking else False,
    }
