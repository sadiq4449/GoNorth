from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db.models import get_db
from app.models.schemas import (
    CartQuoteRequest,
    CartQuoteResponse,
    CartLineItem,
    RecommendRequest,
    RecommendResponse,
    SearchResponse,
    RoomSearchOut,
    VehicleSearchOut,
    GuideSearchOut,
)
from app.services.ai import recommend_live_package
from app.services.cart import quote_cart
from app.services.catalog import load_approved_listings
from app.services.terrain import requires_4x4, vehicle_compatible

router = APIRouter(prefix="/api", tags=["search"])


def _estimate_within_budget(price_per_night_or_day: int, nights: int, budget: int | None, min_other: int) -> bool:
    if not budget:
        return False
    subtotal = price_per_night_or_day * nights + min_other
    return subtotal + round(subtotal * 0.10) <= budget


@router.get("/search", response_model=SearchResponse)
def search_trip(
    db: Annotated[Session, Depends(get_db)],
    destination: str = Query("Skardu"),
    stops: str | None = Query(None, description="Comma-separated extra stops e.g. Shigar,Hunza"),
    checkin: str | None = None,
    checkout: str | None = None,
    nights: int = Query(5, ge=1, le=30),
    guests: int = Query(2, ge=1, le=20),
    budget: int | None = Query(None, ge=5000),
    vibe: str | None = Query(None),
    solo_safe: bool = Query(False),
    women_friendly: bool = Query(False),
    featured_only: bool = Query(False),
):
    stop_list = [s.strip() for s in (stops or "").split(",") if s.strip()]
    all_stops = [destination] + stop_list
    rooms, vehicles, guides = load_approved_listings(
        db,
        valley=destination,
        check_in=checkin,
        nights=nights,
        solo_safe=solo_safe or None,
        women_friendly=women_friendly or None,
        featured_only=featured_only or None,
    )
    needs_4x4 = requires_4x4(destination)

    ai_room_id = ai_vehicle_id = None
    ai_guide_ids: list[str] = []
    ai_package = None

    if budget and vibe:
        try:
            rec = recommend_live_package(
                db,
                RecommendRequest(destination=destination, nights=nights, budget=budget, vibe=vibe),
            )
            ai_room_id = rec["room_id"]
            ai_vehicle_id = rec["vehicle_id"]
            ai_guide_ids = rec.get("guide_ids", [])
            ai_package = RecommendResponse(**rec)
        except HTTPException:
            pass

    min_room = min((r.price_per_night for r in rooms), default=0)
    min_vehicle = min((v.daily_rate for v in vehicles if vehicle_compatible(destination, v.is_4x4)), default=0)

    room_results = [
        RoomSearchOut(
            **r.model_dump(),
            ai_recommended=r.id == ai_room_id,
            within_budget=_estimate_within_budget(r.price_per_night, nights, budget, min_vehicle * nights),
        )
        for r in rooms
        if r.capacity >= guests
    ]

    vehicle_results = [
        VehicleSearchOut(
            **v.model_dump(),
            terrain_compatible=vehicle_compatible(destination, v.is_4x4),
            ai_recommended=v.id == ai_vehicle_id,
            within_budget=_estimate_within_budget(v.daily_rate, nights, budget, min_room * nights),
        )
        for v in vehicles
    ]

    guide_results = [
        GuideSearchOut(**g.model_dump(), ai_recommended=g.id in ai_guide_ids)
        for g in guides
    ]

    return SearchResponse(
        destination=destination,
        stops=stop_list,
        nights=nights,
        guests=guests,
        budget=budget,
        vibe=vibe,
        requires_4x4=needs_4x4,
        ai_package=ai_package,
        rooms=room_results,
        vehicles=vehicle_results,
        guides=guide_results,
    )
