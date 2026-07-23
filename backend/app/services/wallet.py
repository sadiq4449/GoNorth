from datetime import datetime, timezone
import math
import re

from sqlalchemy.orm import Session

from app.db.models import Property, Room, Vendor, VendorWallet, WalletLedgerEntry

DESTINATION_COORDS = {
    "skardu": (35.297, 75.633),
    "hunza": (36.316, 74.650),
    "shigar": (35.422, 75.734),
    "khaplu": (35.163, 76.358),
    "deosai": (35.024, 75.400),
    "basho": (35.250, 75.850),
}

GEOFENCE_KM = 2.0


def normalize_name(name: str) -> str:
    return re.sub(r"[^a-z0-9]", "", name.lower())


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    r = 6371.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dlon / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a))


def destination_coords(destination: str) -> tuple[float, float] | None:
    key = destination.lower().split()[0]
    for name, coords in DESTINATION_COORDS.items():
        if name in key or key in name:
            return coords
    return DESTINATION_COORDS.get("skardu")


def check_geofence(destination: str, lat: float | None, lng: float | None) -> bool:
    """Return True if scan location is suspicious (>2km from destination hub)."""
    if lat is None or lng is None:
        return False
    center = destination_coords(destination)
    if not center:
        return False
    return haversine_km(lat, lng, center[0], center[1]) > GEOFENCE_KM


def get_or_create_wallet(db: Session, vendor_id: str) -> VendorWallet:
    wallet = db.query(VendorWallet).filter(VendorWallet.vendor_id == vendor_id).first()
    if wallet:
        return wallet
    wallet = VendorWallet(vendor_id=vendor_id)
    db.add(wallet)
    db.flush()
    return wallet


def credit_wallet(
    db: Session,
    vendor_id: str,
    amount: int,
    *,
    entry_type: str,
    reference: str,
    escrow_id: str | None = None,
) -> VendorWallet:
    wallet = get_or_create_wallet(db, vendor_id)
    wallet.balance += amount
    wallet.updated_at = datetime.now(timezone.utc)
    db.add(
        WalletLedgerEntry(
            wallet_id=wallet.id,
            entry_type=entry_type,
            amount=amount,
            reference=reference,
            escrow_id=escrow_id,
        )
    )
    return wallet


def vendor_id_for_line_item(db: Session, item: dict) -> str | None:
    if item["type"] == "stay":
        room = db.get(Room, item["id"])
        if not room:
            return None
        prop = db.get(Property, room.property_id)
        return prop.vendor_id if prop else None
    if item["type"] == "transport":
        from app.db.models import Vehicle

        vehicle = db.get(Vehicle, item["id"])
        return vehicle.vendor_id if vehicle else None
    if item["type"] == "guide":
        from app.db.models import Guide

        guide = db.get(Guide, item["id"])
        return guide.vendor_id if guide else None
    if item["type"] == "experience":
        from app.db.models import Experience

        exp = db.get(Experience, item["id"])
        return exp.vendor_id if exp else None
    return None
