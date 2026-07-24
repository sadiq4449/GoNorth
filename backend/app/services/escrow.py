import json
import random
import string
from datetime import datetime, timedelta, timezone

from jose import jwt
from sqlalchemy.orm import Session

from app.config import settings
from app.db.models import Booking, EscrowEntry
from app.services.wallet import check_geofence, credit_wallet, vendor_id_for_line_item

ESCROW_STATES = ("pending", "held", "release_scheduled", "paid", "disputed")

VALID_TRANSITIONS = {
    "pending": {"held"},
    "held": {"release_scheduled", "disputed"},
    "release_scheduled": {"paid", "disputed"},
    "disputed": {"held", "paid"},
    "paid": set(),
}


def release_hours(destination: str) -> int:
    dest = destination.lower()
    if any(x in dest for x in ("deosai", "basho", "khaplu")):
        return 48
    if any(x in dest for x in ("shigar",)):
        return 24
    return 12


def _transition(escrow: EscrowEntry, new_status: str) -> None:
    if new_status not in VALID_TRANSITIONS.get(escrow.status, set()):
        raise ValueError(f"Cannot transition escrow from {escrow.status} to {new_status}")
    escrow.status = new_status


def create_completion_token(booking_id: str, reference: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(days=7)
    payload = {
        "bid": booking_id,
        "ref": reference,
        "typ": "completion",
        "exp": int(expire.timestamp()),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm="HS256")


def verify_completion_token(token: str) -> dict | None:
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])
        if payload.get("typ") != "completion":
            return None
        return payload
    except Exception:
        return None


def complete_trip(
    db: Session,
    *,
    token: str,
    lat: float | None = None,
    lng: float | None = None,
) -> EscrowEntry:
    payload = verify_completion_token(token)
    if not payload:
        raise ValueError("Invalid or expired completion token")

    booking = db.get(Booking, payload.get("bid"))
    if not booking or booking.reference != payload.get("ref"):
        raise ValueError("Booking not found for token")

    escrow = db.query(EscrowEntry).filter(EscrowEntry.booking_id == booking.id).first()
    if not escrow:
        raise ValueError("Escrow record not found")
    if escrow.status not in ("held", "pending"):
        raise ValueError(f"Trip already marked complete (escrow: {escrow.status})")

    now = datetime.now(timezone.utc)
    geofence_flag = check_geofence(booking.destination, lat, lng)
    hours = release_hours(booking.destination)

    if escrow.status == "pending":
        _transition(escrow, "held")
    _transition(escrow, "release_scheduled")

    escrow.completed_at = now
    escrow.release_scheduled_at = now
    escrow.release_at = now + timedelta(hours=hours)
    escrow.completion_lat = lat
    escrow.completion_lng = lng
    escrow.geofence_flag = geofence_flag
    db.commit()
    db.refresh(escrow)
    return escrow


def dispute_escrow(db: Session, escrow_id: str, reason: str) -> EscrowEntry:
    escrow = db.get(EscrowEntry, escrow_id)
    if not escrow:
        raise ValueError("Escrow not found")
    if escrow.status == "paid":
        raise ValueError("Cannot dispute paid escrow")
    if escrow.status not in ("held", "release_scheduled"):
        raise ValueError(f"Cannot dispute escrow in status {escrow.status}")
    _transition(escrow, "disputed")
    escrow.dispute_reason = reason
    db.commit()
    db.refresh(escrow)
    return escrow


def resolve_dispute(db: Session, escrow_id: str, action: str) -> EscrowEntry:
    escrow = db.get(EscrowEntry, escrow_id)
    if not escrow or escrow.status != "disputed":
        raise ValueError("Escrow is not disputed")
    if action == "release":
        if not escrow.release_at:
            escrow.release_at = datetime.now(timezone.utc)
        escrow.status = "release_scheduled"
        escrow.dispute_reason = None
    elif action == "refund_hold":
        escrow.status = "held"
        escrow.dispute_reason = None
    else:
        raise ValueError("Invalid resolve action")
    db.commit()
    db.refresh(escrow)
    return escrow


def payout_escrow(db: Session, escrow: EscrowEntry, booking: Booking) -> EscrowEntry:
    line_items = json.loads(booking.line_items_json or "[]")
    for item in line_items:
        vendor_id = vendor_id_for_line_item(db, item)
        if vendor_id:
            credit_wallet(
                db,
                vendor_id,
                item["total"],
                entry_type="escrow_release",
                reference=booking.reference,
                escrow_id=escrow.id,
            )

    escrow.status = "paid"
    escrow.paid_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(escrow)
    return escrow


def process_due_escrows(db: Session) -> int:
    now = datetime.now(timezone.utc)
    due = (
        db.query(EscrowEntry)
        .filter(
            EscrowEntry.status == "release_scheduled",
            EscrowEntry.release_at <= now,
            EscrowEntry.geofence_flag.is_(False),
        )
        .all()
    )
    count = 0
    for escrow in due:
        booking = db.get(Booking, escrow.booking_id)
        if booking:
            payout_escrow(db, escrow, booking)
            count += 1
    return count


def list_escrows(db: Session, status: str | None = None) -> list[EscrowEntry]:
    q = db.query(EscrowEntry).order_by(EscrowEntry.created_at.desc())
    if status:
        q = q.filter(EscrowEntry.status == status)
    return q.limit(100).all()


def force_payout_escrow(db: Session, escrow_id: str, *, override_geofence: bool = False) -> EscrowEntry:
    escrow = db.get(EscrowEntry, escrow_id)
    if not escrow:
        raise ValueError("Escrow not found")
    if escrow.status == "paid":
        raise ValueError("Already paid")
    if escrow.status not in ("held", "release_scheduled", "disputed"):
        raise ValueError(f"Cannot force payout from status {escrow.status}")
    if escrow.geofence_flag and not override_geofence:
        raise ValueError("Geofence flag is set — confirm override to pay out early")

    booking = db.get(Booking, escrow.booking_id)
    if not booking:
        raise ValueError("Booking not found")

    return payout_escrow(db, escrow, booking)
