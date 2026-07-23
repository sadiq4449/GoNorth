"""Seed BaltiTour with demo hotels, vehicles, guides + admin account."""

import json
from datetime import datetime, timedelta, timezone

from app.auth.security import hash_password
from app.db.models import Guide, Property, Room, SessionLocal, User, Vehicle, Vendor, init_db
from app.services.vendor_slugs import ensure_unique_slug


def seed():
    init_db()
    db = SessionLocal()

    if db.query(User).filter(User.email == "admin@baltitour.com").first():
        print("Database already seeded.")
        db.close()
        return

    admin = User(
        email="admin@baltitour.com",
        password_hash=hash_password("admin123"),
        full_name="Super Admin",
        role="admin",
    )
    db.add(admin)
    db.flush()

    seed_vendors = [
        {
            "email": "hostel@skardu.com",
            "password": "vendor123",
            "name": "Karim Ali",
            "business": "Skardu Backpackers Hostel",
            "type": "hotel",
            "valley": "Skardu",
            "solo_safe": True,
            "women_friendly": True,
            "property": "Skardu Backpackers Hostel",
            "rooms": [
                ("Dorm Bed", 6, 4000, ["WiFi", "Hot Shower", "K2 View"]),
                ("Private Twin", 2, 6500, ["WiFi", "Breakfast"]),
            ],
        },
        {
            "email": "resort@skardu.com",
            "password": "vendor123",
            "name": "Sajjad Hussain",
            "business": "Shangrila Resort Skardu",
            "type": "hotel",
            "valley": "Skardu",
            "property": "Shangrila Resort",
            "rooms": [
                ("Lake View Suite", 4, 25000, ["Pool", "Fine Dine", "Boating"]),
            ],
        },
        {
            "email": "palace@khaplu.com",
            "password": "vendor123",
            "name": "Ahmed Khan",
            "business": "Khaplu Palace Heritage Hotel",
            "type": "hotel",
            "valley": "Khaplu",
            "gold": True,
            "property": "Khaplu Palace",
            "rooms": [
                ("Heritage Suite", 3, 35000, ["Heritage", "Valley View"]),
            ],
        },
        {
            "email": "hunza@hotel.com",
            "password": "vendor123",
            "name": "Nasir Ali",
            "business": "Hunza Eagle Nest Hotel",
            "type": "hotel",
            "valley": "Hunza",
            "property": "Eagle Nest",
            "rooms": [
                ("Standard Room", 2, 12000, ["WiFi", "Mountain View"]),
                ("Family Room", 4, 18000, ["WiFi", "Breakfast"]),
            ],
        },
        {
            "email": "shigar@guest.com",
            "password": "vendor123",
            "name": "Balti Guest House",
            "business": "Shigar Valley Guest House",
            "type": "hotel",
            "valley": "Shigar",
            "property": "Shigar Guest House",
            "rooms": [
                ("Standard", 2, 5500, ["Garden", "Hot Shower"]),
            ],
        },
    ]

    transport_vendors = [
        {
            "email": "prado@skardu.com",
            "password": "vendor123",
            "name": "Ali Murad",
            "business": "Murad Mountain Transport",
            "valley": "Skardu",
            "solo_safe": True,
            "vehicles": [
                ("Toyota Prado TX", "GB-8921", "Ali Murad", True, True, 15000, ["Urdu", "English", "Balti"], "suv_4x4", 5),
                ("Toyota Land Cruiser V8", "GB-8922", "Sajjad Murad", True, True, 22000, ["Urdu", "English"], "suv_4x4", 7),
                ("Toyota Hilux Double Cab", "GB-8923", "Imran Ali", True, True, 14000, ["Urdu", "Balti"], "pickup", 4),
            ],
        },
        {
            "email": "fleet@skardu.com",
            "password": "vendor123",
            "name": "Raza Transport Co",
            "business": "Skardu Fleet Rentals",
            "valley": "Skardu",
            "vehicles": [
                ("Toyota Corolla GLI", "GB-2201", "Raza Haider", False, True, 7000, ["Urdu"], "sedan", 4),
                ("Toyota Surf", "GB-2202", "Nasir Khan", True, True, 13000, ["Urdu", "English"], "suv_4x4", 5),
                ("Toyota HiAce Grand Cabin", "GB-4412", "Junaid Khan", False, True, 12000, ["Urdu", "English"], "van", 12),
                ("Toyota Coaster", "GB-4413", "Bashir Ahmed", False, True, 18000, ["Urdu"], "coaster", 25),
            ],
        },
        {
            "email": "hunza@transport.com",
            "password": "vendor123",
            "name": "Hunza Car Rentals",
            "business": "Hunza Valley Transport",
            "valley": "Hunza",
            "vehicles": [
                ("Toyota Prado TX", "GB-7733", "Karim Shah", True, True, 16000, ["Urdu", "English"], "suv_4x4", 5),
                ("Toyota TZ", "GB-7734", "Shah Khan", False, True, 11000, ["Urdu", "English"], "suv", 5),
                ("Toyota 5-Door", "GB-7735", "Ali Raza", False, True, 9000, ["Urdu"], "suv", 5),
            ],
        },
    ]

    guide_vendors = [
        {
            "email": "guide.k2@skardu.com",
            "password": "vendor123",
            "name": "Karim Shah",
            "business": "K2 Trek Guides",
            "valley": "Skardu",
            "guides": [
                ("Karim Shah", "K2 Basecamp Expedition", 8000, ["English", "Balti"]),
                ("Hassan Raza", "Concordia Trek", 7500, ["Urdu", "English"]),
            ],
        },
        {
            "email": "guide.deosai@skardu.com",
            "password": "vendor123",
            "name": "Deosai Wilderness Co",
            "business": "Deosai Wilderness Guides",
            "valley": "Skardu",
            "guides": [
                ("Bashir Ali", "Deosai Camping Expert", 6000, ["Urdu", "Balti"]),
            ],
        },
        {
            "email": "guide.culture@khaplu.com",
            "password": "vendor123",
            "name": "Heritage Walks Khaplu",
            "business": "Balti Cultural Heritage Tours",
            "valley": "Khaplu",
            "guides": [
                ("Fatima Bano", "Balti Cultural Heritage", 4000, ["Urdu", "Balti", "English"]),
            ],
        },
    ]

    for item in seed_vendors:
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
            vendor_type="hotel",
            valley=item["valley"],
            status="approved",
            solo_safe=item.get("solo_safe", False),
            women_friendly=item.get("women_friendly", False),
            gold_badge=item.get("gold", False),
        )
        db.add(vendor)
        db.flush()
        if item["business"] == "Murad 4x4 Services":
            vendor.featured_until = datetime.now(timezone.utc) + timedelta(days=30)
        prop = Property(vendor_id=vendor.id, name=item["property"], valley=item["valley"])
        db.add(prop)
        db.flush()
        for rname, cap, price, amenities in item["rooms"]:
            room = Room(property_id=prop.id, name=rname, capacity=cap, price_per_night=price)
            room.set_amenities(amenities)
            db.add(room)

    for item in transport_vendors:
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
            vendor_type="transport",
            valley=item["valley"],
            status="approved",
            solo_safe=item.get("solo_safe", False),
        )
        db.add(vendor)
        db.flush()
        if item["business"] == "Murad Mountain Transport":
            vendor.featured_until = datetime.now(timezone.utc) + timedelta(days=30)
        for model, plate, driver, is4, ac, rate, langs, cat, seats in item["vehicles"]:
            v = Vehicle(
                vendor_id=vendor.id,
                model=model,
                plate=plate,
                driver_name=driver,
                is_4x4=is4,
                has_ac=ac,
                vehicle_category=cat,
                seats=seats,
                daily_rate=rate,
            )
            v.languages_json = json.dumps(langs)
            db.add(v)

    for item in guide_vendors:
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
            vendor_type="guide",
            valley=item["valley"],
            status="approved",
        )
        db.add(vendor)
        db.flush()
        for gname, specialty, rate, langs in item["guides"]:
            g = Guide(vendor_id=vendor.id, name=gname, specialty=specialty, daily_rate=rate)
            g.languages_json = json.dumps(langs)
            db.add(g)

    db.commit()
    db.close()
    print("Seed complete.")
    print("  Admin:  admin@baltitour.com / admin123")
    print("  Vendor: hostel@skardu.com / vendor123")


if __name__ == "__main__":
    seed()
