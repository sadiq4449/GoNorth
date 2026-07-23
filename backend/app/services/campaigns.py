from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.db.models import PromoCampaign


def ensure_default_campaigns(db: Session) -> None:
    if db.query(PromoCampaign).first():
        return
    defaults = [
        PromoCampaign(
            title="Autumn in Skardu",
            message="Partner hostels offering warm stays and valley views — limited off-season rates.",
            valley="Skardu",
            discount_label="Up to 20% off",
            cta_url="/plan",
            cta_label="Explore stays",
            season="off-season",
            active=True,
            sort_order=1,
        ),
        PromoCampaign(
            title="Winter Deosai packages",
            message="Book early for spring Deosai access — shared 4x4 pools fill fast.",
            valley="Deosai",
            discount_label="Pool from Rs. 3,000/seat",
            cta_url="/pools",
            cta_label="Browse ride pools",
            season="off-season",
            active=True,
            sort_order=2,
        ),
        PromoCampaign(
            title="Khaplu heritage season",
            message="Cultural guides and boutique stays — perfect for slow-travel weekends.",
            valley="Khaplu",
            discount_label="Guide + stay bundles",
            cta_url="/plan",
            cta_label="Build a trip",
            season="off-season",
            active=True,
            sort_order=3,
        ),
    ]
    for row in defaults:
        db.add(row)
    db.commit()


def _is_live(row: PromoCampaign, now: datetime) -> bool:
    if not row.active:
        return False
    if row.starts_at:
        start = row.starts_at
        if start.tzinfo is None:
            start = start.replace(tzinfo=timezone.utc)
        if start > now:
            return False
    if row.ends_at:
        end = row.ends_at
        if end.tzinfo is None:
            end = end.replace(tzinfo=timezone.utc)
        if end < now:
            return False
    return True


def list_active_campaigns(db: Session, valley: str | None = None) -> list[PromoCampaign]:
    now = datetime.now(timezone.utc)
    rows = db.query(PromoCampaign).order_by(PromoCampaign.sort_order, PromoCampaign.created_at.desc()).all()
    out = [r for r in rows if _is_live(r, now)]
    if valley:
        out = [r for r in out if not r.valley or r.valley.lower() == valley.lower()]
    return out


def list_all_campaigns(db: Session) -> list[PromoCampaign]:
    return db.query(PromoCampaign).order_by(PromoCampaign.sort_order, PromoCampaign.created_at.desc()).all()


def upsert_campaign(db: Session, data: dict) -> PromoCampaign:
    row_id = data.pop("id", None)
    if row_id:
        row = db.get(PromoCampaign, row_id)
        if not row:
            raise ValueError("Campaign not found")
        for key, val in data.items():
            setattr(row, key, val)
    else:
        row = PromoCampaign(**data)
        db.add(row)
    db.commit()
    db.refresh(row)
    return row
