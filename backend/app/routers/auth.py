from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth.security import create_access_token, hash_password, require_roles, verify_password
from app.db.models import User, Vendor, get_db
from app.models.schemas import (
    LoginRequest,
    RegisterRequest,
    TokenResponse,
    UserOut,
    VendorRegisterRequest,
)

router = APIRouter(prefix="/api/auth", tags=["auth"])


def _user_out(user: User) -> UserOut:
    return UserOut.model_validate(user)


@router.post("/register", response_model=TokenResponse)
def register_tourist(data: RegisterRequest, db: Annotated[Session, Depends(get_db)]):
    if data.role not in ("tourist",):
        raise HTTPException(status_code=400, detail="Use /register/vendor for vendor accounts")
    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(
        email=data.email,
        password_hash=hash_password(data.password),
        full_name=data.full_name,
        phone=data.phone,
        role="tourist",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    token = create_access_token(user.id, user.role)
    return TokenResponse(access_token=token, user=_user_out(user))


@router.post("/register/vendor", response_model=TokenResponse)
def register_vendor(data: VendorRegisterRequest, db: Annotated[Session, Depends(get_db)]):
    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(
        email=data.email,
        password_hash=hash_password(data.password),
        full_name=data.full_name,
        phone=data.phone,
        role="vendor",
    )
    db.add(user)
    db.flush()
    vendor = Vendor(
        user_id=user.id,
        business_name=data.business_name,
        vendor_type=data.vendor_type,
        valley=data.valley,
        description=data.description,
        status="pending",
    )
    db.add(vendor)
    db.commit()
    db.refresh(user)
    token = create_access_token(user.id, user.role)
    return TokenResponse(access_token=token, user=_user_out(user))


@router.post("/login", response_model=TokenResponse)
def login(data: LoginRequest, db: Annotated[Session, Depends(get_db)]):
    user = db.query(User).filter(User.email == data.email).first()
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    token = create_access_token(user.id, user.role)
    return TokenResponse(access_token=token, user=_user_out(user))


@router.get("/me", response_model=UserOut)
def me(user: Annotated[User, Depends(require_roles("tourist", "vendor", "admin"))]):
    return _user_out(user)
