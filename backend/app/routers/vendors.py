from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.auth.security import require_roles
from app.db.models import User, Vendor, get_db
from app.models.schemas import VendorOut, VendorStatusUpdate
from app.services.vendor_helpers import vendor_out

router = APIRouter(prefix="/api/vendors", tags=["vendors"])


@router.get("", response_model=list[VendorOut])
def list_vendors(
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(require_roles("admin"))],
    status: str | None = None,
):
    q = db.query(Vendor)
    if status:
        q = q.filter(Vendor.status == status)
    return [vendor_out(v) for v in q.order_by(Vendor.created_at.desc()).all()]


@router.get("/me", response_model=VendorOut)
def my_vendor(
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(require_roles("vendor"))],
):
    vendor = db.query(Vendor).filter(Vendor.user_id == user.id).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor profile not found")
    return vendor_out(vendor)


@router.patch("/{vendor_id}/status", response_model=VendorOut)
def update_vendor_status(
    vendor_id: str,
    data: VendorStatusUpdate,
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(require_roles("admin"))],
):
    if data.status not in ("pending", "approved", "suspended"):
        raise HTTPException(status_code=400, detail="Invalid status")
    vendor = db.get(Vendor, vendor_id)
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    vendor.status = data.status
    db.commit()
    db.refresh(vendor)
    return vendor_out(vendor)
