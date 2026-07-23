from sqlalchemy.orm import Session

from app.db.models import Guide, Property, Room, Vehicle, Vendor
from app.models.schemas import GuideOut, RoomOut, VehicleOut
from app.services.pricing import date_range, effective_room_price, room_blocked_on_dates
from app.services.vehicle_categories import category_label


def load_approved_listings(
    db: Session,
    valley: str | None = None,
    check_in: str | None = None,
    nights: int = 1,
    solo_safe: bool | None = None,
    women_friendly: bool | None = None,
    featured_only: bool | None = None,
):
    vendor_q = db.query(Vendor).filter(Vendor.status == "approved")
    if valley:
        vendor_q = vendor_q.filter(Vendor.valley.ilike(f"%{valley}%"))
    if solo_safe:
        vendor_q = vendor_q.filter(Vendor.solo_safe.is_(True))
    if women_friendly:
        vendor_q = vendor_q.filter(Vendor.women_friendly.is_(True))
    vendors = vendor_q.all()
    if featured_only:
        vendors = [v for v in vendors if v.is_featured]
    vendors.sort(key=lambda v: (not v.is_featured, v.business_name))
    vendor_ids = [v.id for v in vendors]
    vendor_map = {v.id: v for v in vendors}

    rooms_out: list[RoomOut] = []
    if vendor_ids:
        props = db.query(Property).filter(Property.vendor_id.in_(vendor_ids)).all()
        prop_map = {p.id: p for p in props}
        prop_ids = [p.id for p in props]
        if prop_ids:
            block_dates = date_range(check_in, nights) if check_in else []
            for room in db.query(Room).filter(Room.property_id.in_(prop_ids), Room.hidden.is_(False)).all():
                if block_dates and room_blocked_on_dates(db, room.id, block_dates):
                    continue
                prop = prop_map[room.property_id]
                vendor = vendor_map[prop.vendor_id]
                nightly = effective_room_price(db, room, vendor.id)
                rooms_out.append(
                    RoomOut(
                        id=room.id,
                        property_id=room.property_id,
                        property_name=prop.name,
                        vendor_name=vendor.business_name,
                        valley=prop.valley,
                        name=room.name,
                        capacity=room.capacity,
                        price_per_night=nightly,
                        amenities=room.get_amenities(),
                        solo_safe=vendor.solo_safe,
                        women_friendly=vendor.women_friendly,
                        featured=vendor.is_featured,
                    )
                )

    vehicles_out: list[VehicleOut] = []
    guides_out: list[GuideOut] = []
    if vendor_ids:
        for v in db.query(Vehicle).filter(Vehicle.vendor_id.in_(vendor_ids), Vehicle.hidden.is_(False)).all():
            vendor = vendor_map[v.vendor_id]
            vehicles_out.append(
                VehicleOut(
                    id=v.id,
                    vendor_name=vendor.business_name,
                    valley=vendor.valley,
                    model=v.model,
                    plate=v.plate,
                    driver_name=v.driver_name,
                    is_4x4=v.is_4x4,
                    has_ac=v.has_ac,
                    vehicle_category=v.vehicle_category or "sedan",
                    category_label=category_label(v.vehicle_category or "sedan"),
                    seats=v.seats or 4,
                    daily_rate=v.daily_rate,
                    languages=v.get_languages(),
                    features=v.get_features(),
                    solo_safe=vendor.solo_safe,
                    women_friendly=vendor.women_friendly,
                    featured=vendor.is_featured,
                )
            )
        for g in db.query(Guide).filter(Guide.vendor_id.in_(vendor_ids)).all():
            vendor = vendor_map[g.vendor_id]
            guides_out.append(
                GuideOut(
                    id=g.id,
                    vendor_name=vendor.business_name,
                    valley=vendor.valley,
                    name=g.name,
                    specialty=g.specialty,
                    daily_rate=g.daily_rate,
                    languages=g.get_languages(),
                )
            )

    return rooms_out, vehicles_out, guides_out


def get_room(db: Session, room_id: str) -> Room | None:
    return db.get(Room, room_id)


def get_vehicle(db: Session, vehicle_id: str) -> Vehicle | None:
    return db.get(Vehicle, vehicle_id)


def get_guides(db: Session, guide_ids: list[str]) -> list[Guide]:
    if not guide_ids:
        return []
    return db.query(Guide).filter(Guide.id.in_(guide_ids)).all()
