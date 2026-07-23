from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.models import get_db
from app.models.schemas import TourPackageOut
from app.services.tour_packages import build_featured_packages

router = APIRouter(prefix="/api/packages", tags=["packages"])


@router.get("/featured", response_model=list[TourPackageOut])
def featured_packages(db: Annotated[Session, Depends(get_db)]):
    return build_featured_packages(db)
