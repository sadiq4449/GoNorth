from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    openrouter_api_key: str = ""
    openrouter_model: str = "openai/gpt-4o-mini"
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"
    database_url: str = "sqlite:///./baltitour.db"
    jwt_secret: str = "change-me-in-production-baltitour-dev-secret"
    jwt_expire_minutes: int = 60 * 24 * 7  # 7 days

    # Supabase (production Postgres + optional client auth)
    supabase_url: str = ""
    supabase_service_key: str = ""
    supabase_jwt_secret: str = ""
    supabase_db_password: str = ""

    @property
    def resolved_database_url(self) -> str:
        if self.database_url and not self.database_url.startswith("sqlite"):
            return self.database_url
        if self.supabase_url and self.supabase_db_password:
            ref = self.supabase_url.rstrip("/").split("//")[-1].split(".")[0]
            return (
                f"postgresql+psycopg2://postgres:{self.supabase_db_password}"
                f"@db.{ref}.supabase.co:5432/postgres"
            )
        return self.database_url

    @property
    def using_supabase_db(self) -> bool:
        return self.resolved_database_url.startswith("postgresql")

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

    # Live travel advisories (Open-Meteo weather — no API key required)
    advisory_live_weather: bool = True

    # Observability
    sentry_dsn: str = ""

    class Config:
        env_file = ".env"
        extra = "ignore"

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def ai_configured(self) -> bool:
        key = self.openrouter_api_key.strip()
        return bool(key and key not in {"sk-or-your-key-here", "your-openrouter-key-here"})


settings = Settings()
