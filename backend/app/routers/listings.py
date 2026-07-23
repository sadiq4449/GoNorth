from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.models import get_db
from app.models.schemas import GuideOut, ListingsResponse, RoomOut, VehicleOut
from app.services.catalog import load_approved_listings

router = APIRouter(prefix="/api", tags=["listings"])


@router.get("/listings", response_model=ListingsResponse)
def get_listings(db: Annotated[Session, Depends(get_db)], valley: str | None = None):
    rooms, vehicles, guides, experiences = load_approved_listings(db, valley)
    return ListingsResponse(rooms=rooms, vehicles=vehicles, guides=guides, experiences=experiences)


@router.get("/rooms", response_model=list[RoomOut])
def list_rooms(db: Annotated[Session, Depends(get_db)], valley: str | None = None):
    rooms, _, _, _ = load_approved_listings(db, valley)
    return rooms


@router.get("/vehicles", response_model=list[VehicleOut])
def list_vehicles(db: Annotated[Session, Depends(get_db)], valley: str | None = None):
    _, vehicles, _, _ = load_approved_listings(db, valley)
    return vehicles


@router.get("/guides", response_model=list[GuideOut])
def list_guides(db: Annotated[Session, Depends(get_db)], valley: str | None = None):
    _, _, guides, _ = load_approved_listings(db, valley)
    return guides
