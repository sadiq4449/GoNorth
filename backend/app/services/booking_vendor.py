"""Helpers for matching bookings to vendors."""

import json

from sqlalchemy.orm import Session

from app.db.models import Booking, Experience, Guide, Property, Room, Vehicle, Vendor
from app.services.wallet import vendor_id_for_line_item


def booking_matches_vendor(db: Session, booking: Booking, vendor: Vendor) -> bool:
    prop_ids = [p.id for p in vendor.properties]
    room_ids = [r.id for r in db.query(Room).filter(Room.property_id.in_(prop_ids)).all()] if prop_ids else []
    vehicle_ids = [v.id for v in db.query(Vehicle).filter(Vehicle.vendor_id == vendor.id).all()]
    guide_ids = [g.id for g in db.query(Guide).filter(Guide.vendor_id == vendor.id).all()]
    exp_ids = [e.id for e in db.query(Experience).filter(Experience.vendor_id == vendor.id).all()]

    if booking.room_id and booking.room_id in room_ids:
        return True
    if booking.vehicle_id and booking.vehicle_id in vehicle_ids:
        return True
    if any(gid in guide_ids for gid in booking.get_guide_ids()):
        return True
    for item in json.loads(booking.line_items_json or "[]"):
        if vendor_id_for_line_item(db, item) == vendor.id:
            return True
        if item.get("type") == "experience" and item.get("id") in exp_ids:
            return True
    return False
