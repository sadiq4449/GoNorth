from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.models import get_db
from app.models.campaign_schemas import PromoCampaignOut
from app.services.campaigns import list_active_campaigns

router = APIRouter(prefix="/api/campaigns", tags=["campaigns"])


@router.get("/active", response_model=list[PromoCampaignOut])
def active_campaigns(
    db: Annotated[Session, Depends(get_db)],
    valley: str | None = Query(None),
):
    return list_active_campaigns(db, valley)
