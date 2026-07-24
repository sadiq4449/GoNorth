"""Persisted platform runtime settings (admin-configurable flags)."""

from sqlalchemy.orm import Session

from app.config import settings
from app.db.models import PlatformConfig


def _apply_to_runtime(row: PlatformConfig) -> None:
    settings.advisory_live_weather = row.advisory_live_weather
    settings.advisory_ndma_sync = row.advisory_ndma_sync
    settings.advisory_seasonal_rules = row.advisory_seasonal_rules
    settings.allow_direct_booking = row.allow_direct_booking
    settings.usd_pkr_rate = row.usd_pkr_rate


def ensure_platform_config(db: Session) -> PlatformConfig:
    row = db.get(PlatformConfig, "default")
    if row:
        return row
    row = PlatformConfig(
        id="default",
        advisory_live_weather=settings.advisory_live_weather,
        advisory_ndma_sync=settings.advisory_ndma_sync,
        advisory_seasonal_rules=settings.advisory_seasonal_rules,
        allow_direct_booking=settings.allow_direct_booking,
        usd_pkr_rate=settings.usd_pkr_rate,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


def load_platform_config(db: Session) -> PlatformConfig:
    row = ensure_platform_config(db)
    _apply_to_runtime(row)
    return row


def update_platform_config(db: Session, changes: dict) -> PlatformConfig:
    row = ensure_platform_config(db)
    for field, val in changes.items():
        setattr(row, field, val)
    db.commit()
    db.refresh(row)
    _apply_to_runtime(row)
    return row
