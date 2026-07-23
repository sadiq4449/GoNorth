"""Vendor-authored tour packages and experiences CRUD."""

from __future__ import annotations

import json
import re

from sqlalchemy.orm import Session

from app.db.models import Experience, TourPackage, Vendor
from app.models.vendor_schemas import (
    VendorExperienceCreate,
    VendorExperienceOut,
    VendorExperienceUpdate,
    VendorPackageCreate,
    VendorPackageOut,
    VendorPackageUpdate,
)
from app.services.marketplace_packages import package_to_out


def _slugify(title: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", (title or "").lower()).strip("-")
    return slug[:100] or "package"


def _unique_package_slug(db: Session, title: str, exclude_id: str | None = None) -> str:
    base = _slugify(title)
    candidate = base
    n = 2
    while True:
        q = db.query(TourPackage).filter(TourPackage.slug == candidate)
        if exclude_id:
            q = q.filter(TourPackage.id != exclude_id)
        if not q.first():
            return candidate
        candidate = f"{base}-{n}"
        n += 1


def list_vendor_packages(db: Session, vendor_id: str) -> list[VendorPackageOut]:
    rows = (
        db.query(TourPackage)
        .filter(TourPackage.vendor_id == vendor_id)
        .order_by(TourPackage.sort_order, TourPackage.created_at.desc())
        .all()
    )
    out = []
    for pkg in rows:
        public = package_to_out(db, pkg)
        out.append(
            VendorPackageOut(
                id=pkg.id,
                slug=pkg.slug,
                title=pkg.title,
                destination=pkg.destination,
                valley=pkg.valley,
                nights=pkg.nights,
                vibe=pkg.vibe,
                starting_price=public.starting_price,
                active=pkg.active,
                featured=pkg.featured,
                bookable=public.bookable,
                description=pkg.description,
            )
        )
    return out


def create_vendor_package(db: Session, vendor: Vendor, data: VendorPackageCreate) -> VendorPackageOut:
    slug = _unique_package_slug(db, data.title)
    pkg = TourPackage(
        vendor_id=vendor.id,
        slug=slug,
        title=data.title,
        destination=data.destination,
        valley=data.valley or vendor.valley,
        nights=data.nights,
        vibe=data.vibe,
        badge=data.badge or "",
        badge_style=data.badge_style or "trending",
        rating=data.rating or 4.8,
        starting_price=data.starting_price or data.budget_hint or 0,
        budget_hint=data.budget_hint,
        description=data.description or "",
        highlights_json=json.dumps(data.highlights or []),
        inclusions_json=json.dumps(data.inclusions or []),
        exclusions_json=json.dumps(data.exclusions or []),
        itinerary_json=json.dumps(data.itinerary or []),
        image_layout=data.image_layout or "single",
        image_colors_json=json.dumps(data.image_colors or []),
        room_id=data.room_id,
        vehicle_id=data.vehicle_id,
        guide_ids_json=json.dumps(data.guide_ids or []),
        listing_valley=data.listing_valley,
        featured=data.featured,
        active=True,
    )
    db.add(pkg)
    db.commit()
    db.refresh(pkg)
    return VendorPackageOut(
        id=pkg.id,
        slug=pkg.slug,
        title=pkg.title,
        destination=pkg.destination,
        valley=pkg.valley,
        nights=pkg.nights,
        vibe=pkg.vibe,
        starting_price=pkg.starting_price,
        active=pkg.active,
        featured=pkg.featured,
        bookable=bool(pkg.room_id and pkg.vehicle_id),
        description=pkg.description,
    )


def update_vendor_package(
    db: Session,
    vendor: Vendor,
    package_id: str,
    data: VendorPackageUpdate,
) -> VendorPackageOut:
    pkg = db.get(TourPackage, package_id)
    if not pkg or pkg.vendor_id != vendor.id:
        raise ValueError("Package not found")

    if data.title is not None:
        pkg.title = data.title
    if data.destination is not None:
        pkg.destination = data.destination
    if data.valley is not None:
        pkg.valley = data.valley
    if data.nights is not None:
        pkg.nights = data.nights
    if data.vibe is not None:
        pkg.vibe = data.vibe
    if data.description is not None:
        pkg.description = data.description
    if data.highlights is not None:
        pkg.highlights_json = json.dumps(data.highlights)
    if data.inclusions is not None:
        pkg.inclusions_json = json.dumps(data.inclusions)
    if data.exclusions is not None:
        pkg.exclusions_json = json.dumps(data.exclusions)
    if data.itinerary is not None:
        pkg.itinerary_json = json.dumps(data.itinerary)
    if data.room_id is not None:
        pkg.room_id = data.room_id or None
    if data.vehicle_id is not None:
        pkg.vehicle_id = data.vehicle_id or None
    if data.guide_ids is not None:
        pkg.guide_ids_json = json.dumps(data.guide_ids)
    if data.budget_hint is not None:
        pkg.budget_hint = data.budget_hint
        pkg.starting_price = data.budget_hint
    if data.featured is not None:
        pkg.featured = data.featured
    if data.active is not None:
        pkg.active = data.active
    if data.badge is not None:
        pkg.badge = data.badge

    db.commit()
    db.refresh(pkg)
    for row in list_vendor_packages(db, vendor.id):
        if row.id == package_id:
            return row
    raise ValueError("Package not found")


def _experience_out(exp: Experience, vendor: Vendor) -> VendorExperienceOut:
    return VendorExperienceOut(
        id=exp.id,
        name=exp.name,
        category=exp.category,
        description=exp.description,
        price=exp.price,
        pricing_unit=exp.pricing_unit,
        valley=exp.valley,
        images=exp.get_images(),
        features=exp.get_features(),
        hidden=exp.hidden,
        vendor_name=vendor.business_name,
    )


def list_vendor_experiences(db: Session, vendor_id: str) -> list[VendorExperienceOut]:
    vendor = db.get(Vendor, vendor_id)
    if not vendor:
        return []
    rows = db.query(Experience).filter(Experience.vendor_id == vendor_id).order_by(Experience.name).all()
    return [_experience_out(e, vendor) for e in rows]


def create_vendor_experience(db: Session, vendor: Vendor, data: VendorExperienceCreate) -> VendorExperienceOut:
    exp = Experience(
        vendor_id=vendor.id,
        name=data.name,
        category=data.category,
        description=data.description or "",
        price=data.price,
        pricing_unit=data.pricing_unit,
        valley=data.valley or vendor.valley,
    )
    exp.set_images(data.images or [])
    exp.set_features(data.features or [])
    db.add(exp)
    db.commit()
    db.refresh(exp)
    return _experience_out(exp, vendor)


def update_vendor_experience(
    db: Session,
    vendor: Vendor,
    experience_id: str,
    data: VendorExperienceUpdate,
) -> VendorExperienceOut:
    exp = db.get(Experience, experience_id)
    if not exp or exp.vendor_id != vendor.id:
        raise ValueError("Experience not found")

    if data.name is not None:
        exp.name = data.name
    if data.category is not None:
        exp.category = data.category
    if data.description is not None:
        exp.description = data.description
    if data.price is not None:
        exp.price = data.price
    if data.pricing_unit is not None:
        exp.pricing_unit = data.pricing_unit
    if data.valley is not None:
        exp.valley = data.valley
    if data.images is not None:
        exp.set_images(data.images)
    if data.features is not None:
        exp.set_features(data.features)
    if data.hidden is not None:
        exp.hidden = data.hidden

    db.commit()
    db.refresh(exp)
    return _experience_out(exp, vendor)
