from sqlalchemy.orm import Session

from app.db.models import BaltiPointsAccount, PointsLedgerEntry

EARN_PER_PKR = 100  # 1 point per Rs. 100 subtotal
MAX_REDEEM_RATE = 0.20


def get_or_create_account(db: Session, email: str) -> BaltiPointsAccount:
    acct = db.query(BaltiPointsAccount).filter(BaltiPointsAccount.email == email.lower()).first()
    if acct:
        return acct
    acct = BaltiPointsAccount(email=email.lower())
    db.add(acct)
    db.flush()
    return acct


def max_redeemable(balance: int, subtotal: int) -> int:
    cap = int(subtotal * MAX_REDEEM_RATE)
    return max(0, min(balance, cap))


def calc_points_discount(redeem_points: int, balance: int, subtotal: int) -> tuple[int, int]:
    """Return (points_to_use, discount_pkr). 1 point = 1 PKR."""
    allowed = max_redeemable(balance, subtotal)
    use = max(0, min(redeem_points, allowed))
    return use, use


def earn_for_subtotal(subtotal: int) -> int:
    return subtotal // EARN_PER_PKR


def apply_points_delta(
    db: Session,
    email: str,
    delta: int,
    reason: str,
    booking_reference: str | None = None,
) -> BaltiPointsAccount:
    acct = get_or_create_account(db, email)
    acct.balance = max(0, acct.balance + delta)
    db.add(
        PointsLedgerEntry(
            account_id=acct.id,
            delta=delta,
            reason=reason,
            booking_reference=booking_reference,
        )
    )
    return acct
