import json
import random
import string
from datetime import datetime, timedelta, timezone

from jose import jwt
from sqlalchemy.orm import Session

from app.config import settings
from app.db.models import Booking, EscrowEntry, Vendor
from app.services.cart import quote_cart
from app.services.catalog import get_guides, get_room, get_vehicle
from app.services.points import apply_points_delta, earn_for_subtotal
from app.services.wallet import vendor_id_for_line_item


def _reference_code() -> str:
    suffix = "".join(random.choices(string.digits, k=4))
    return f"BT-2026-{suffix}"


def create_voucher_token(booking_id: str, reference: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(days=90)
    payload = {
        "bid": booking_id,
        "ref": reference,
        "typ": "voucher",
        "exp": int(expire.timestamp()),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm="HS256")


def verify_voucher_token(token: str) -> dict | None:
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])
        if payload.get("typ") != "voucher":
            return None
        return payload
    except Exception:
        return None


def _escrow_release_time(destination: str) -> datetime:
    dest = destination.lower()
    hours = 24 if any(x in dest for x in ("deosai", "basho", "shigar", "khaplu")) else 12
    return datetime.now(timezone.utc) + timedelta(hours=hours)


def _compute_vendor_splits(db: Session, line_items: list[dict]) -> list[dict]:
    totals: dict[str, dict] = {}
    for item in line_items:
        vendor_id = vendor_id_for_line_item(db, item)
        if not vendor_id:
            continue
        vendor = db.get(Vendor, vendor_id)
        entry = totals.setdefault(
            vendor_id,
            {
                "vendor_id": vendor_id,
                "vendor_name": vendor.business_name if vendor else "Vendor",
                "amount": 0,
                "line_types": set(),
            },
        )
        entry["amount"] += item["total"]
        entry["line_types"].add(item["type"])
    return [
        {
            "vendor_id": v["vendor_id"],
            "vendor_name": v["vendor_name"],
            "amount": v["amount"],
            "line_types": sorted(v["line_types"]),
        }
        for v in totals.values()
    ]


def create_booking(
    db: Session,
    *,
    destination: str,
    nights: int,
    guests: int,
    room_id: str | None = None,
    vehicle_id: str | None = None,
    guide_ids: list[str] | None = None,
    experience_ids: list[str] | None = None,
    traveler_name: str,
    email: str,
    phone: str,
    emergency_contact: str | None,
    blood_group: str | None,
    check_in: str | None,
    user_id: str | None = None,
    redeem_points: int = 0,
    booking_status: str = "confirmed",
    escrow_status: str = "held",
    stops: list[str] | None = None,
    enable_pooling: bool = False,
) -> Booking:
    quote = quote_cart(
        db,
        room_id=room_id,
        vehicle_id=vehicle_id,
        guide_ids=guide_ids or [],
        experience_ids=experience_ids or [],
        nights=nights,
        guests=guests,
        destination=destination,
        check_in=check_in,
        redeem_points=redeem_points,
        email=email,
        stops=stops,
    )

    ref = _reference_code()
    while db.query(Booking).filter(Booking.reference == ref).first():
        ref = _reference_code()

    booking = Booking(
        reference=ref,
        user_id=user_id,
        traveler_name=traveler_name,
        email=email,
        phone=phone,
        emergency_contact=emergency_contact,
        blood_group=blood_group,
        destination=destination,
        stops_json=json.dumps(stops or []),
        enable_pooling=enable_pooling,
        check_in=check_in,
        nights=nights,
        guests=guests,
        room_id=room_id,
        vehicle_id=vehicle_id,
        subtotal=quote["subtotal"],
        platform_fee=quote["platform_fee"],
        total=quote["total"],
        points_redeemed=quote["points_redeemed"],
        points_discount=quote["points_discount"],
        points_earned=earn_for_subtotal(quote["subtotal"]),
        line_items_json=json.dumps(quote["line_items"]),
        status=booking_status,
        voucher_token="",
    )
    booking.set_guide_ids(guide_ids or [])
    db.add(booking)
    db.flush()

    booking.voucher_token = create_voucher_token(booking.id, booking.reference)

    vendor_splits = _compute_vendor_splits(db, quote["line_items"])
    escrow = EscrowEntry(
        booking_id=booking.id,
        amount=quote["total"],
        platform_share=quote["platform_fee"],
        vendor_share=quote["subtotal"],
        status=escrow_status,
        release_at=_escrow_release_time(destination),
    )
    escrow.set_vendor_splits(vendor_splits)
    db.add(escrow)

    if booking_status == "confirmed":
        if quote["points_redeemed"] > 0:
            apply_points_delta(db, email, -quote["points_redeemed"], "redeem", ref)
        apply_points_delta(db, email, booking.points_earned, "earn", ref)

    db.commit()
    db.refresh(booking)
    return booking


def build_timeline(db: Session, booking: Booking) -> list[dict]:
    room = get_room(db, booking.room_id) if booking.room_id else None
    vehicle = get_vehicle(db, booking.vehicle_id) if booking.vehicle_id else None
    guides = get_guides(db, booking.get_guide_ids())

    from app.db.models import Property

    prop = db.get(Property, room.property_id) if room else None
    stay_name = f"{prop.name} — {room.name}" if prop and room else None
    vehicle_name = f"{vehicle.model} ({vehicle.driver_name})" if vehicle else None

    line_items = json.loads(booking.line_items_json or "[]")
    experience_labels = [i["label"] for i in line_items if i.get("type") == "experience"]

    days = []
    for d in range(1, booking.nights + 1):
        events = []
        if d == 1:
            if stay_name:
                events.append({"icon": "🏨", "text": f"Check-in: {stay_name}"})
            if vehicle_name:
                events.append({"icon": "🚗", "text": f"Pickup: {vehicle_name}"})
            for label in experience_labels[:2]:
                events.append({"icon": "🍽️", "text": label})
            if not events:
                events.append({"icon": "🏔️", "text": f"Trip start — {booking.destination}"})
        elif d == booking.nights:
            if stay_name:
                events.append({"icon": "🏨", "text": "Check-out and departure"})
            else:
                events.append({"icon": "🏔️", "text": "Trip wrap-up"})
        else:
            if vehicle_name:
                events.append({"icon": "🚗", "text": f"Full-day transport: {vehicle_name}"})
            if guides:
                g = guides[(d - 2) % len(guides)]
                events.append({"icon": "🏔️", "text": f"Excursion with {g.name}: {g.specialty}"})
            elif not vehicle_name:
                events.append({"icon": "🏔️", "text": f"Explore {booking.destination}"})
            else:
                events.append({"icon": "🏔️", "text": f"Explore {booking.destination}"})

        advisory = "Road clear"
        from app.services.safety import list_advisories_merged

        advisories = list_advisories_merged(db, booking.destination)
        if advisories:
            advisory = advisories[0]["message"]
        elif booking.destination.lower() in ("deosai", "basho") and d > 1:
            advisory = "Monitor weather — high altitude route"

        days.append({
            "day": d,
            "label": "Arrival" if d == 1 else ("Departure" if d == booking.nights else "Excursion"),
            "events": events,
            "advisory": advisory,
        })

    return days
