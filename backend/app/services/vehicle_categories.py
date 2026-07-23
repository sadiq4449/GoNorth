"""Vehicle category taxonomy for Gilgit-Baltistan transport marketplace."""

from __future__ import annotations

CATEGORY_META: dict[str, dict] = {
    "suv_4x4": {
        "label": "4x4 SUV",
        "description": "Prado, Land Cruiser, Surf — high clearance for Deosai & mountain tracks",
        "default_seats": 5,
        "sort": 1,
    },
    "pickup": {
        "label": "Pickup",
        "description": "Hilux and double-cab pickups for gear-heavy groups",
        "default_seats": 4,
        "sort": 2,
    },
    "suv": {
        "label": "SUV",
        "description": "TZ, 5-Door, and city SUVs for valley roads",
        "default_seats": 5,
        "sort": 3,
    },
    "van": {
        "label": "Van / Hiace",
        "description": "Hiace and passenger vans for families & small groups",
        "default_seats": 10,
        "sort": 4,
    },
    "coaster": {
        "label": "Coaster / Bus",
        "description": "Coaster and mini-bus for large groups and tours",
        "default_seats": 25,
        "sort": 5,
    },
    "sedan": {
        "label": "Sedan",
        "description": "Corolla, Civic, and compact cars for city & paved routes",
        "default_seats": 4,
        "sort": 6,
    },
}


def infer_vehicle_category(model: str, is_4x4: bool = False) -> str:
    m = model.lower()
    if any(k in m for k in ("coaster", "mini bus", "minibus", "bus")):
        return "coaster"
    if any(k in m for k in ("hiace", "grand cabin", "van")):
        return "van"
    if any(k in m for k in ("corolla", "civic", "city", "alto", "cultus", "sedan", "gli")):
        return "sedan"
    if any(k in m for k in ("hilux", "pickup", "double cab")):
        return "pickup"
    if any(
        k in m
        for k in (
            "prado",
            "land cruiser",
            "cruiser",
            "surf",
            "4x4",
            "tx",
            "tz",
            "fortuner",
            "pajero",
        )
    ):
        return "suv_4x4"
    if any(k in m for k in ("5-door", "5 door", "suv")):
        return "suv"
    if is_4x4:
        return "suv_4x4"
    return "sedan"


def default_seats(category: str) -> int:
    return CATEGORY_META.get(category, CATEGORY_META["sedan"])["default_seats"]


def category_label(category: str) -> str:
    return CATEGORY_META.get(category, CATEGORY_META["sedan"])["label"]


def backfill_vehicle_categories(db) -> None:
    from app.db.models import Vehicle

    changed = False
    for v in db.query(Vehicle).all():
        cat = infer_vehicle_category(v.model, v.is_4x4)
        if v.vehicle_category != cat:
            v.vehicle_category = cat
            changed = True
        seats = default_seats(cat)
        if not v.seats or v.seats < 2:
            v.seats = seats
            changed = True
    if changed:
        db.commit()
