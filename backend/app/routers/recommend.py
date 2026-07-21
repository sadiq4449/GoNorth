from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.models import get_db
from app.models.schemas import RecommendRequest, RecommendResponse
from app.services.ai import recommend_live_package

router = APIRouter(prefix="/api", tags=["recommend"])


@router.post("/recommend", response_model=RecommendResponse)
def recommend(data: RecommendRequest, db: Annotated[Session, Depends(get_db)]):
    result = recommend_live_package(db, data)
    return RecommendResponse(**result)
