import hashlib
import hmac
import json
from datetime import datetime, timezone

from app.config import settings


def jazzcash_checkout_url(session_id: str) -> str:
    return f"{settings.public_web_url.rstrip('/')}/pay/{session_id}?gateway=jazzcash"


def easypaisa_checkout_url(session_id: str) -> str:
    return f"{settings.public_web_url.rstrip('/')}/pay/{session_id}?gateway=easypaisa"


def jazzcash_webhook_signature(payload: dict) -> str:
    """Sandbox HMAC — production uses JazzCash pp_SecureHash rules."""
    secret = settings.jazzcash_integrity_salt or settings.jazzcash_password or "sandbox"
    raw = json.dumps(payload, sort_keys=True, separators=(",", ":"))
    return hmac.new(secret.encode(), raw.encode(), hashlib.sha256).hexdigest()


def verify_jazzcash_webhook(payload: dict, signature: str | None) -> bool:
    if not settings.jazzcash_merchant_id:
        return True  # sandbox mode accepts unsigned
    expected = jazzcash_webhook_signature(payload)
    return hmac.compare_digest(expected, signature or "")


def verify_easypaisa_webhook(payload: dict, signature: str | None) -> bool:
    if not settings.easypaisa_store_id:
        return True
    secret = settings.easypaisa_hash_key or "sandbox"
    raw = json.dumps(payload, sort_keys=True, separators=(",", ":"))
    expected = hmac.new(secret.encode(), raw.encode(), hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, signature or "")


def mock_disbursement_ref(vendor_id: str, method: str) -> str:
    stamp = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
    return f"{method.upper()}-{vendor_id[:8]}-{stamp}"
