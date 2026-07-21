from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.auth.security import get_optional_user
from app.db.models import User, get_db
from app.models.pool_schemas import PoolJoinRequest, PoolJoinResponse, PoolOut
from app.services.pools import join_pool, leave_pool, list_active_pools, pool_to_dict

router = APIRouter(prefix="/api/pools", tags=["pools"])


def _parse_member_ids(raw: str | None) -> list[str]:
    if not raw:
        return []
    return [x.strip() for x in raw.split(",") if x.strip()]


@router.get("/active", response_model=list[PoolOut])
def get_active_pools(
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User | None, Depends(get_optional_user)] = None,
    member_ids: str | None = Query(None, description="Comma-separated guest member IDs"),
):
    return list_active_pools(
        db,
        user_id=user.id if user else None,
        member_ids=_parse_member_ids(member_ids),
    )


@router.post("/{pool_id}/join", response_model=PoolJoinResponse)
def join_pool_endpoint(
    pool_id: str,
    data: PoolJoinRequest,
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User | None, Depends(get_optional_user)] = None,
):
    try:
        pool, member = join_pool(
            db,
            pool_id,
            guest_name=data.guest_name,
            guest_phone=data.guest_phone,
            user_id=user.id if user else None,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return PoolJoinResponse(
        member_id=member.id,
        pool=PoolOut(**pool_to_dict(pool, user_id=user.id if user else None, member_ids=[member.id])),
    )


@router.post("/{pool_id}/leave", response_model=PoolOut)
def leave_pool_endpoint(
    pool_id: str,
    member_id: str = Query(...),
    db: Annotated[Session, Depends(get_db)] = None,
):
    try:
        pool = leave_pool(db, pool_id, member_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return PoolOut(**pool_to_dict(pool))
