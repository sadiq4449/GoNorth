from datetime import datetime

from pydantic import BaseModel, Field


class KycOut(BaseModel):
    id: str | None = None
    vendor_id: str
    cnic: str = ""
    cnic_name: str = ""
    account_title: str = ""
    payout_method: str = "jazzcash"
    account_number: str = ""
    cnic_front_url: str = ""
    cnic_back_url: str = ""
    license_url: str = ""
    insurance_url: str = ""
    title_match_ok: bool = False
    cnic_match_ok: bool = False
    penny_verified: bool = False
    status: str = "none"
    admin_notes: str = ""
    submitted_at: datetime | None = None


class KycSubmitRequest(BaseModel):
    cnic: str = Field(min_length=13, max_length=15)
    cnic_name: str = Field(min_length=2)
    account_title: str = Field(min_length=2)
    payout_method: str = Field(pattern="^(jazzcash|easypaisa|bank)$")
    account_number: str = Field(min_length=10, max_length=34)
    cnic_front_url: str = ""
    cnic_back_url: str = ""
    license_url: str = ""
    insurance_url: str = ""


class PennyVerifyRequest(BaseModel):
    code: str = Field(min_length=4, max_length=8)


class PennyTestResponse(BaseModel):
    message: str
    sandbox_code: str


class KycReviewRequest(BaseModel):
    approved: bool
    notes: str = ""
    physically_vetted: bool | None = None


class WalletOut(BaseModel):
    balance: int
    pending_balance: int
    vendor_id: str


class EscrowAdminOut(BaseModel):
    id: str
    booking_reference: str
    destination: str
    traveler_name: str
    amount: int
    platform_share: int
    vendor_share: int
    status: str
    release_at: datetime | None
    completed_at: datetime | None
    geofence_flag: bool
    dispute_reason: str | None


class TripCompleteRequest(BaseModel):
    token: str
    lat: float | None = None
    lng: float | None = None


class CompletionTokenOut(BaseModel):
    token: str
    reference: str
