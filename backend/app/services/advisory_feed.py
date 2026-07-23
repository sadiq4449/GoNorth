"""Live advisory feed — merges admin/DB advisories with automated weather alerts."""

from __future__ import annotations

import logging
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Any

import requests

from app.config import settings
from app.db.models import RoadAdvisory

logger = logging.getLogger(__name__)

# Gilgit-Baltistan destinations covered by the platform
GB_REGIONS: list[dict[str, Any]] = [
    {"region": "Skardu", "lat": 35.297, "lon": 75.633},
    {"region": "Hunza", "lat": 36.316, "lon": 74.650},
    {"region": "Gilgit", "lat": 35.921, "lon": 74.308},
    {"region": "Deosai", "lat": 35.020, "lon": 75.450},
    {"region": "Chilas", "lat": 35.420, "lon": 74.100},
    {"region": "Khunjerab", "lat": 36.850, "lon": 75.420},
]

# WMO weather codes — https://open-meteo.com/en/docs
_THUNDERSTORM_CODES = {95, 96, 99}
_HEAVY_RAIN_CODES = {65, 66, 67, 82}
_SNOW_CODES = {71, 73, 75, 77, 85, 86}

_CACHE: dict[str, Any] = {"fetched_at": None, "items": []}
_CACHE_TTL = timedelta(minutes=10)


@dataclass
class LiveAdvisory:
    id: str
    region: str
    message: str
    severity: str
    source: str
    category: str
    admin_override: bool
    updated_at: datetime
    live: bool = True


def _weather_severity(code: int, precip_mm: float, wind_kmh: float, temp_min: float) -> tuple[str, str]:
    """Return (severity, detail_suffix) from today's forecast signals."""
    if code in _THUNDERSTORM_CODES:
        return "critical", "Thunderstorm alert — avoid exposed routes and high passes"
    if code in _HEAVY_RAIN_CODES or precip_mm >= 15:
        return "warning", f"Heavy rain expected ({precip_mm:.0f} mm) — landslide risk on mountain roads"
    if code in _SNOW_CODES or (precip_mm >= 5 and temp_min <= 2):
        return "warning", "Snow or sleet likely — carry chains; Babusar/Khunjerab may close"
    if wind_kmh >= 60:
        return "warning", f"High winds ({wind_kmh:.0f} km/h) — caution on bridges and exposed passes"
    if precip_mm >= 5:
        return "warning", f"Rain forecast ({precip_mm:.0f} mm) — check KKH and Jaglot–Skardu Rd before travel"
    if temp_min <= -5:
        return "info", f"Freezing conditions ({temp_min:.0f}°C) — black ice possible on early-morning roads"
    return "info", ""


def _weather_label(code: int) -> str:
    labels = {
        0: "Clear",
        1: "Mainly clear",
        2: "Partly cloudy",
        3: "Overcast",
        45: "Fog",
        48: "Rime fog",
        51: "Light drizzle",
        61: "Rain",
        63: "Moderate rain",
        71: "Snow",
        80: "Rain showers",
        95: "Thunderstorm",
    }
    return labels.get(code, "Mixed conditions")


def _fetch_open_meteo() -> list[LiveAdvisory]:
    if not settings.advisory_live_weather:
        return []

    lats = ",".join(str(r["lat"]) for r in GB_REGIONS)
    lons = ",".join(str(r["lon"]) for r in GB_REGIONS)
    url = (
        "https://api.open-meteo.com/v1/forecast"
        f"?latitude={lats}&longitude={lons}"
        "&daily=weather_code,precipitation_sum,wind_speed_10m_max,temperature_2m_max,temperature_2m_min"
        "&forecast_days=1&timezone=Asia%2FKarachi"
    )
    try:
        res = requests.get(url, timeout=12)
        res.raise_for_status()
        payload = res.json()
    except Exception as exc:
        logger.warning("Open-Meteo weather fetch failed: %s", exc)
        return []

    rows = payload if isinstance(payload, list) else [payload]
    now = datetime.now(timezone.utc)
    advisories: list[LiveAdvisory] = []

    for idx, region in enumerate(GB_REGIONS):
        if idx >= len(rows):
            break
        daily = rows[idx].get("daily") or {}
        codes = daily.get("weather_code") or []
        precips = daily.get("precipitation_sum") or []
        winds = daily.get("wind_speed_10m_max") or []
        temp_mins = daily.get("temperature_2m_min") or []
        temp_maxs = daily.get("temperature_2m_max") or []
        if not codes:
            continue

        code = int(codes[0])
        precip = float(precips[0] if precips else 0)
        wind = float(winds[0] if winds else 0)
        t_min = float(temp_mins[0] if temp_mins else 0)
        t_max = float(temp_maxs[0] if temp_maxs else 0)
        severity, detail = _weather_severity(code, precip, wind, t_min)
        label = _weather_label(code)

        if detail:
            message = detail
        else:
            message = f"{label} · {t_min:.0f}–{t_max:.0f}°C · winds to {wind:.0f} km/h"

        advisories.append(
            LiveAdvisory(
                id=f"weather-{region['region'].lower()}",
                region=region["region"],
                message=message,
                severity=severity,
                source="Open-Meteo / national models",
                category="weather",
                admin_override=False,
                updated_at=now,
            )
        )

    return advisories


def get_live_weather_advisories() -> list[LiveAdvisory]:
    now = datetime.now(timezone.utc)
    fetched_at = _CACHE.get("fetched_at")
    if fetched_at and now - fetched_at < _CACHE_TTL:
        return list(_CACHE.get("items") or [])

    items = _fetch_open_meteo()
    _CACHE["fetched_at"] = now
    _CACHE["items"] = items
    return list(items)


def _db_to_dict(row: RoadAdvisory) -> dict[str, Any]:
    return {
        "id": row.id,
        "region": row.region,
        "message": row.message,
        "severity": row.severity,
        "source": "Admin" if row.admin_override else "BaltiTour",
        "category": "road",
        "admin_override": row.admin_override,
        "updated_at": row.updated_at,
        "live": False,
    }


def _live_to_dict(item: LiveAdvisory) -> dict[str, Any]:
    return {
        "id": item.id,
        "region": item.region,
        "message": item.message,
        "severity": item.severity,
        "source": item.source,
        "category": item.category,
        "admin_override": item.admin_override,
        "updated_at": item.updated_at,
        "live": item.live,
    }


def _severity_rank(severity: str) -> int:
    return {"critical": 3, "warning": 2, "info": 1}.get(severity, 0)


def _as_utc(dt: datetime) -> datetime:
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def merge_advisories(
    db_rows: list[RoadAdvisory],
    *,
    region: str | None = None,
    include_live: bool = True,
) -> list[dict[str, Any]]:
    """Merge DB advisories with live weather; admin overrides win per region."""
    overridden_regions = {r.region.lower() for r in db_rows if r.admin_override}

    live_items: list[dict[str, Any]] = []
    if include_live and settings.advisory_live_weather:
        for item in get_live_weather_advisories():
            if item.region.lower() in overridden_regions:
                continue
            live_items.append(_live_to_dict(item))

    live_regions = {a["region"].lower() for a in live_items}
    db_items: list[dict[str, Any]] = []
    for row in db_rows:
        key = row.region.lower()
        if row.admin_override or key not in live_regions:
            db_items.append(_db_to_dict(row))

    merged = db_items + live_items

    if region:
        needle = region.lower()
        merged = [a for a in merged if needle in a["region"].lower()]

    merged.sort(
        key=lambda a: (_severity_rank(a["severity"]), _as_utc(a["updated_at"])),
        reverse=True,
    )
    return merged
