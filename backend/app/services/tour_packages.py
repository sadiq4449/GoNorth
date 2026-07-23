"""Curated Gilgit-Baltistan tour packages with live pricing."""

from sqlalchemy.orm import Session

from app.models.schemas import RecommendRequest, TourPackageOut
from app.services.catalog import load_approved_listings
from app.services.cart import quote_cart
from app.services.recommend_rules import _pick_by_vibe
from app.services.terrain import requires_4x4

TOUR_PRESETS = [
    {
        "id": "skardu-explorer",
        "title": "Skardu Valley Explorer",
        "destination": "Skardu",
        "nights": 5,
        "budget": 65000,
        "vibe": "backpacker",
        "badge": "TRENDING",
        "badge_style": "trending",
        "rating": 4.9,
        "image_layout": "single",
        "image_colors": ["#1e4976", "#3d8fd1"],
    },
    {
        "id": "hunza-luxury",
        "title": "Hunza Cherry Blossom",
        "destination": "Hunza",
        "nights": 6,
        "budget": 120000,
        "vibe": "luxury",
        "badge": "POPULAR",
        "badge_style": "popular",
        "rating": 5.0,
        "image_layout": "single",
        "image_colors": ["#0d5c4a", "#3cb89a"],
    },
    {
        "id": "deosai-adventure",
        "title": "Deosai Plateau Adventure",
        "destination": "Deosai",
        "listing_valley": "Skardu",
        "nights": 4,
        "budget": 90000,
        "vibe": "adventure",
        "badge": "NEW",
        "badge_style": "new",
        "rating": 4.8,
        "image_layout": "split",
        "image_colors": ["#4a3728", "#8b6914", "#c4a035"],
    },
    {
        "id": "khaplu-heritage",
        "title": "Khaplu Heritage Trail",
        "destination": "Khaplu",
        "listing_valley": "Skardu",
        "nights": 5,
        "budget": 75000,
        "vibe": "backpacker",
        "badge": "POPULAR",
        "badge_style": "popular",
        "rating": 4.9,
        "image_layout": "collage",
        "image_colors": ["#5c3d2e", "#a67c52", "#d4a574", "#8b5a3c"],
    },
]


def _duration_label(nights: int) -> str:
    return f"{nights + 1}D/{nights}N"


def _build_preset_package(db: Session, preset: dict) -> TourPackageOut | None:
    listing_valley = preset.get("listing_valley", preset["destination"])
    data = RecommendRequest(
        destination=preset["destination"],
        nights=preset["nights"],
        budget=preset["budget"],
        vibe=preset["vibe"],
    )
    rooms, vehicles, guides = load_approved_listings(db, valley=listing_valley)
    if not rooms or not vehicles:
        return None

    room, vehicle, guide_ids = _pick_by_vibe(
        rooms, vehicles, guides, data.vibe, data.budget, data.nights, data.destination
    )
    quote = quote_cart(
        db,
        room_id=room.id,
        vehicle_id=vehicle.id,
        guide_ids=guide_ids,
        nights=data.nights,
    )
    reason = f"Curated {preset['vibe']} package for {data.destination}."
    if requires_4x4(data.destination):
        reason = f"4x4 terrain package for {data.destination}. {reason}"

    return TourPackageOut(
        id=preset["id"],
        title=preset["title"],
        destination=preset["destination"],
        nights=preset["nights"],
        duration_label=_duration_label(preset["nights"]),
        vibe=preset["vibe"],
        badge=preset["badge"],
        badge_style=preset["badge_style"],
        rating=preset["rating"],
        image_layout=preset["image_layout"],
        image_colors=preset["image_colors"],
        starting_price=quote["total"],
        room_id=room.id,
        vehicle_id=vehicle.id,
        guide_ids=guide_ids,
        reason=reason,
        quote=quote,
    )


def build_featured_packages(db: Session) -> list[TourPackageOut]:
    packages: list[TourPackageOut] = []
    for preset in TOUR_PRESETS:
        pkg = _build_preset_package(db, preset)
        if pkg:
            packages.append(pkg)
    return packages
