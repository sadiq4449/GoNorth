from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.models import Property, get_db
from app.models.schemas import CartLineItem, CartQuoteRequest, CartQuoteResponse
from app.services.cart import quote_cart
from app.services.catalog import get_room, get_vehicle
from app.services.terrain import requires_4x4

router = APIRouter(prefix="/api/cart", tags=["cart"])


@router.post("/quote", response_model=CartQuoteResponse)
def cart_quote(data: CartQuoteRequest, db: Annotated[Session, Depends(get_db)]):
    room = get_room(db, data.room_id)
    vehicle = get_vehicle(db, data.vehicle_id)
    if not room or not vehicle:
        raise HTTPException(status_code=404, detail="Room or vehicle not found")

    prop = db.get(Property, room.property_id)
    valley = prop.valley if prop else "Skardu"
    if requires_4x4(valley) and not vehicle.is_4x4:
        raise HTTPException(status_code=400, detail="4x4 vehicle required for this stay region")

    try:
        result = quote_cart(
            db,
            room_id=data.room_id,
            vehicle_id=data.vehicle_id,
            guide_ids=data.guide_ids,
            nights=data.nights,
            guests=data.guests,
            destination=data.destination,
            redeem_points=data.redeem_points,
            email=str(data.email) if data.email else None,
            stops=data.stops,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return CartQuoteResponse(
        line_items=[CartLineItem(**item) for item in result["line_items"]],
        subtotal=result["subtotal"],
        platform_fee=result["platform_fee"],
        platform_fee_rate=result["platform_fee_rate"],
        points_discount=result["points_discount"],
        points_redeemed=result["points_redeemed"],
        points_balance=result["points_balance"],
        points_earn_estimate=result["points_earn_estimate"],
        total=result["total"],
        nights=result["nights"],
        guests=result["guests"],
    )
