from sqlalchemy.orm import Session

from app.db.models import Booking, DisputeTicket, EscrowEntry
from app.services.escrow import dispute_escrow


def file_dispute(
    db: Session,
    *,
    booking_reference: str,
    filed_by: str,
    reason: str,
) -> DisputeTicket:
    booking = db.query(Booking).filter(Booking.reference == booking_reference).first()
    if not booking:
        raise ValueError("Booking not found")
    escrow = db.query(EscrowEntry).filter(EscrowEntry.booking_id == booking.id).first()
    if not escrow:
        raise ValueError("No escrow for booking")
    if escrow.status == "paid":
        raise ValueError("Cannot dispute completed payout")

    dispute_escrow(db, escrow.id, reason)
    ticket = DisputeTicket(
        escrow_id=escrow.id,
        booking_reference=booking_reference,
        filed_by=filed_by,
        reason=reason,
        status="open",
    )
    db.add(ticket)
    db.commit()
    db.refresh(ticket)
    return ticket


def list_disputes(db: Session, status: str | None = None) -> list[DisputeTicket]:
    q = db.query(DisputeTicket).order_by(DisputeTicket.created_at.desc())
    if status:
        q = q.filter(DisputeTicket.status == status)
    return q.limit(100).all()
