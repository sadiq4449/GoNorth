from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db.models import get_db
from app.models.safety_schemas import AdvisoryOut, SosCreateRequest, SosOut
from app.services.safety import create_sos_alert, list_advisories_merged

router = APIRouter(prefix="/api", tags=["safety"])


@router.post("/sos", response_model=SosOut)
def trigger_sos(data: SosCreateRequest, db: Annotated[Session, Depends(get_db)]):
    try:
        alert = create_sos_alert(
            db,
            lat=data.lat,
            lng=data.lng,
            phone=data.phone,
            traveler_name=data.traveler_name,
            booking_reference=data.booking_reference,
            message=data.message,
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
    return SosOut(
        id=alert.id,
        status=alert.status,
        sms_sent=alert.sms_sent,
        message=alert.message,
        created_at=alert.created_at,
    )


@router.get("/advisories", response_model=list[AdvisoryOut])
def get_advisories(
    db: Annotated[Session, Depends(get_db)],
    region: str | None = Query(None),
):
    return list_advisories_merged(db, region)
