"""Live advisory feed — merges admin/DB advisories with automated data sources."""

from __future__ import annotations

import hashlib
import html
import logging
import re
from dataclasses import dataclass
from datetime import date, datetime, timedelta, timezone
from typing import Any

import requests

from app.config import settings
from app.db.models import RoadAdvisory

logger = logging.getLogger(__name__)
PK_TZ = timezone(timedelta(hours=5))
NDMA_URL = "https://ndma.gov.pk/public/advisories"
NDMA_BASE = "https://www.ndma.gov.pk"
REQUEST_HEADERS = {"User-Agent": "BaltiTour-AdvisoryBot/1.0 (+https://gonorth.pk)"}

GB_REGIONS: list[dict[str, Any]] = [
    {"region": "Skardu", "lat": 35.297, "lon": 75.633},
    {"region": "Hunza", "lat": 36.316, "lon": 74.650},
    {"region": "Gilgit", "lat": 35.921, "lon": 74.308},
    {"region": "Deosai", "lat": 35.020, "lon": 75.450},
    {"region": "Chilas", "lat": 35.420, "lon": 74.100},
    {"region": "Khunjerab", "lat": 36.850, "lon": 75.420},
]

# Typical seasonal closures — confirm with NHA before travel
SEASONAL_PASSES: list[dict[str, Any]] = [
    {
        "region": "Babusar",
        "closed_start": (10, 15),
        "closed_end": (6, 15),
        "message": "Babusar Pass closed for winter (approx. mid-Oct to mid-Jun) — use KKH via Chilas",
    },
    {
        "region": "Khunjerab",
        "closed_start": (11, 1),
        "closed_end": (5, 1),
        "message": "Khunjerab Pass closed for winter (approx. Nov–May) — border route unavailable",
    },
    {
        "region": "Deosai",
        "closed_start": (11, 1),
        "closed_end": (6, 30),
        "message": "Deosai National Park closed for winter (approx. Nov–Jun) — no vehicle access",
    },
]

GB_NDMA_KEYWORDS = re.compile(
    r"gilgit|baltistan|\bgb\b|northern areas|glof|hunza|skardu|khunjerab|"
    r"deosai|kkh|karakoram|chilas|babusar|ajk.*gb|gb.*ajk|kp.*gb|gb.*kp",
    re.I,
)

_THUNDERSTORM_CODES = {95, 96, 99}
_HEAVY_RAIN_CODES = {65, 66, 67, 82}
_SNOW_CODES = {71, 73, 75, 77, 85, 86}

_CACHE: dict[str, dict[str, Any]] = {
    "weather": {"fetched_at": None, "items": []},
    "ndma": {"fetched_at": None, "items": []},
}
_WEATHER_TTL = timedelta(minutes=10)
_NDMA_TTL = timedelta(minutes=45)


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
    external_url: str | None = None
    verified: bool = False


def _today_pk() -> date:
    return datetime.now(PK_TZ).date()


def _is_in_closed_season(today: date, start: tuple[int, int], end: tuple[int, int]) -> bool:
    cur = (today.month, today.day)
    if start > end:
        return cur >= start or cur <= end
    return start <= cur <= end


def _weather_severity(code: int, precip_mm: float, wind_kmh: float, temp_min: float) -> tuple[str, str]:
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
        res = requests.get(url, timeout=12, headers=REQUEST_HEADERS)
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
        message = detail or f"{label} · {t_min:.0f}–{t_max:.0f}°C · winds to {wind:.0f} km/h"

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
                external_url="https://open-meteo.com/",
            )
        )

    return advisories


def _cached_fetch(cache_key: str, ttl: timedelta, fetcher) -> list[LiveAdvisory]:
    now = datetime.now(timezone.utc)
    bucket = _CACHE[cache_key]
    fetched_at = bucket.get("fetched_at")
    if fetched_at and now - fetched_at < ttl:
        return list(bucket.get("items") or [])

    items = fetcher()
    bucket["fetched_at"] = now
    bucket["items"] = items
    return list(items)


def get_live_weather_advisories() -> list[LiveAdvisory]:
    return _cached_fetch("weather", _WEATHER_TTL, _fetch_open_meteo)


def get_seasonal_advisories() -> list[LiveAdvisory]:
    if not settings.advisory_seasonal_rules:
        return []

    today = _today_pk()
    now = datetime.now(timezone.utc)
    items: list[LiveAdvisory] = []
    for rule in SEASONAL_PASSES:
        if not _is_in_closed_season(today, rule["closed_start"], rule["closed_end"]):
            continue
        items.append(
            LiveAdvisory(
                id=f"seasonal-{rule['region'].lower()}",
                region=rule["region"],
                message=rule["message"],
                severity="warning",
                source="BaltiTour seasonal rules",
                category="seasonal",
                admin_override=False,
                updated_at=now,
                external_url="https://www.nha.gov.pk/",
            )
        )
    return items


def _ndma_severity(title: str) -> str:
    upper = title.upper()
    if any(k in upper for k in ("FLASH FLOOD", "GLOF", "LANDSLIDE", "AVALANCHE")):
        return "critical"
    if "MONSOON" in upper or "SPECIAL" in upper:
        return "warning"
    return "warning"


def _ndma_region(title: str) -> str:
    for name in ("Khunjerab", "Hunza", "Skardu", "Deosai", "Chilas", "Gilgit", "Babusar"):
        if re.search(name, title, re.I):
            return name
    return "Gilgit-Baltistan"


def _clean_ndma_title(raw: str) -> str:
    text = re.sub(r"<[^>]+>", "", raw)
    text = html.unescape(text)
    return re.sub(r"\s+", " ", text).strip()


def _fetch_ndma() -> list[LiveAdvisory]:
    if not settings.advisory_ndma_sync:
        return []

    try:
        res = requests.get(NDMA_URL, timeout=15, headers=REQUEST_HEADERS)
        res.raise_for_status()
        html_text = res.text
    except Exception as exc:
        logger.warning("NDMA advisories fetch failed: %s", exc)
        return []

    cards = re.findall(
        r'<a href="([^"]+/storage/advisories/[^"]+\.pdf)"[^>]*class="adv-card[^"]*"'
        r"[\s\S]*?adv-card__title\">\s*([\s\S]*?)\s*</p>",
        html_text,
        re.I,
    )

    now = datetime.now(timezone.utc)
    items: list[LiveAdvisory] = []
    seen: set[str] = set()

    for href, raw_title in cards:
        title = _clean_ndma_title(raw_title)
        if not title or title in seen:
            continue
        if not GB_NDMA_KEYWORDS.search(title):
            continue
        seen.add(title)

        pdf_url = href if href.startswith("http") else f"{NDMA_BASE}{href}"
        slug = hashlib.sha1(pdf_url.encode()).hexdigest()[:10]
        items.append(
            LiveAdvisory(
                id=f"ndma-{slug}",
                region=_ndma_region(title),
                message=title,
                severity=_ndma_severity(title),
                source="NDMA Pakistan",
                category="disaster",
                admin_override=False,
                updated_at=now,
                external_url=pdf_url,
            )
        )
        if len(items) >= 3:
            break

    return items


def get_ndma_advisories() -> list[LiveAdvisory]:
    return _cached_fetch("ndma", _NDMA_TTL, _fetch_ndma)


def get_all_live_advisories() -> list[LiveAdvisory]:
    items: list[LiveAdvisory] = []
    items.extend(get_live_weather_advisories())
    items.extend(get_seasonal_advisories())
    items.extend(get_ndma_advisories())
    return items


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
        "external_url": None,
        "verified": bool(row.admin_override),
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
        "external_url": item.external_url,
        "verified": item.verified,
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
    """Merge DB advisories with live feeds; admin overrides win per region."""
    overridden_regions = {r.region.lower() for r in db_rows if r.admin_override}

    live_items: list[dict[str, Any]] = []
    if include_live:
        for item in get_all_live_advisories():
            if item.region.lower() in overridden_regions:
                continue
            live_items.append(_live_to_dict(item))

    # Replace seeded DB defaults when live weather exists for the same region
    live_weather_regions = {
        a["region"].lower() for a in live_items if a.get("category") == "weather"
    }
    db_items: list[dict[str, Any]] = []
    for row in db_rows:
        key = row.region.lower()
        if row.admin_override:
            db_items.append(_db_to_dict(row))
        elif key not in live_weather_regions:
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
