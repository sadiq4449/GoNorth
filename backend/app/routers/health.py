from fastapi import APIRouter

from app.config import settings
from app.models.schemas import HealthResponse

router = APIRouter(tags=["health"])

API_VERSION = "1.0.0"


@router.get("/health", response_model=HealthResponse)
def health_check():
    return HealthResponse(
        status="ok",
        service="gonorth-api",
        version=API_VERSION,
        ai_configured=settings.ai_configured,
    )
