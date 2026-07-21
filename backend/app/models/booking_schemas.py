from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


class SafetyProfileIn(BaseModel):
    traveler_name: str = Field(min_length=2)
    email: EmailStr
    phone: str = Field(min_length=10)
    emergency_contact: str | None = None
    blood_group: str | None = None


class BookingCreateRequest(BaseModel):
    destination: str
    nights: int = Field(ge=1, le=30)
    guests: int = Field(ge=1, le=20)
    room_id: str
    vehicle_id: str
    guide_ids: list[str] = []
    check_in: str | None = None
    stops: list[str] = []
    enable_pooling: bool = False
    safety_profile: SafetyProfileIn
    redeem_points: int = Field(0, ge=0)


class EscrowOut(BaseModel):
    status: str
    amount: int
    platform_share: int
    vendor_share: int
    release_at: datetime | None
    release_scheduled_at: datetime | None = None
    completed_at: datetime | None = None
    geofence_flag: bool = False
    dispute_reason: str | None = None
    paid_at: datetime | None = None

    class Config:
        from_attributes = True


class TimelineDay(BaseModel):
    day: int
    label: str
    events: list[dict]
    advisory: str


class BookingOut(BaseModel):
    id: str
    reference: str
    traveler_name: str
    email: str
    phone: str
    emergency_contact: str | None
    blood_group: str | None
    destination: str
    stops: list[str] = []
    check_in: str | None
    nights: int
    guests: int
    subtotal: int
    platform_fee: int
    total: int
    points_redeemed: int = 0
    points_discount: int = 0
    points_earned: int = 0
    status: str
    voucher_token: str
    line_items: list[dict]
    guide_ids: list[str]
    created_at: datetime
    driver_name: str | None = None
    driver_phone: str | None = None
    escrow: EscrowOut | None = None
    timeline: list[TimelineDay] = []

    class Config:
        from_attributes = True


class VoucherVerifyResponse(BaseModel):
    valid: bool
    reference: str | None = None
    traveler_name: str | None = None
    destination: str | None = None
    status: str | None = None
