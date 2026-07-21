from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.auth.security import require_roles
from app.db.models import User, get_db
from app.models.community_schemas import (
    CartAbandonRequest,
    CartAbandonResponse,
    ForumPostCreate,
    ForumPostOut,
    ReviewCreate,
    ReviewOut,
    SmsVendorLeadOut,
    SmsVendorRegisterRequest,
)
from app.services.community import (
    create_forum_post,
    create_review,
    list_forum_posts,
    list_reviews,
    list_sms_leads,
    register_sms_vendor,
    save_cart_abandonment,
)

router = APIRouter(prefix="/api/community", tags=["community"])


@router.get("/reviews", response_model=list[ReviewOut])
def get_reviews(db: Annotated[Session, Depends(get_db)]):
    return list_reviews(db)


@router.post("/reviews", response_model=ReviewOut)
def post_review(data: ReviewCreate, db: Annotated[Session, Depends(get_db)]):
    return create_review(db, **data.model_dump())


@router.get("/forum", response_model=list[ForumPostOut])
def get_forum(db: Annotated[Session, Depends(get_db)], valley: str | None = Query(None)):
    return list_forum_posts(db, valley)


@router.post("/forum", response_model=ForumPostOut)
def post_forum(data: ForumPostCreate, db: Annotated[Session, Depends(get_db)]):
    return create_forum_post(db, **data.model_dump())


@router.post("/cart/abandon", response_model=CartAbandonResponse)
def cart_abandon(data: CartAbandonRequest, db: Annotated[Session, Depends(get_db)]):
    row = save_cart_abandonment(db, data.email, data.phone, data.draft)
    return CartAbandonResponse(ok=True, sms_queued=row.sms_sent)


@router.post("/vendor/sms-register", response_model=SmsVendorLeadOut)
def sms_vendor_register(data: SmsVendorRegisterRequest, db: Annotated[Session, Depends(get_db)]):
    return register_sms_vendor(db, data.phone, data.message)


@router.get("/admin/sms-leads", response_model=list[SmsVendorLeadOut])
def admin_sms_leads(
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(require_roles("admin"))],
):
    return list_sms_leads(db)
