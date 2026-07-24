from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


class ReviewCreate(BaseModel):
    booking_reference: str
    author_name: str = Field(min_length=2)
    rating: int = Field(ge=1, le=5)
    body: str = Field(min_length=5)
    photo_url: str = ""


class ReviewOut(BaseModel):
    id: str
    booking_reference: str
    author_name: str
    rating: int
    body: str
    photo_url: str
    created_at: datetime

    class Config:
        from_attributes = True


class ForumPostCreate(BaseModel):
    author_name: str = Field(min_length=2)
    valley: str = "Skardu"
    title: str = Field(min_length=3)
    body: str = Field(min_length=10)


class ForumPostOut(BaseModel):
    id: str
    author_name: str
    valley: str
    title: str
    body: str
    created_at: datetime

    class Config:
        from_attributes = True


class CartAbandonRequest(BaseModel):
    email: EmailStr
    phone: str | None = None
    draft: dict = Field(default_factory=dict)


class CartAbandonResponse(BaseModel):
    ok: bool
    sms_queued: bool = False


class SmsVendorRegisterRequest(BaseModel):
    phone: str = Field(min_length=10)
    message: str = Field(min_length=8)


class SmsVendorLeadOut(BaseModel):
    id: str
    phone: str
    raw_message: str
    parsed_type: str
    business_name: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class SmsLeadConvertRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    full_name: str | None = None
    valley: str = "Skardu"


class FleetTripOut(BaseModel):
    reference: str
    destination: str
    traveler_name: str
    driver_name: str | None
    status: str
    lat: float
    lng: float
    last_ping: datetime | None = None


class AdminVendorCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    full_name: str
    business_name: str
    vendor_type: str = "hotel"
    valley: str = "Skardu"


class VendorBoostRequest(BaseModel):
    days: int = Field(14, ge=1, le=90)


class VendorBoostOut(BaseModel):
    featured: bool
    featured_until: datetime | None = None
    message: str


class VendorPendingTripOut(BaseModel):
    reference: str
    destination: str
    traveler_name: str
    check_in: str | None
    nights: int
    escrow_status: str
    completion_token: str
