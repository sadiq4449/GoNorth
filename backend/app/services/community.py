import json
import re
from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.db.models import CartAbandonment, ForumPost, SmsVendorLead, TripReview, Vendor
from app.services.sms import send_sms


def list_reviews(db: Session, limit: int = 50) -> list[TripReview]:
    return db.query(TripReview).order_by(TripReview.created_at.desc()).limit(limit).all()


def create_review(db: Session, **kwargs) -> TripReview:
    row = TripReview(**kwargs)
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


def list_forum_posts(db: Session, valley: str | None = None, limit: int = 50) -> list[ForumPost]:
    q = db.query(ForumPost).order_by(ForumPost.created_at.desc())
    if valley:
        q = q.filter(ForumPost.valley.ilike(f"%{valley}%"))
    return q.limit(limit).all()


def create_forum_post(db: Session, **kwargs) -> ForumPost:
    row = ForumPost(**kwargs)
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


def save_cart_abandonment(db: Session, email: str, phone: str | None, draft: dict) -> CartAbandonment:
    row = CartAbandonment(email=email.lower(), phone=phone, draft_json=json.dumps(draft))
    db.add(row)
    db.commit()
    db.refresh(row)
    sms_ok = send_sms(
        phone or email,
        f"GoNorth: your trip to {draft.get('destination', 'Gilgit-Baltistan')} is saved. Complete booking at gonorth.vercel.app/plan",
    )
    row.sms_sent = sms_ok
    db.commit()
    return row


def parse_sms_registration(message: str) -> tuple[str, str]:
    msg = message.strip().upper()
    if msg.startswith("REG HOTEL"):
        parts = message.strip().split(maxsplit=3)
        name = parts[2] if len(parts) > 2 else "New Hotel"
        return "hotel", name
    if msg.startswith("REG TRANSPORT") or msg.startswith("REG VEHICLE"):
        parts = message.strip().split(maxsplit=3)
        name = parts[2] if len(parts) > 2 else "New Transport"
        return "transport", name
    return "unknown", "Unknown"


def register_sms_vendor(db: Session, phone: str, message: str) -> SmsVendorLead:
    parsed_type, business_name = parse_sms_registration(message)
    row = SmsVendorLead(
        phone=phone,
        raw_message=message,
        parsed_type=parsed_type,
        business_name=business_name,
        status="placeholder",
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


def list_sms_leads(db: Session) -> list[SmsVendorLead]:
    return db.query(SmsVendorLead).order_by(SmsVendorLead.created_at.desc()).limit(100).all()


def convert_sms_lead_to_vendor(
    db: Session,
    lead_id: str,
    *,
    email: str,
    password: str,
    full_name: str | None = None,
    valley: str = "Skardu",
) -> tuple[SmsVendorLead, Vendor]:
    from app.auth.security import hash_password
    from app.db.models import User
    from app.services.vendor_slugs import ensure_unique_slug

    lead = db.get(SmsVendorLead, lead_id)
    if not lead:
        raise ValueError("SMS lead not found")
    if lead.status == "converted":
        raise ValueError("Lead already converted to vendor")

    vendor_type = lead.parsed_type if lead.parsed_type in ("hotel", "transport", "guide") else "hotel"
    if db.query(User).filter(User.email == email.lower()).first():
        raise ValueError("Email already registered")

    user = User(
        email=email.lower(),
        password_hash=hash_password(password),
        full_name=full_name or lead.business_name,
        role="vendor",
    )
    db.add(user)
    db.flush()
    vendor = Vendor(
        user_id=user.id,
        business_name=lead.business_name,
        slug=ensure_unique_slug(db, lead.business_name),
        vendor_type=vendor_type,
        valley=valley,
        status="pending",
        whatsapp=lead.phone,
    )
    db.add(vendor)
    lead.status = "converted"
    db.commit()
    db.refresh(lead)
    db.refresh(vendor)
    return lead, vendor


def delete_review(db: Session, review_id: str) -> None:
    row = db.get(TripReview, review_id)
    if not row:
        raise ValueError("Review not found")
    db.delete(row)
    db.commit()


def set_vendor_featured(db: Session, vendor, days: int = 14) -> None:
    vendor.featured_until = datetime.now(timezone.utc) + timedelta(days=days)
    db.commit()


def ensure_community_demo(db: Session) -> None:
    if not db.query(TripReview).first():
        db.add(
            TripReview(
                booking_reference="BT-DEMO",
                author_name="Sara Khan",
                rating=5,
                body="Solo trip through Skardu — Murad’s 4x4 and the guesthouse were exactly what I needed. Would book again through GoNorth.",
            )
        )
        db.add(
            ForumPost(
                author_name="Traveler Ali",
                valley="Skardu",
                title="When does Deosai open?",
                body="Planning for late June — is the Skardu–Deosai road usually clear by then? Any 4x4 recommendations?",
            )
        )
        db.commit()


def ensure_featured_vendors(db: Session) -> None:
    vendor = db.query(Vendor).filter(Vendor.business_name.ilike("%Murad%")).first()
    if vendor and not vendor.featured_until:
        vendor.featured_until = datetime.now(timezone.utc) + timedelta(days=30)
        db.commit()
