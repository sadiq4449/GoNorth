from sqlalchemy.orm import Session

from app.db.models import Experience, Guide, Property, Room, Vehicle, Vendor
from app.services.catalog import get_experience, get_guides, get_room, get_vehicle
from app.services.pricing import effective_room_price, route_tariff_rate, room_blocked_on_dates, date_range

from app.services.admin_tools import apply_overrides_to_line_items
from app.services.points import calc_points_discount, earn_for_subtotal, get_or_create_account

PLATFORM_FEE_RATE = 0.10


def _room_label(db: Session, room: Room) -> str:
    prop = db.get(Property, room.property_id)
    vendor = db.get(Vendor, prop.vendor_id) if prop else None
    name = prop.name if prop else "Stay"
    return f"{name} — {room.name}"


def _has_cart_selection(
    *,
    room_id: str | None,
    vehicle_id: str | None,
    guide_ids: list[str],
    experience_ids: list[str],
) -> bool:
    return bool(room_id or vehicle_id or guide_ids or experience_ids)


def quote_cart(
    db: Session,
    *,
    room_id: str | None = None,
    vehicle_id: str | None = None,
    guide_ids: list[str] | None = None,
    experience_ids: list[str] | None = None,
    nights: int,
    guests: int = 2,
    destination: str | None = None,
    check_in: str | None = None,
    redeem_points: int = 0,
    email: str | None = None,
    stops: list[str] | None = None,
) -> dict:
    guide_ids = guide_ids or []
    experience_ids = experience_ids or []

    if not _has_cart_selection(
        room_id=room_id,
        vehicle_id=vehicle_id,
        guide_ids=guide_ids,
        experience_ids=experience_ids,
    ):
        raise ValueError("Select at least one stay, vehicle, guide, or experience")

    line_items = []

    if room_id:
        room = get_room(db, room_id)
        if not room or room.hidden:
            raise ValueError("Selected room is not available")
        if room.capacity < guests:
            raise ValueError(f"Room capacity ({room.capacity}) is less than guests ({guests})")
        if check_in:
            blocked_dates = date_range(check_in, nights)
            if room_blocked_on_dates(db, room_id, blocked_dates):
                raise ValueError("Room is blocked for selected dates")

        prop = db.get(Property, room.property_id)
        vendor_id = prop.vendor_id if prop else None
        room_nightly = effective_room_price(db, room, vendor_id) if vendor_id else room.price_per_night
        stay_total = room_nightly * nights
        line_items.append({
            "type": "stay",
            "id": room.id,
            "label": _room_label(db, room),
            "unit_price": room_nightly,
            "quantity": nights,
            "total": stay_total,
        })

    if vehicle_id:
        vehicle = get_vehicle(db, vehicle_id)
        if not vehicle or vehicle.hidden:
            raise ValueError("Selected vehicle is not available")

        vehicle_daily = vehicle.daily_rate
        leg_destinations = [d for d in (stops or []) if d]
        if not leg_destinations and destination:
            leg_destinations = [destination]

        if len(leg_destinations) > 1:
            leg_nights = max(1, nights // len(leg_destinations))
            for idx, leg_dest in enumerate(leg_destinations):
                rate = vehicle.daily_rate
                tariff = route_tariff_rate(db, vehicle.vendor_id, leg_dest, vehicle.id)
                if tariff:
                    rate = tariff
                line_items.append({
                    "type": "transport",
                    "id": vehicle.id,
                    "label": f"Leg {idx + 1}: {leg_dest} — {vehicle.model}",
                    "unit_price": rate,
                    "quantity": leg_nights,
                    "total": rate * leg_nights,
                })
        else:
            if leg_destinations:
                tariff = route_tariff_rate(db, vehicle.vendor_id, leg_destinations[0], vehicle.id)
                if tariff:
                    vehicle_daily = tariff
            line_items.append({
                "type": "transport",
                "id": vehicle.id,
                "label": f"{vehicle.model} ({vehicle.driver_name})",
                "unit_price": vehicle_daily,
                "quantity": nights,
                "total": vehicle_daily * nights,
            })

    guides = get_guides(db, guide_ids)
    for g in guides:
        g_total = g.daily_rate * nights
        line_items.append({
            "type": "guide",
            "id": g.id,
            "label": f"{g.name} — {g.specialty}",
            "unit_price": g.daily_rate,
            "quantity": nights,
            "total": g_total,
        })

    for exp_id in experience_ids:
        exp = get_experience(db, exp_id)
        if not exp or exp.hidden:
            raise ValueError(f"Experience not available: {exp_id}")
        qty = guests if exp.pricing_unit == "per_person" else 1
        exp_total = exp.price * qty
        line_items.append({
            "type": "experience",
            "id": exp.id,
            "label": f"{exp.name} ({exp.category})",
            "unit_price": exp.price,
            "quantity": qty,
            "total": exp_total,
        })

    line_items = apply_overrides_to_line_items(db, line_items)

    subtotal = sum(i["total"] for i in line_items)
    platform_fee = round(subtotal * PLATFORM_FEE_RATE)

    balance = 0
    points_used, points_discount = 0, 0
    if email:
        acct = get_or_create_account(db, email)
        balance = acct.balance
        points_used, points_discount = calc_points_discount(redeem_points, balance, subtotal)

    total = max(subtotal + platform_fee - points_discount, 0)
    earn_estimate = earn_for_subtotal(subtotal)

    return {
        "line_items": line_items,
        "subtotal": subtotal,
        "platform_fee": platform_fee,
        "platform_fee_rate": PLATFORM_FEE_RATE,
        "points_discount": points_discount,
        "points_redeemed": points_used,
        "points_balance": balance,
        "points_earn_estimate": earn_estimate,
        "total": total,
        "nights": nights,
        "guests": guests,
    }
