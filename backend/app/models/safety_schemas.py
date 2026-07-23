from datetime import datetime

from pydantic import BaseModel, Field


class SosCreateRequest(BaseModel):
    lat: float
    lng: float
    phone: str = Field(min_length=6)
    traveler_name: str = ""
    booking_reference: str | None = None
    message: str = ""


class SosOut(BaseModel):
    id: str
    status: str
    sms_sent: bool
    message: str
    created_at: datetime


class AdvisoryOut(BaseModel):
    id: str
    region: str
    message: str
    severity: str
    source: str = "BaltiTour"
    category: str = "road"  # weather|road|disaster|flight|access|seasonal|emergency
    admin_override: bool
    updated_at: datetime
    live: bool = False

    class Config:
        from_attributes = True


class AdvisoryUpsertRequest(BaseModel):
    region: str
    message: str
    severity: str = Field(pattern="^(info|warning|critical)$")
    active: bool = True
    admin_override: bool = True


class ChatMessageOut(BaseModel):
    id: str
    booking_reference: str
    sender_role: str
    sender_name: str
    body: str
    created_at: datetime

    class Config:
        from_attributes = True


class ChatPostRequest(BaseModel):
    body: str = Field(min_length=1, max_length=2000)
    sender_name: str = Field(min_length=1)
    sender_role: str = Field(default="tourist", pattern="^(tourist|vendor)$")
