import json
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.db.models import AuditLog, PricingOverride, Vehicle


def _rule_matches(rule: PricingOverride, category: str, is_4x4: bool) -> bool:
    if rule.category == "all":
        return True
    if rule.category == "room" and category == "room":
        return True
    if rule.category == "vehicle" and category == "vehicle":
        return True
    if rule.category == "vehicle_4x4" and category == "vehicle" and is_4x4:
        return True
    return False


def get_active_overrides(db: Session) -> list[PricingOverride]:
    return db.query(PricingOverride).filter(PricingOverride.active.is_(True)).all()


def apply_price(base: int, category: str, is_4x4: bool, overrides: list[PricingOverride]) -> int:
    price = base
    for rule in overrides:
        if not _rule_matches(rule, category, is_4x4):
            continue
        if rule.fixed_rate is not None:
            price = rule.fixed_rate
        price = int(round(price * rule.surge_multiplier))
    return max(price, 0)


def apply_overrides_to_line_items(db: Session, line_items: list[dict]) -> list[dict]:
    overrides = get_active_overrides(db)
    if not overrides:
        return line_items
    updated = []
    for item in line_items:
        if item["type"] == "stay":
            cat, is_4x4 = "room", False
        elif item["type"] == "transport":
            cat = "vehicle"
            v = db.get(Vehicle, item["id"])
            is_4x4 = v.is_4x4 if v else False
        else:
            cat, is_4x4 = "room", False
        unit = apply_price(item["unit_price"], cat, is_4x4, overrides)
        updated.append({**item, "unit_price": unit, "total": unit * item["quantity"]})
    return updated


def upsert_override(
    db: Session,
    *,
    label: str,
    category: str,
    fixed_rate: int | None,
    surge_multiplier: float,
    active: bool = True,
) -> PricingOverride:
    row = db.query(PricingOverride).filter(PricingOverride.category == category).first()
    if not row:
        row = PricingOverride(label=label, category=category)
        db.add(row)
    row.label = label
    row.fixed_rate = fixed_rate
    row.surge_multiplier = surge_multiplier
    row.active = active
    row.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(row)
    return row


def log_audit(
    db: Session,
    *,
    admin_user_id: str,
    action: str,
    entity_type: str,
    entity_id: str,
    details: dict | None = None,
) -> AuditLog:
    entry = AuditLog(
        admin_user_id=admin_user_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        details_json=json.dumps(details or {}),
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry
