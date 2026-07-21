from datetime import date, datetime, timedelta

from sqlalchemy.orm import Session

from app.db.models import Property, Room, RoomBlock, RouteTariff, SeasonPricing, Vendor


def current_season(d: date | None = None) -> str:
    month = (d or date.today()).month
    if month in (4, 5, 7):
        return "high"
    if month in (6, 8):
        return "mid"
    return "low"


def get_season_multiplier(
    db: Session,
    vendor_id: str,
    room_id: str | None = None,
    on_date: date | None = None,
) -> float:
    season = current_season(on_date)
    rules = (
        db.query(SeasonPricing)
        .filter(SeasonPricing.vendor_id == vendor_id, SeasonPricing.season == season)
        .all()
    )
    if not rules:
        return 1.0
    room_rule = next((r for r in rules if r.room_id == room_id), None)
    if room_rule:
        return room_rule.multiplier
    global_rule = next((r for r in rules if r.room_id is None), None)
    return global_rule.multiplier if global_rule else 1.0


def effective_room_price(
    db: Session,
    room: Room,
    vendor_id: str,
    on_date: date | None = None,
) -> int:
    mult = get_season_multiplier(db, vendor_id, room.id, on_date)
    return int(round(room.price_per_night * mult))


def date_range(start: str, nights: int) -> list[str]:
    base = datetime.strptime(start, "%Y-%m-%d").date()
    return [(base + timedelta(days=i)).isoformat() for i in range(nights)]


def room_blocked_on_dates(db: Session, room_id: str, dates: list[str]) -> bool:
    if not dates:
        return False
    hit = (
        db.query(RoomBlock)
        .filter(RoomBlock.room_id == room_id, RoomBlock.block_date.in_(dates))
        .first()
    )
    return hit is not None


def route_tariff_rate(
    db: Session,
    vendor_id: str,
    destination: str,
    vehicle_id: str | None = None,
) -> int | None:
    dest = destination.lower()
    q = db.query(RouteTariff).filter(
        RouteTariff.vendor_id == vendor_id,
        RouteTariff.active.is_(True),
    )
    if vehicle_id:
        q = q.filter(
            (RouteTariff.vehicle_id == vehicle_id) | (RouteTariff.vehicle_id.is_(None))
        )
    for t in q.all():
        if t.destination.lower() in dest or dest in t.destination.lower():
            return t.daily_rate
    return None


def vendor_property_ids(db: Session, vendor_id: str) -> list[str]:
    return [p.id for p in db.query(Property).filter(Property.vendor_id == vendor_id).all()]


def vendor_rooms(db: Session, vendor_id: str) -> list[Room]:
    prop_ids = vendor_property_ids(db, vendor_id)
    if not prop_ids:
        return []
    return db.query(Room).filter(Room.property_id.in_(prop_ids)).all()


def ensure_default_tariffs(db: Session, vendor: Vendor) -> None:
    if vendor.vendor_type not in ("transport", "mixed"):
        return
    if db.query(RouteTariff).filter(RouteTariff.vendor_id == vendor.id).first():
        return
    defaults = [
        ("Skardu", "Khaplu", "Mountain Road (Paved)", 8000),
        ("Skardu", "Deosai", "Off-Road (Steep Elevation)", 15000),
        ("Skardu", "Shigar", "Valley Road (Mixed)", 5000),
        ("Skardu", "Basho", "Off-Road (Forest Track)", 10000),
        ("Skardu", "Hunza", "Mountain Highway", 12000),
    ]
    for origin, dest, terrain, rate in defaults:
        db.add(
            RouteTariff(
                vendor_id=vendor.id,
                origin=origin,
                destination=dest,
                terrain_type=terrain,
                daily_rate=rate,
            )
        )
    db.commit()
