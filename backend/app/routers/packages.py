from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db.models import get_db
from app.models.schemas import (
    PackageInquiryRequest,
    PackageInquiryResponse,
    TourPackageDetailOut,
    TourPackageOut,
)
from app.services import marketplace_packages as mp

router = APIRouter(prefix="/api/packages", tags=["packages"])


@router.get("/featured", response_model=list[TourPackageOut])
def featured_packages(db: Annotated[Session, Depends(get_db)]):
    return mp.list_packages(db, featured_only=True)


@router.get("", response_model=list[TourPackageOut])
def list_all_packages(
    db: Annotated[Session, Depends(get_db)],
    destination: str | None = Query(None),
    vibe: str | None = Query(None),
    featured: bool = Query(False),
):
    return mp.list_packages(db, destination=destination, vibe=vibe, featured_only=featured)


@router.get("/{slug}", response_model=TourPackageDetailOut)
def package_detail(slug: str, db: Annotated[Session, Depends(get_db)]):
    pkg = mp.get_package_by_slug(db, slug)
    if not pkg:
        raise HTTPException(status_code=404, detail="Package not found")
    return pkg


@router.post("/{slug}/inquiry", response_model=PackageInquiryResponse)
def package_inquiry(
    slug: str,
    data: PackageInquiryRequest,
    db: Annotated[Session, Depends(get_db)],
):
    try:
        return mp.create_inquiry(db, slug, data)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
