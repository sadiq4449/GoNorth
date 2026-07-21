from datetime import datetime

from sqlalchemy.orm import Session

from app.db.models import ChatMessage


def list_messages(db: Session, booking_reference: str, since: datetime | None = None) -> list[ChatMessage]:
    q = db.query(ChatMessage).filter(ChatMessage.booking_reference == booking_reference)
    if since:
        q = q.filter(ChatMessage.created_at > since)
    return q.order_by(ChatMessage.created_at.asc()).limit(200).all()


def post_message(
    db: Session,
    *,
    booking_reference: str,
    sender_role: str,
    sender_name: str,
    body: str,
) -> ChatMessage:
    msg = ChatMessage(
        booking_reference=booking_reference,
        sender_role=sender_role,
        sender_name=sender_name,
        body=body.strip(),
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return msg
