"""Unified AI recommendation with professional fallback metadata."""

import json
import re

import requests
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.config import settings
from app.models.schemas import RecommendRequest
from app.services.catalog import load_approved_listings
from app.services.cart import quote_cart
from app.services.recommend_rules import _pick_by_vibe
from app.services.terrain import requires_4x4, vehicle_compatible

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

FALLBACK_MESSAGES = {
    "unconfigured": (
        "Smart matching selected the best verified stay and transport for your trip. "
        "You can adjust any selection below."
    ),
    "outage": (
        "AI recommendations are temporarily unavailable. "
        "We built your package using our verified inventory rules — review and customize below."
    ),
    "budget": (
        "We adjusted your package to fit your budget using smart matching. "
        "Swap any stay or vehicle below if you prefer."
    ),
    "parse_error": (
        "AI could not finalize a package this time. "
        "We matched you using verified inventory rules instead."
    ),
}


def _attach_fallback(result: dict, cause: str) -> dict:
    result["source"] = "fallback"
    result["ai_available"] = False
    result["fallback_cause"] = cause
    result["user_message"] = FALLBACK_MESSAGES.get(cause, FALLBACK_MESSAGES["outage"])
    return result


def _attach_ai_success(result: dict) -> dict:
    result["source"] = "ai"
    result["ai_available"] = True
    result["fallback_cause"] = None
    result["user_message"] = None
    return result


def _rules_recommend_live(
    db: Session,
    data: RecommendRequest,
    rooms,
    vehicles,
    guides,
    *,
    cause: str = "unconfigured",
):
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
    reason = f"Smart match for {data.vibe} vibe within PKR {data.budget:,} budget."
    if requires_4x4(data.destination):
        reason = f"4x4 terrain package for {data.destination}. {reason}"
    result = {
        "room_id": room.id,
        "vehicle_id": vehicle.id,
        "guide_ids": guide_ids,
        "reason": reason,
        "quote": quote,
    }
    return _attach_fallback(result, cause)


def _build_ai_prompt(data: RecommendRequest, rooms, vehicles, guides) -> str:
    room_lines = "\n".join(
        f"- '{r.id}': {r.property_name} / {r.name} (PKR {r.price_per_night}/night, cap {r.capacity}, {r.valley})"
        for r in rooms[:12]
    )
    vehicle_lines = "\n".join(
        f"- '{v.id}': {v.model} driver {v.driver_name} (PKR {v.daily_rate}/day, 4x4={v.is_4x4}, {v.valley})"
        for v in vehicles[:12]
    )
    guide_lines = "\n".join(
        f"- '{g.id}': {g.name} — {g.specialty} (PKR {g.daily_rate}/day)"
        for g in guides[:8]
    ) or "- (none)"

    terrain_note = "4x4 vehicle REQUIRED." if requires_4x4(data.destination) else "Highway vehicles OK."

    return f"""Pick the best Gilgit-Baltistan trip package.

Destination: {data.destination}
Nights: {data.nights}
Max budget (PKR, incl. 10% platform fee): {data.budget}
Vibe: {data.vibe}
Terrain: {terrain_note}

Rooms:
{room_lines}

Vehicles:
{vehicle_lines}

Guides (optional, use [] if none):
{guide_lines}

Respond ONLY with JSON (no markdown):
{{"room_id": "uuid", "vehicle_id": "uuid", "guide_ids": ["uuid"], "reason": "1 sentence"}}"""


def _parse_ai_json(content: str, valid_room_ids: set, valid_vehicle_ids: set, valid_guide_ids: set) -> dict:
    clean = re.sub(r"```json|```", "", content).strip()
    parsed = json.loads(clean)
    if parsed.get("room_id") not in valid_room_ids:
        raise ValueError("Invalid room_id from AI")
    if parsed.get("vehicle_id") not in valid_vehicle_ids:
        raise ValueError("Invalid vehicle_id from AI")
    guide_ids = [g for g in parsed.get("guide_ids", []) if g in valid_guide_ids]
    return {
        "room_id": parsed["room_id"],
        "vehicle_id": parsed["vehicle_id"],
        "guide_ids": guide_ids,
        "reason": parsed.get("reason", "AI recommended package"),
    }


def _openrouter_headers() -> dict:
    headers = {
        "Authorization": f"Bearer {settings.openrouter_api_key}",
        "Content-Type": "application/json",
    }
    if settings.public_web_url:
        headers["HTTP-Referer"] = settings.public_web_url
    headers["X-Title"] = "GoNorth Trip Builder"
    return headers


def recommend_live_package(db: Session, data: RecommendRequest) -> dict:
    rooms, vehicles, guides = load_approved_listings(db, valley=data.destination)
    if not rooms or not vehicles:
        raise HTTPException(status_code=404, detail="No approved listings for this destination")

    valid_rooms = {r.id for r in rooms}
    valid_vehicles = {v.id for v in vehicles if vehicle_compatible(data.destination, v.is_4x4)}
    if requires_4x4(data.destination) and not valid_vehicles:
        raise HTTPException(status_code=400, detail="No 4x4 vehicles available for this terrain")
    if not valid_vehicles:
        valid_vehicles = {v.id for v in vehicles}
    valid_guides = {g.id for g in guides}

    if not settings.ai_configured:
        return _rules_recommend_live(db, data, rooms, vehicles, guides, cause="unconfigured")

    payload = {
        "model": settings.openrouter_model,
        "messages": [{"role": "user", "content": _build_ai_prompt(data, rooms, vehicles, guides)}],
        "max_tokens": 1024,
        "temperature": 0.1,
    }

    try:
        response = requests.post(
            OPENROUTER_URL,
            headers=_openrouter_headers(),
            json=payload,
            timeout=45,
        )
        if response.status_code != 200:
            return _rules_recommend_live(db, data, rooms, vehicles, guides, cause="outage")

        ai_response = response.json()["choices"][0]["message"]["content"]
        parsed = _parse_ai_json(ai_response, valid_rooms, valid_vehicles, valid_guides)
        quote = quote_cart(
            db,
            room_id=parsed["room_id"],
            vehicle_id=parsed["vehicle_id"],
            guide_ids=parsed["guide_ids"],
            nights=data.nights,
        )
        if quote["total"] > data.budget:
            return _rules_recommend_live(db, data, rooms, vehicles, guides, cause="budget")

        return _attach_ai_success({**parsed, "quote": quote})
    except HTTPException:
        raise
    except Exception:
        return _rules_recommend_live(db, data, rooms, vehicles, guides, cause="parse_error")
