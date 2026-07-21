from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.models import get_db
from app.models.admin_schemas import PointsBalanceOut
from app.services.points import get_or_create_account, max_redeemable

router = APIRouter(prefix="/api/points", tags=["points"])


@router.get("/balance", response_model=PointsBalanceOut)
def points_balance(
    db: Annotated[Session, Depends(get_db)],
    email: str = Query(...),
    subtotal: int = Query(0, ge=0),
):
    acct = get_or_create_account(db, email)
    db.commit()
    return PointsBalanceOut(
        email=acct.email,
        balance=acct.balance,
        max_redeem_hint=max_redeemable(acct.balance, subtotal) if subtotal else acct.balance,
    )
