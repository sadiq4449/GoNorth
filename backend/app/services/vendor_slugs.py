import re

from sqlalchemy.orm import Session

from app.db.models import Vendor


def slugify(name: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", (name or "").lower()).strip("-")
    return slug[:100] or "vendor"


def ensure_unique_slug(db: Session, base: str, exclude_id: str | None = None) -> str:
    slug = slugify(base)
    candidate = slug
    n = 2
    while True:
        q = db.query(Vendor).filter(Vendor.slug == candidate)
        if exclude_id:
            q = q.filter(Vendor.id != exclude_id)
        if not q.first():
            return candidate
        candidate = f"{slug}-{n}"
        n += 1


def backfill_vendor_slugs(db: Session) -> None:
    for vendor in db.query(Vendor).filter((Vendor.slug == "") | (Vendor.slug.is_(None))).all():
        vendor.slug = ensure_unique_slug(db, vendor.business_name, vendor.id)
    db.commit()
