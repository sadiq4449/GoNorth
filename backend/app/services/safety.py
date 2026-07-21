from sqlalchemy.orm import Session

from app.db.models import Booking, RoadAdvisory, SosAlert
from app.services.sms import format_sos_message, send_sms
from app.config import settings


def create_sos_alert(
    db: Session,
    *,
    lat: float,
    lng: float,
    phone: str,
    traveler_name: str = "",
    booking_reference: str | None = None,
    message: str = "",
) -> SosAlert:
    if booking_reference:
        booking = db.query(Booking).filter(Booking.reference == booking_reference).first()
        if booking and not traveler_name:
            traveler_name = booking.traveler_name

    body = message or format_sos_message(
        lat=lat,
        lng=lng,
        traveler_name=traveler_name or "Tourist",
        phone=phone,
        reference=booking_reference,
    )

    alert = SosAlert(
        booking_reference=booking_reference,
        traveler_name=traveler_name or "Tourist",
        phone=phone,
        lat=lat,
        lng=lng,
        message=body,
    )
    db.add(alert)
    db.flush()

    sms_result = send_sms(settings.sos_dispatch_number, body)
    alert.sms_sent = sms_result["ok"]
    alert.status = "sent" if sms_result["ok"] else "failed"
    db.commit()
    db.refresh(alert)
    return alert


def list_sos_alerts(db: Session, limit: int = 50) -> list[SosAlert]:
    return db.query(SosAlert).order_by(SosAlert.created_at.desc()).limit(limit).all()


def ensure_default_advisories(db: Session) -> None:
    if db.query(RoadAdvisory).first():
        return
    defaults = [
        ("Skardu", "Road clear: Skardu Airport Rd · All routes open", "info"),
        ("Deosai", "Monitor weather — possible closures near Sheosar Lake after heavy rain", "warning"),
        ("Hunza", "Karimabad bridge traffic normal · Cherry blossom season peak", "info"),
    ]
    for region, message, severity in defaults:
        db.add(RoadAdvisory(region=region, message=message, severity=severity, active=True))
    db.commit()


def list_advisories(db: Session, region: str | None = None) -> list[RoadAdvisory]:
    q = db.query(RoadAdvisory).filter(RoadAdvisory.active.is_(True))
    if region:
        q = q.filter(RoadAdvisory.region.ilike(f"%{region}%"))
    return q.order_by(RoadAdvisory.severity.desc(), RoadAdvisory.updated_at.desc()).all()


def upsert_advisory(db: Session, *, region: str, message: str, severity: str, active: bool = True, admin_override: bool = False) -> RoadAdvisory:
    row = db.query(RoadAdvisory).filter(RoadAdvisory.region == region).first()
    if not row:
        row = RoadAdvisory(region=region)
        db.add(row)
    row.message = message
    row.severity = severity
    row.active = active
    row.admin_override = admin_override
    from datetime import datetime, timezone
    row.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(row)
    return row
