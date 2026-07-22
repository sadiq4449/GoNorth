from app.config import settings

try:
    from supabase import create_client
except ImportError:
    create_client = None

_client = None


def get_supabase_admin():
    """Service-role client for server-side storage/admin tasks."""
    global _client
    if not settings.supabase_url or not settings.supabase_service_key or not create_client:
        return None
    if _client is None:
        _client = create_client(settings.supabase_url, settings.supabase_service_key)
    return _client
