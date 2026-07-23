from datetime import date, datetime, timedelta

from pydantic import BaseModel, Field


class VendorRoomOut(BaseModel):
    id: str
    property_id: str
    property_name: str
    name: str
    capacity: int
    price_per_night: int
    effective_price: int | None = None
    amenities: list[str]
    images: list[str]
    hidden: bool


class VendorRoomCreate(BaseModel):
    name: str = Field(min_length=2)
    capacity: int = Field(ge=1, le=20)
    price_per_night: int = Field(ge=500)
    amenities: list[str] = []
    images: list[str] = []


class VendorRoomUpdate(BaseModel):
    name: str | None = None
    capacity: int | None = Field(None, ge=1, le=20)
    price_per_night: int | None = Field(None, ge=500)
    amenities: list[str] | None = None
    images: list[str] | None = None
    hidden: bool | None = None


class CalendarDayOut(BaseModel):
    date: str
    blocked: bool


class RoomCalendarOut(BaseModel):
    room_id: str
    room_name: str
    days: list[CalendarDayOut]


class CalendarToggleRequest(BaseModel):
    date: str
    blocked: bool


class SeasonRuleOut(BaseModel):
    id: str
    season: str
    multiplier: float
    room_id: str | None = None


class SeasonPricingUpdate(BaseModel):
    rules: list[dict]  # {season, multiplier, room_id?}


class SeasonPricingPreview(BaseModel):
    season: str
    multiplier: float
    room_id: str | None
    room_name: str | None
    base_rate: int
    effective_rate: int


class RouteTariffOut(BaseModel):
    id: str
    vehicle_id: str | None
    origin: str
    destination: str
    terrain_type: str
    daily_rate: int
    active: bool


class RouteTariffCreate(BaseModel):
    vehicle_id: str | None = None
    origin: str = "Skardu"
    destination: str
    terrain_type: str = "Mountain Road"
    daily_rate: int = Field(ge=1000)
    active: bool = True


class RouteTariffUpdate(BaseModel):
    origin: str | None = None
    destination: str | None = None
    terrain_type: str | None = None
    daily_rate: int | None = Field(None, ge=1000)
    active: bool | None = None
    vehicle_id: str | None = None


class FleetDriverOut(BaseModel):
    id: str
    name: str
    phone: str
    languages: list[str]
    experience_years: int
    route_knowledge: str
    active: bool
    vehicle_count: int = 0


class FleetDriverCreate(BaseModel):
    name: str = Field(min_length=2)
    phone: str = ""
    languages: list[str] = []
    experience_years: int = Field(ge=0, le=50, default=0)
    route_knowledge: str = ""


class FleetDriverUpdate(BaseModel):
    name: str | None = None
    phone: str | None = None
    languages: list[str] | None = None
    experience_years: int | None = Field(None, ge=0, le=50)
    route_knowledge: str | None = None
    active: bool | None = None


class VendorVehicleOut(BaseModel):
    id: str
    model: str
    plate: str
    driver_name: str
    is_4x4: bool
    has_ac: bool
    daily_rate: int
    languages: list[str]
    features: list[str]
    images: list[str]
    model_year: int | None
    fleet_driver_id: str | None
    hidden: bool


class VendorVehicleCreate(BaseModel):
    model: str
    plate: str
    driver_name: str
    is_4x4: bool = False
    has_ac: bool = False
    daily_rate: int = Field(ge=1000)
    languages: list[str] = []
    features: list[str] = []
    images: list[str] = []
    model_year: int | None = None
    fleet_driver_id: str | None = None


class VendorVehicleUpdate(BaseModel):
    model: str | None = None
    plate: str | None = None
    driver_name: str | None = None
    is_4x4: bool | None = None
    has_ac: bool | None = None
    daily_rate: int | None = Field(None, ge=1000)
    languages: list[str] | None = None
    features: list[str] | None = None
    images: list[str] | None = None
    model_year: int | None = None
    fleet_driver_id: str | None = None
    hidden: bool | None = None


class VendorDashboardOut(BaseModel):
    business_name: str
    vendor_type: str
    valley: str
    status: str
    room_count: int
    vehicle_count: int
    driver_count: int
    tariff_count: int
    blocked_nights: int
    featured: bool = False
    featured_until: datetime | None = None
    onboarding_complete: bool = False


class OnboardingStepOut(BaseModel):
    id: str
    title: str
    complete: bool
    description: str


class OnboardingStatusOut(BaseModel):
    steps: list[OnboardingStepOut]
    current_step: str
    complete: bool
    vendor_type: str


class VendorProfileUpdate(BaseModel):
    phone: str | None = None
    description: str | None = None
    solo_safe: bool | None = None
    women_friendly: bool | None = None


class VendorGuideOut(BaseModel):
    id: str
    name: str
    specialty: str
    daily_rate: int
    languages: list[str]


class VendorGuideCreate(BaseModel):
    name: str = Field(min_length=2)
    specialty: str = Field(min_length=2)
    daily_rate: int = Field(ge=1000)
    languages: list[str] = []


class UploadResponse(BaseModel):
    url: str
