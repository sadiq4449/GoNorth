from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


class PointsBalanceOut(BaseModel):
    email: str
    balance: int
    max_redeem_hint: int = 0


class PricingOverrideOut(BaseModel):
    id: str
    label: str
    category: str
    fixed_rate: int | None
    surge_multiplier: float
    active: bool

    class Config:
        from_attributes = True


class PricingOverrideUpsert(BaseModel):
    label: str
    category: str = Field(pattern="^(all|room|vehicle|vehicle_4x4)$")
    fixed_rate: int | None = None
    surge_multiplier: float = Field(ge=0.5, le=3.0, default=1.0)
    active: bool = True


class AuditLogOut(BaseModel):
    id: str
    action: str
    entity_type: str
    entity_id: str
    details: dict
    created_at: datetime


class BookingAdminUpdate(BaseModel):
    destination: str | None = None
    nights: int | None = Field(None, ge=1, le=30)
    guests: int | None = Field(None, ge=1, le=20)
    status: str | None = None
    traveler_name: str | None = None


class DisputeCreateRequest(BaseModel):
    reason: str = Field(min_length=5)
    filed_by: str = Field(min_length=2)


class DisputeOut(BaseModel):
    id: str
    booking_reference: str
    filed_by: str
    reason: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class PlatformReportsOut(BaseModel):
    vendors_total: int
    vendors_pending: int
    vendors_approved: int
    vendors_suspended: int
    bookings_total: int
    bookings_confirmed: int
    escrow_held: int
    escrow_paid: int
    disputes_open: int
    kyc_pending: int
    packages_active: int
    packages_inactive: int
    rooms_live: int
    vehicles_live: int
    guides_live: int
    revenue_platform: int
    revenue_vendor: int


class PlatformSettingsOut(BaseModel):
    ai_configured: bool
    ai_model: str
    advisory_live_weather: bool
    advisory_ndma_sync: bool
    advisory_seasonal_rules: bool
    allow_direct_booking: bool
    usd_pkr_rate: float
    sms_configured: bool
    stripe_configured: bool


class PlatformSettingsUpdate(BaseModel):
    advisory_live_weather: bool | None = None
    advisory_ndma_sync: bool | None = None
    advisory_seasonal_rules: bool | None = None
    allow_direct_booking: bool | None = None
    usd_pkr_rate: float | None = Field(None, ge=1.0, le=1000.0)


class AdminPackageOut(BaseModel):
    id: str
    slug: str
    title: str
    destination: str
    vendor_name: str
    active: bool
    featured: bool
    starting_price: int
    bookable: bool
