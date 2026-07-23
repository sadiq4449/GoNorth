"""Marketplace tour packages — operator SKUs, seeding, live pricing, inquiries."""

from __future__ import annotations

import json

from sqlalchemy.orm import Session

from app.db.models import PackageInquiry, TourPackage, Vendor
from app.models.schemas import (
    PackageInquiryRequest,
    PackageInquiryResponse,
    RecommendRequest,
    TourPackageDetailOut,
    TourPackageOut,
)
from app.services.cart import quote_cart
from app.services.catalog import load_approved_listings
from app.services.recommend_rules import _pick_by_vibe

DEFAULT_PACKAGES = [
    {
        "slug": "skardu-valley-explorer",
        "title": "Skardu Valley Explorer",
        "destination": "Skardu",
        "valley": "Skardu",
        "nights": 5,
        "vibe": "backpacker",
        "badge": "TRENDING",
        "badge_style": "trending",
        "rating": 4.9,
        "budget_hint": 65000,
        "image_layout": "single",
        "image_colors": ["#1e4976", "#3d8fd1"],
        "description": (
            "Discover Skardu Bazaar, Kachura lakes, and Shangrila Resort with verified local stays "
            "and private transport — ideal for first-time Gilgit-Baltistan visitors."
        ),
        "highlights": ["Skardu Bazaar & Upper Kachura", "Shangrila Resort day trip", "Verified hostel stay", "Private vehicle with driver"],
        "inclusions": ["Accommodation", "Private transport", "Driver fuel & tolls", "Platform support"],
        "exclusions": ["Meals", "Entry tickets", "Personal expenses", "Travel insurance"],
        "itinerary": [
            {"day": 1, "title": "Arrive Skardu", "description": "Check in, explore bazaar and food street."},
            {"day": 2, "title": "Upper & Lower Kachura", "description": "Boating at Kachura Lake and Shangrila."},
            {"day": 3, "title": "Deosai day trip", "description": "Optional plateau excursion (seasonal, 4x4)."},
            {"day": 4, "title": "Shigar Fort", "description": "Heritage walk and valley views."},
            {"day": 5, "title": "Departure", "description": "Flexible checkout and airport drop."},
        ],
        "featured": True,
        "sort_order": 1,
    },
    {
        "slug": "hunza-cherry-blossom",
        "title": "Hunza Cherry Blossom",
        "destination": "Hunza",
        "valley": "Hunza",
        "nights": 6,
        "vibe": "luxury",
        "badge": "POPULAR",
        "badge_style": "popular",
        "rating": 5.0,
        "budget_hint": 120000,
        "image_layout": "single",
        "image_colors": ["#0d5c4a", "#3cb89a"],
        "description": "Luxury Hunza escape with Eagle's Nest views, Baltit Fort, and Passu cones — peak season cherry blossom route.",
        "highlights": ["Eagle's Nest sunset", "Baltit & Altit Forts", "Passu cones viewpoint", "Premium family room"],
        "inclusions": ["Boutique stay", "AC/heater vehicle", "Experienced driver", "Trip support line"],
        "exclusions": ["Flights to Gilgit/ Skardu", "Lunch & dinner", "Guide tips"],
        "itinerary": [
            {"day": 1, "title": "Karimabad arrival", "description": "Scenic drive and check-in."},
            {"day": 2, "title": "Forts & culture", "description": "Baltit and Altit heritage sites."},
            {"day": 3, "title": "Eagle's Nest", "description": "Sunset and photography session."},
            {"day": 4, "title": "Passu & Attabad", "description": "Lake viewpoint and suspension bridge."},
            {"day": 5, "title": "Khunjerab optional", "description": "Border day trip (permits extra)."},
            {"day": 6, "title": "Departure", "description": "Return transfer."},
        ],
        "featured": True,
        "sort_order": 2,
    },
    {
        "slug": "deosai-plateau-adventure",
        "title": "Deosai Plateau Adventure",
        "destination": "Deosai",
        "valley": "Skardu",
        "listing_valley": "Skardu",
        "nights": 4,
        "vibe": "adventure",
        "badge": "NEW",
        "badge_style": "new",
        "rating": 4.8,
        "budget_hint": 90000,
        "image_layout": "split",
        "image_colors": ["#4a3728", "#8b6914", "#c4a035"],
        "description": "4x4 expedition across Deosai National Park with camping expert guide — brown bears, wildflowers, and starry nights.",
        "highlights": ["4x4 Deosai crossing", "Camping expert guide", "Sheosar Lake", "Wildlife spotting"],
        "inclusions": ["Guide", "4x4 vehicle", "Camping coordination", "Park logistics support"],
        "exclusions": ["Camping gear rental", "Meals on plateau", "Park fees if applicable"],
        "itinerary": [
            {"day": 1, "title": "Skardu briefing", "description": "Gear check and route planning."},
            {"day": 2, "title": "Enter Deosai", "description": "Plateau crossing to Sheosar."},
            {"day": 3, "title": "Explore & camp", "description": "Wildlife and photography day."},
            {"day": 4, "title": "Return Skardu", "description": "Descent and checkout."},
        ],
        "featured": True,
        "sort_order": 3,
    },
    {
        "slug": "khaplu-heritage-trail",
        "title": "Khaplu Heritage Trail",
        "destination": "Khaplu",
        "valley": "Khaplu",
        "listing_valley": "Skardu",
        "nights": 5,
        "vibe": "backpacker",
        "badge": "POPULAR",
        "badge_style": "popular",
        "rating": 4.9,
        "budget_hint": 75000,
        "image_layout": "collage",
        "image_colors": ["#5c3d2e", "#a67c52", "#d4a574", "#8b5a3c"],
        "description": "Walk through Khaplu Palace, Chaqchan Mosque, and Ghanche valley culture with a heritage-focused local guide.",
        "highlights": ["Khaplu Palace", "Heritage guide", "Ghanche valley", "Mashabrum views"],
        "inclusions": ["Stay near Khaplu", "Transport from Skardu", "Heritage guide", "Platform fee"],
        "exclusions": ["Meals", "Museum tickets", "Optional Mashabrum trek"],
        "itinerary": [
            {"day": 1, "title": "Skardu to Khaplu", "description": "Scenic Ghanche drive."},
            {"day": 2, "title": "Palace & mosque", "description": "Guided heritage tour."},
            {"day": 3, "title": "Village walk", "description": "Local crafts and apricot orchards."},
            {"day": 4, "title": "Free exploration", "description": "Optional short hikes."},
            {"day": 5, "title": "Return", "description": "Transfer to Skardu."},
        ],
        "featured": True,
        "sort_order": 4,
    },
    {
        "slug": "shigar-fort-retreat",
        "title": "Shigar Fort Retreat",
        "destination": "Shigar",
        "valley": "Shigar",
        "listing_valley": "Shigar",
        "nights": 3,
        "vibe": "luxury",
        "badge": "NEW",
        "badge_style": "new",
        "rating": 4.7,
        "budget_hint": 85000,
        "image_layout": "single",
        "image_colors": ["#7c4a2d", "#c9956c"],
        "description": "Stay near the restored Shigar Fort with curated valley walks and apricot orchard visits.",
        "highlights": ["Shigar Fort visit", "Heritage guest house", "Valley walks", "Local cuisine stops"],
        "inclusions": ["Heritage stay", "Airport/Skardu transfers", "Valley transport"],
        "exclusions": ["Fort entry fee", "Meals", "Personal shopping"],
        "itinerary": [
            {"day": 1, "title": "Arrive Shigar", "description": "Fort orientation and check-in."},
            {"day": 2, "title": "Valley day", "description": "Orchards, mosque, and village trail."},
            {"day": 3, "title": "Departure", "description": "Return to Skardu or onward."},
        ],
        "featured": False,
        "sort_order": 5,
    },
    {
        "slug": "basho-meadows-trek",
        "title": "Basho Meadows Trek",
        "destination": "Basho",
        "valley": "Skardu",
        "listing_valley": "Skardu",
        "nights": 4,
        "vibe": "adventure",
        "badge": "TRENDING",
        "badge_style": "trending",
        "rating": 4.8,
        "budget_hint": 70000,
        "image_layout": "split",
        "image_colors": ["#2d5016", "#6b8f3c", "#a4c639"],
        "description": "Trek to Basho Meadows with camping support — wildflowers, pine forests, and K2 range panoramas.",
        "highlights": ["Basho Meadows trek", "Camping support", "K2 range views", "4x4 approach"],
        "inclusions": ["Guide", "4x4 approach vehicle", "Camping coordination"],
        "exclusions": ["Trekking gear", "Meals", "Porter fees"],
        "itinerary": [
            {"day": 1, "title": "Skardu prep", "description": "Briefing and supplies."},
            {"day": 2, "title": "Drive & trek start", "description": "4x4 to trailhead, hike to camp."},
            {"day": 3, "title": "Meadows exploration", "description": "Full day at Basho."},
            {"day": 4, "title": "Return", "description": "Trek out and transfer."},
        ],
        "featured": False,
        "sort_order": 6,
    },
]


def _duration_label(nights: int) -> str:
    return f"{nights + 1}D/{nights}N"


def _resolve_inventory(db: Session, pkg: TourPackage) -> tuple[str | None, str | None, list[str], int | None]:
    """Attach live inventory IDs and price when possible."""
    if pkg.room_id and pkg.vehicle_id:
        try:
            quote = quote_cart(
                db,
                room_id=pkg.room_id,
                vehicle_id=pkg.vehicle_id,
                guide_ids=pkg.get_guide_ids(),
                nights=pkg.nights,
            )
            return pkg.room_id, pkg.vehicle_id, pkg.get_guide_ids(), quote["total"]
        except Exception:
            pass

    listing_valley = pkg.listing_valley or pkg.destination
    budget = pkg.budget_hint or pkg.starting_price or 80000
    rooms, vehicles, guides, _ = load_approved_listings(db, valley=listing_valley)
    if not rooms or not vehicles:
        return pkg.room_id, pkg.vehicle_id, pkg.get_guide_ids(), pkg.starting_price or None

    try:
        room, vehicle, guide_ids = _pick_by_vibe(
            rooms, vehicles, guides, pkg.vibe, budget, pkg.nights, pkg.destination
        )
        quote = quote_cart(
            db,
            room_id=room.id,
            vehicle_id=vehicle.id,
            guide_ids=guide_ids,
            nights=pkg.nights,
        )
        return room.id, vehicle.id, guide_ids, quote["total"]
    except Exception:
        return pkg.room_id, pkg.vehicle_id, pkg.get_guide_ids(), pkg.starting_price or None


def _operator_name(db: Session, vendor_id: str | None) -> str:
    if not vendor_id:
        return "GoNorth Curated"
    vendor = db.get(Vendor, vendor_id)
    return vendor.business_name if vendor else "Verified Operator"


def package_to_out(db: Session, pkg: TourPackage, *, include_quote: bool = False) -> TourPackageOut:
    room_id, vehicle_id, guide_ids, live_price = _resolve_inventory(db, pkg)
    starting_price = live_price or pkg.starting_price or 0
    quote = None
    if include_quote and room_id and vehicle_id:
        try:
            quote = quote_cart(db, room_id=room_id, vehicle_id=vehicle_id, guide_ids=guide_ids, nights=pkg.nights)
        except Exception:
            quote = None

    return TourPackageOut(
        id=pkg.id,
        slug=pkg.slug,
        title=pkg.title,
        destination=pkg.destination,
        valley=pkg.valley,
        nights=pkg.nights,
        duration_label=_duration_label(pkg.nights),
        vibe=pkg.vibe,
        badge=pkg.badge,
        badge_style=pkg.badge_style,
        rating=pkg.rating,
        image_layout=pkg.image_layout,
        image_colors=pkg.get_image_colors(),
        starting_price=starting_price,
        room_id=room_id or "",
        vehicle_id=vehicle_id or "",
        guide_ids=guide_ids,
        reason=pkg.description[:120] if pkg.description else "",
        quote=quote,
        operator_name=_operator_name(db, pkg.vendor_id),
        bookable=bool(room_id and vehicle_id),
        featured=pkg.featured,
    )


def package_to_detail(db: Session, pkg: TourPackage) -> TourPackageDetailOut:
    base = package_to_out(db, pkg, include_quote=True)
    return TourPackageDetailOut(
        **base.model_dump(),
        description=pkg.description,
        highlights=pkg.get_highlights(),
        inclusions=pkg.get_inclusions(),
        exclusions=pkg.get_exclusions(),
        itinerary=pkg.get_itinerary(),
    )


def ensure_default_packages(db: Session) -> None:
    if db.query(TourPackage).count() > 0:
        return
    for item in DEFAULT_PACKAGES:
        row = TourPackage(
            slug=item["slug"],
            title=item["title"],
            destination=item["destination"],
            valley=item["valley"],
            nights=item["nights"],
            vibe=item["vibe"],
            badge=item["badge"],
            badge_style=item["badge_style"],
            rating=item["rating"],
            starting_price=item.get("budget_hint", 0),
            budget_hint=item.get("budget_hint"),
            listing_valley=item.get("listing_valley"),
            description=item["description"],
            highlights_json=json.dumps(item["highlights"]),
            inclusions_json=json.dumps(item["inclusions"]),
            exclusions_json=json.dumps(item["exclusions"]),
            itinerary_json=json.dumps(item["itinerary"]),
            image_layout=item["image_layout"],
            image_colors_json=json.dumps(item["image_colors"]),
            featured=item.get("featured", False),
            sort_order=item.get("sort_order", 0),
            active=True,
        )
        db.add(row)
    db.commit()


def list_packages(
    db: Session,
    *,
    destination: str | None = None,
    vibe: str | None = None,
    featured_only: bool = False,
) -> list[TourPackageOut]:
    q = db.query(TourPackage).filter(TourPackage.active.is_(True))
    if destination:
        q = q.filter(TourPackage.destination.ilike(f"%{destination}%"))
    if vibe:
        q = q.filter(TourPackage.vibe == vibe)
    if featured_only:
        q = q.filter(TourPackage.featured.is_(True))
    rows = q.order_by(TourPackage.sort_order, TourPackage.title).all()
    return [package_to_out(db, r) for r in rows]


def get_package_by_slug(db: Session, slug: str) -> TourPackageDetailOut | None:
    pkg = db.query(TourPackage).filter(TourPackage.slug == slug, TourPackage.active.is_(True)).first()
    if not pkg:
        return None
    return package_to_detail(db, pkg)


def create_inquiry(db: Session, slug: str, data: PackageInquiryRequest) -> PackageInquiryResponse:
    pkg = db.query(TourPackage).filter(TourPackage.slug == slug, TourPackage.active.is_(True)).first()
    if not pkg:
        raise ValueError("Package not found")
    row = PackageInquiry(
        package_id=pkg.id,
        name=data.name.strip(),
        email=data.email.strip(),
        phone=(data.phone or "").strip(),
        message=(data.message or "").strip(),
        travel_date=data.travel_date,
        guests=data.guests,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return PackageInquiryResponse(
        id=row.id,
        message="Inquiry received. A verified operator will contact you within 24 hours.",
    )
