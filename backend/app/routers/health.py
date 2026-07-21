from fastapi import APIRouter

from app.config import settings
from app.models.schemas import HealthResponse

router = APIRouter(tags=["health"])

API_VERSION = "1.0.0"


@router.get("/health", response_model=HealthResponse)
def health_check():
    key = settings.nvidia_api_key
    ai_ok = bool(key and key != "nvapi-your-key-here")
    return HealthResponse(status="ok", service="baltitour-api", version=API_VERSION, ai_configured=ai_ok)
