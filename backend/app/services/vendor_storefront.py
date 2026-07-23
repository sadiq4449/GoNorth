"""Public vendor storefront aggregation."""

from sqlalchemy.orm import Session

from app.db.models import Booking, Experience, Guide, Property, Room, TripReview, TourPackage, Vehicle, Vendor
from app.models.schemas import ExperienceOut, GuideOut, RoomOut, VendorStorefrontOut, VehicleOut
from app.services.catalog import load_approved_listings
from app.services.marketplace_packages import package_to_out
from app.services.pricing import effective_room_price
from app.services.vehicle_categories import category_label


def _vendor_reviews(db: Session, vendor: Vendor) -> tuple[float | None, int]:
    prop_ids = [p.id for p in vendor.properties]
    room_ids = [r.id for r in db.query(Room).filter(Room.property_id.in_(prop_ids)).all()] if prop_ids else []
    vehicle_ids = [v.id for v in db.query(Vehicle).filter(Vehicle.vendor_id == vendor.id).all()]
    guide_ids = [g.id for g in db.query(Guide).filter(Guide.vendor_id == vendor.id).all()]
    exp_ids = [e.id for e in db.query(Experience).filter(Experience.vendor_id == vendor.id).all()]

    refs: set[str] = set()
    for booking in db.query(Booking).filter(Booking.status == "confirmed").all():
        if booking.room_id in room_ids or booking.vehicle_id in vehicle_ids:
            refs.add(booking.reference)
            continue
        for gid in booking.get_guide_ids():
            if gid in guide_ids:
                refs.add(booking.reference)
                break
        else:
            import json

            for item in json.loads(booking.line_items_json or "[]"):
                if item.get("type") == "experience" and item.get("id") in exp_ids:
                    refs.add(booking.reference)
                    break

    reviews = db.query(TripReview).filter(TripReview.booking_reference.in_(refs)).all() if refs else []
    if not reviews:
        return None, 0
    avg = round(sum(r.rating for r in reviews) / len(reviews), 1)
    return avg, len(reviews)


def get_storefront(db: Session, slug: str) -> VendorStorefrontOut | None:
    vendor = db.query(Vendor).filter(Vendor.slug == slug, Vendor.status == "approved").first()
    if not vendor:
        return None

    avg_rating, review_count = _vendor_reviews(db, vendor)

    rooms: list[RoomOut] = []
    for prop in vendor.properties:
        for room in prop.rooms:
            if room.hidden:
                continue
            nightly = effective_room_price(db, room, vendor.id)
            rooms.append(
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

    vehicles: list[VehicleOut] = []
    for v in vendor.vehicles:
        if v.hidden:
            continue
        vehicles.append(
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

    guides: list[GuideOut] = []
    for g in vendor.guides:
        guides.append(
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

    packages = [
        package_to_out(db, pkg)
        for pkg in db.query(TourPackage)
        .filter(TourPackage.vendor_id == vendor.id, TourPackage.active.is_(True))
        .order_by(TourPackage.sort_order)
        .all()
    ]

    experiences: list[ExperienceOut] = []
    for exp in vendor.experiences:
        if exp.hidden:
            continue
        experiences.append(
            ExperienceOut(
                id=exp.id,
                vendor_id=exp.vendor_id,
                vendor_name=vendor.business_name,
                vendor_slug=vendor.slug,
                name=exp.name,
                category=exp.category,
                description=exp.description,
                price=exp.price,
                pricing_unit=exp.pricing_unit,
                valley=exp.valley,
                images=exp.get_images(),
                features=exp.get_features(),
                solo_safe=vendor.solo_safe,
                women_friendly=vendor.women_friendly,
                featured=vendor.is_featured,
            )
        )

    return VendorStorefrontOut(
        slug=vendor.slug,
        business_name=vendor.business_name,
        vendor_type=vendor.vendor_type,
        valley=vendor.valley,
        description=vendor.description or "",
        solo_safe=vendor.solo_safe,
        women_friendly=vendor.women_friendly,
        gold_badge=vendor.gold_badge,
        physically_vetted=vendor.physically_vetted,
        featured=vendor.is_featured,
        whatsapp=vendor.whatsapp or "",
        avg_rating=avg_rating,
        review_count=review_count,
        rooms=rooms,
        vehicles=vehicles,
        guides=guides,
        packages=packages,
        experiences=experiences,
    )
