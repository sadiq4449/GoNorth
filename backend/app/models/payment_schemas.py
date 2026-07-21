from datetime import datetime

from pydantic import BaseModel, Field

from app.models.booking_schemas import BookingCreateRequest


class PaymentInitRequest(BookingCreateRequest):
    country: str = "PK"
    payment_method: str | None = None  # jazzcash | easypaisa | card
    is_foreign: bool = False


class PaymentSessionOut(BaseModel):
    id: str
    booking_reference: str
    gateway: str
    amount_pkr: int
    amount_usd: float
    currency: str
    status: str
    checkout_url: str
    created_at: datetime

    class Config:
        from_attributes = True


class PaymentStatusOut(BaseModel):
    id: str
    status: str
    booking_reference: str | None = None
    booking_confirmed: bool = False


class GatewayOption(BaseModel):
    id: str
    label: str
    currency: str
    amount_pkr: int
    amount_usd: float


class GatewayOptionsOut(BaseModel):
    recommended: str
    options: list[GatewayOption]


class PayoutBatchOut(BaseModel):
    id: str
    status: str
    total_amount: int
    vendor_count: int
    method: str
    created_at: datetime

    class Config:
        from_attributes = True


class WebhookAck(BaseModel):
    ok: bool
    session_id: str | None = None
    booking_reference: str | None = None
