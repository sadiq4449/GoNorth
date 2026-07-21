import json
import uuid
from pathlib import Path

from fastapi import HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.config import settings
from app.db.models import FleetDriver, Property, Room, RoomBlock, RouteTariff, SeasonPricing, User, Vehicle, Vendor
from app.models.vendor_schemas import (
    CalendarDayOut,
    FleetDriverOut,
    RouteTariffOut,
    SeasonPricingPreview,
    SeasonRuleOut,
    VendorDashboardOut,
    VendorRoomOut,
    VendorVehicleOut,
)
from app.services.pricing import (
    date_range,
    effective_room_price,
    ensure_default_tariffs,
    vendor_property_ids,
    vendor_rooms,
)

UPLOAD_DIR = Path(__file__).resolve().parents[2] / "uploads"


def get_vendor_for_user(db: Session, user: User) -> Vendor:
    vendor = db.query(Vendor).filter(Vendor.user_id == user.id).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor profile not found")
    return vendor


def _room_out(db: Session, room: Room, prop: Property) -> VendorRoomOut:
    return VendorRoomOut(
        id=room.id,
        property_id=room.property_id,
        property_name=prop.name,
        name=room.name,
        capacity=room.capacity,
        price_per_night=room.price_per_night,
        effective_price=effective_room_price(db, room, prop.vendor_id),
        amenities=room.get_amenities(),
        images=room.get_images(),
        hidden=room.hidden,
    )


def _vehicle_out(v: Vehicle) -> VendorVehicleOut:
    return VendorVehicleOut(
        id=v.id,
        model=v.model,
        plate=v.plate,
        driver_name=v.driver_name,
        is_4x4=v.is_4x4,
        has_ac=v.has_ac,
        daily_rate=v.daily_rate,
        languages=v.get_languages(),
        features=v.get_features(),
        images=v.get_images(),
        model_year=v.model_year,
        fleet_driver_id=v.fleet_driver_id,
        hidden=v.hidden,
    )


def _driver_out(d: FleetDriver) -> FleetDriverOut:
    return FleetDriverOut(
        id=d.id,
        name=d.name,
        phone=d.phone,
        languages=json.loads(d.languages_json or "[]"),
        experience_years=d.experience_years,
        route_knowledge=d.route_knowledge,
        active=d.active,
        vehicle_count=len(d.vehicles),
    )


def dashboard_summary(db: Session, vendor: Vendor) -> VendorDashboardOut:
    ensure_default_tariffs(db, vendor)
    rooms = vendor_rooms(db, vendor.id)
    vehicles = db.query(Vehicle).filter(Vehicle.vendor_id == vendor.id).all()
    drivers = db.query(FleetDriver).filter(FleetDriver.vendor_id == vendor.id).all()
    tariffs = db.query(RouteTariff).filter(RouteTariff.vendor_id == vendor.id).count()
    room_ids = [r.id for r in rooms]
    blocked = 0
    if room_ids:
        blocked = db.query(RoomBlock).filter(RoomBlock.room_id.in_(room_ids)).count()

    return VendorDashboardOut(
        business_name=vendor.business_name,
        vendor_type=vendor.vendor_type,
        valley=vendor.valley,
        status=vendor.status,
        room_count=len(rooms),
        vehicle_count=len(vehicles),
        driver_count=len(drivers),
        tariff_count=tariffs,
        blocked_nights=blocked,
        featured=vendor.is_featured,
        featured_until=vendor.featured_until,
    )


def list_vendor_rooms(db: Session, vendor: Vendor) -> list[VendorRoomOut]:
    prop_ids = vendor_property_ids(db, vendor.id)
    if not prop_ids:
        return []
    props = {p.id: p for p in db.query(Property).filter(Property.id.in_(prop_ids)).all()}
    rooms = db.query(Room).filter(Room.property_id.in_(prop_ids)).order_by(Room.name).all()
    return [_room_out(db, r, props[r.property_id]) for r in rooms]


def get_or_create_property(db: Session, vendor: Vendor) -> Property:
    prop = db.query(Property).filter(Property.vendor_id == vendor.id).first()
    if prop:
        return prop
    prop = Property(vendor_id=vendor.id, name=vendor.business_name, valley=vendor.valley)
    db.add(prop)
    db.flush()
    return prop


def create_room(db: Session, vendor: Vendor, data) -> VendorRoomOut:
    if vendor.vendor_type not in ("hotel", "mixed"):
        raise HTTPException(status_code=400, detail="Only hotel vendors can manage rooms")
    prop = get_or_create_property(db, vendor)
    room = Room(
        property_id=prop.id,
        name=data.name,
        capacity=data.capacity,
        price_per_night=data.price_per_night,
    )
    room.set_amenities(data.amenities)
    room.set_images(data.images)
    db.add(room)
    db.commit()
    db.refresh(room)
    return _room_out(db, room, prop)


def update_room(db: Session, vendor: Vendor, room_id: str, data) -> VendorRoomOut:
    prop_ids = vendor_property_ids(db, vendor.id)
    room = db.query(Room).filter(Room.id == room_id, Room.property_id.in_(prop_ids)).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    prop = db.get(Property, room.property_id)
    if data.name is not None:
        room.name = data.name
    if data.capacity is not None:
        room.capacity = data.capacity
    if data.price_per_night is not None:
        room.price_per_night = data.price_per_night
    if data.amenities is not None:
        room.set_amenities(data.amenities)
    if data.images is not None:
        room.set_images(data.images)
    if data.hidden is not None:
        room.hidden = data.hidden
    db.commit()
    db.refresh(room)
    return _room_out(db, room, prop)


def room_calendar(db: Session, vendor: Vendor, room_id: str, start: str, days: int = 14):
    prop_ids = vendor_property_ids(db, vendor.id)
    room = db.query(Room).filter(Room.id == room_id, Room.property_id.in_(prop_ids)).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")

    dates = date_range(start, days)
    blocks = {
        b.block_date
        for b in db.query(RoomBlock).filter(
            RoomBlock.room_id == room_id, RoomBlock.block_date.in_(dates)
        )
    }
    return {
        "room_id": room.id,
        "room_name": room.name,
        "days": [CalendarDayOut(date=d, blocked=d in blocks) for d in dates],
    }


def toggle_room_block(db: Session, vendor: Vendor, room_id: str, block_date: str, blocked: bool):
    prop_ids = vendor_property_ids(db, vendor.id)
    room = db.query(Room).filter(Room.id == room_id, Room.property_id.in_(prop_ids)).first()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")

    existing = (
        db.query(RoomBlock)
        .filter(RoomBlock.room_id == room_id, RoomBlock.block_date == block_date)
        .first()
    )
    if blocked and not existing:
        db.add(RoomBlock(room_id=room_id, block_date=block_date))
    elif not blocked and existing:
        db.delete(existing)
    db.commit()


def list_season_rules(db: Session, vendor: Vendor) -> list[SeasonRuleOut]:
    rules = db.query(SeasonPricing).filter(SeasonPricing.vendor_id == vendor.id).all()
    return [
        SeasonRuleOut(id=r.id, season=r.season, multiplier=r.multiplier, room_id=r.room_id)
        for r in rules
    ]


def update_season_rules(db: Session, vendor: Vendor, rules: list[dict]) -> list[SeasonPricingPreview]:
    db.query(SeasonPricing).filter(SeasonPricing.vendor_id == vendor.id).delete()
    rooms = {r.id: r for r in vendor_rooms(db, vendor.id)}
    previews: list[SeasonPricingPreview] = []

    for item in rules:
        season = item.get("season")
        multiplier = float(item.get("multiplier", 1.0))
        room_id = item.get("room_id")
        if season not in ("high", "mid", "low"):
            continue
        if room_id and room_id not in rooms:
            continue
        db.add(
            SeasonPricing(
                vendor_id=vendor.id,
                room_id=room_id,
                season=season,
                multiplier=multiplier,
            )
        )

    db.commit()

    for item in rules:
        season = item.get("season")
        if season not in ("high", "mid", "low"):
            continue
        mult = float(item.get("multiplier", 1.0))
        room_id = item.get("room_id")
        targets = [rooms[room_id]] if room_id else list(rooms.values())
        for room in targets:
            previews.append(
                SeasonPricingPreview(
                    season=season,
                    multiplier=mult,
                    room_id=room.id,
                    room_name=room.name,
                    base_rate=room.price_per_night,
                    effective_rate=int(round(room.price_per_night * mult)),
                )
            )
    return previews


def list_tariffs(db: Session, vendor: Vendor) -> list[RouteTariffOut]:
    ensure_default_tariffs(db, vendor)
    rows = db.query(RouteTariff).filter(RouteTariff.vendor_id == vendor.id).order_by(RouteTariff.destination).all()
    return [
        RouteTariffOut(
            id=t.id,
            vehicle_id=t.vehicle_id,
            origin=t.origin,
            destination=t.destination,
            terrain_type=t.terrain_type,
            daily_rate=t.daily_rate,
            active=t.active,
        )
        for t in rows
    ]


def create_tariff(db: Session, vendor: Vendor, data) -> RouteTariffOut:
    if vendor.vendor_type not in ("transport", "mixed"):
        raise HTTPException(status_code=400, detail="Only transport vendors manage tariffs")
    t = RouteTariff(
        vendor_id=vendor.id,
        vehicle_id=data.vehicle_id,
        origin=data.origin,
        destination=data.destination,
        terrain_type=data.terrain_type,
        daily_rate=data.daily_rate,
        active=data.active,
    )
    db.add(t)
    db.commit()
    db.refresh(t)
    return RouteTariffOut(
        id=t.id,
        vehicle_id=t.vehicle_id,
        origin=t.origin,
        destination=t.destination,
        terrain_type=t.terrain_type,
        daily_rate=t.daily_rate,
        active=t.active,
    )


def update_tariff(db: Session, vendor: Vendor, tariff_id: str, data) -> RouteTariffOut:
    t = db.query(RouteTariff).filter(RouteTariff.id == tariff_id, RouteTariff.vendor_id == vendor.id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Tariff not found")
    for field in ("origin", "destination", "terrain_type", "daily_rate", "active", "vehicle_id"):
        val = getattr(data, field, None)
        if val is not None:
            setattr(t, field, val)
    db.commit()
    db.refresh(t)
    return RouteTariffOut(
        id=t.id,
        vehicle_id=t.vehicle_id,
        origin=t.origin,
        destination=t.destination,
        terrain_type=t.terrain_type,
        daily_rate=t.daily_rate,
        active=t.active,
    )


def delete_tariff(db: Session, vendor: Vendor, tariff_id: str) -> None:
    t = db.query(RouteTariff).filter(RouteTariff.id == tariff_id, RouteTariff.vendor_id == vendor.id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Tariff not found")
    db.delete(t)
    db.commit()


def list_fleet_drivers(db: Session, vendor: Vendor) -> list[FleetDriverOut]:
    rows = db.query(FleetDriver).filter(FleetDriver.vendor_id == vendor.id).order_by(FleetDriver.name).all()
    return [_driver_out(d) for d in rows]


def create_fleet_driver(db: Session, vendor: Vendor, data) -> FleetDriverOut:
    d = FleetDriver(
        vendor_id=vendor.id,
        name=data.name,
        phone=data.phone,
        experience_years=data.experience_years,
        route_knowledge=data.route_knowledge,
    )
    d.languages_json = json.dumps(data.languages)
    db.add(d)
    db.commit()
    db.refresh(d)
    return _driver_out(d)


def update_fleet_driver(db: Session, vendor: Vendor, driver_id: str, data) -> FleetDriverOut:
    d = db.query(FleetDriver).filter(FleetDriver.id == driver_id, FleetDriver.vendor_id == vendor.id).first()
    if not d:
        raise HTTPException(status_code=404, detail="Driver not found")
    if data.name is not None:
        d.name = data.name
    if data.phone is not None:
        d.phone = data.phone
    if data.languages is not None:
        d.languages_json = json.dumps(data.languages)
    if data.experience_years is not None:
        d.experience_years = data.experience_years
    if data.route_knowledge is not None:
        d.route_knowledge = data.route_knowledge
    if data.active is not None:
        d.active = data.active
    db.commit()
    db.refresh(d)
    return _driver_out(d)


def list_vehicles(db: Session, vendor: Vendor) -> list[VendorVehicleOut]:
    rows = db.query(Vehicle).filter(Vehicle.vendor_id == vendor.id).order_by(Vehicle.model).all()
    return [_vehicle_out(v) for v in rows]


def create_vehicle(db: Session, vendor: Vendor, data) -> VendorVehicleOut:
    if vendor.vendor_type not in ("transport", "mixed"):
        raise HTTPException(status_code=400, detail="Only transport vendors manage vehicles")
    v = Vehicle(
        vendor_id=vendor.id,
        model=data.model,
        plate=data.plate,
        driver_name=data.driver_name,
        is_4x4=data.is_4x4,
        has_ac=data.has_ac,
        daily_rate=data.daily_rate,
        model_year=data.model_year,
        fleet_driver_id=data.fleet_driver_id,
    )
    v.languages_json = json.dumps(data.languages)
    v.set_features(data.features)
    v.set_images(data.images)
    db.add(v)
    db.commit()
    db.refresh(v)
    return _vehicle_out(v)


def update_vehicle(db: Session, vendor: Vendor, vehicle_id: str, data) -> VendorVehicleOut:
    v = db.query(Vehicle).filter(Vehicle.id == vehicle_id, Vehicle.vendor_id == vendor.id).first()
    if not v:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    for field in ("model", "plate", "driver_name", "is_4x4", "has_ac", "daily_rate", "model_year", "fleet_driver_id", "hidden"):
        val = getattr(data, field, None)
        if val is not None:
            setattr(v, field, val)
    if data.languages is not None:
        v.languages_json = json.dumps(data.languages)
    if data.features is not None:
        v.set_features(data.features)
    if data.images is not None:
        v.set_images(data.images)
    db.commit()
    db.refresh(v)
    return _vehicle_out(v)


async def save_upload(file: UploadFile) -> str:
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    ext = Path(file.filename or "img.jpg").suffix.lower() or ".jpg"
    if ext not in (".jpg", ".jpeg", ".png", ".webp", ".gif"):
        raise HTTPException(status_code=400, detail="Unsupported image type")
    name = f"{uuid.uuid4().hex}{ext}"
    dest = UPLOAD_DIR / name
    content = await file.read()
    if len(content) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image must be under 5MB")
    dest.write_bytes(content)
    return f"/uploads/{name}"
