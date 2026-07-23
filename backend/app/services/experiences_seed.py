"""Seed demo restaurants and activities for the marketplace."""

from sqlalchemy.orm import Session

from app.auth.security import hash_password
from app.db.models import Experience, User, Vendor
from app.services.vendor_slugs import ensure_unique_slug

DEMO_EXPERIENCES = [
    {
        "email": "cafe@skardu.com",
        "password": "vendor123",
        "name": "Hussain Cafe",
        "business": "Hussain Traditional Cafe",
        "vendor_type": "restaurant",
        "valley": "Skardu",
        "description": "Authentic Balti cuisine with lake views — popular with trekkers and families.",
        "experiences": [
            ("Traditional Balti Thali", "restaurant", "Full local meal with soup, bread, and meat curry.", 1200, "per_person", ["Halal", "Local cuisine", "Family friendly"]),
            ("Trout BBQ Dinner", "restaurant", "Fresh trout from Kachura with sides and tea.", 1800, "per_person", ["Fresh catch", "Evening seating"]),
        ],
    },
    {
        "email": "trek@hunza.com",
        "password": "vendor123",
        "name": "Passu Adventures",
        "business": "Passu Adventure Co",
        "vendor_type": "activity",
        "valley": "Hunza",
        "description": "Guided hikes, photography walks, and cultural experiences in upper Hunza.",
        "experiences": [
            ("Eagle's Nest Sunset Trek", "activity", "Guided hike to Duikar with photography stops.", 4500, "per_person", ["2–3 hours", "Photography", "Moderate"]),
            ("Baltit Fort Heritage Walk", "activity", "Cultural walk with local historian.", 3500, "flat", ["Half day", "Culture", "Easy"]),
        ],
    },
]


def ensure_demo_experiences(db: Session) -> None:
    for item in DEMO_EXPERIENCES:
        existing = db.query(User).filter(User.email == item["email"]).first()
        if existing:
            vendor = db.query(Vendor).filter(Vendor.user_id == existing.id).first()
            if vendor and not vendor.slug:
                vendor.slug = ensure_unique_slug(db, vendor.business_name, vendor.id)
            continue

        user = User(
            email=item["email"],
            password_hash=hash_password(item["password"]),
            full_name=item["name"],
            role="vendor",
        )
        db.add(user)
        db.flush()
        vendor = Vendor(
            user_id=user.id,
            business_name=item["business"],
            slug=ensure_unique_slug(db, item["business"]),
            vendor_type=item["vendor_type"],
            valley=item["valley"],
            status="approved",
            description=item["description"],
            women_friendly=True,
        )
        db.add(vendor)
        db.flush()
        for ename, cat, desc, price, unit, features in item["experiences"]:
            exp = Experience(
                vendor_id=vendor.id,
                name=ename,
                category=cat,
                description=desc,
                price=price,
                pricing_unit=unit,
                valley=item["valley"],
            )
            exp.set_features(list(features))
            db.add(exp)
    db.commit()
