from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    nvidia_api_key: str = ""
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"
    database_url: str = "sqlite:///./baltitour.db"
    jwt_secret: str = "change-me-in-production-baltitour-dev-secret"
    jwt_expire_minutes: int = 60 * 24 * 7  # 7 days

    # Supabase (optional — use schema.sql when migrating to production)
    supabase_url: str = ""
    supabase_service_key: str = ""
    supabase_jwt_secret: str = ""

    # SMS gateway (Twilio or local PK provider — mock when empty)
    sms_api_url: str = ""
    sms_api_key: str = ""
    sos_dispatch_number: str = "+9241122"

    # Payments — sandbox/mock when keys empty
    jazzcash_merchant_id: str = ""
    jazzcash_password: str = ""
    jazzcash_integrity_salt: str = ""
    easypaisa_store_id: str = ""
    easypaisa_hash_key: str = ""
    stripe_secret_key: str = ""
    stripe_webhook_secret: str = ""
    usd_pkr_rate: float = 280.0
    public_api_url: str = "http://localhost:8000"
    public_web_url: str = "http://localhost:5173"
    allow_direct_booking: bool = True

    # Observability
    sentry_dsn: str = ""

    class Config:
        env_file = ".env"
        extra = "ignore"

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()
