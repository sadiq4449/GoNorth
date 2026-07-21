import logging

import requests

from app.config import settings

logger = logging.getLogger("baltitour.sms")


def send_sms(to: str, body: str) -> dict:
    """Dispatch SMS via configured gateway or sandbox log."""
    payload = {"to": to, "body": body}
    if settings.sms_api_url and settings.sms_api_key:
        try:
            res = requests.post(
                settings.sms_api_url,
                json=payload,
                headers={"Authorization": f"Bearer {settings.sms_api_key}"},
                timeout=10,
            )
            res.raise_for_status()
            return {"ok": True, "provider": "gateway", "detail": res.text[:200]}
        except Exception as exc:
            logger.error("SMS gateway failed: %s", exc)
            return {"ok": False, "provider": "gateway", "detail": str(exc)}

    logger.info("SMS sandbox → %s: %s", to, body)
    return {"ok": True, "provider": "sandbox", "detail": "Logged locally (configure SMS_API_URL for production)"}


def format_sos_message(*, lat: float, lng: float, traveler_name: str, phone: str, reference: str | None) -> str:
    ref = reference or "WALK-IN"
    return (
        f"BALTOUR SOS [{ref}] {traveler_name} ({phone}) "
        f"GPS {lat:.5f},{lng:.5f}. Immediate assistance required."
    )
