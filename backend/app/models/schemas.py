from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


class HealthResponse(BaseModel):
    status: str
    service: str
    version: str = "1.0.0"
    ai_configured: bool


class RoomOut(BaseModel):
    id: str
    property_id: str
    property_name: str
    vendor_name: str
    valley: str
    name: str
    capacity: int
    price_per_night: int
    amenities: list[str]
    solo_safe: bool = False
    women_friendly: bool = False
    featured: bool = False

    class Config:
        from_attributes = True


class VehicleOut(BaseModel):
    id: str
    vendor_name: str
    valley: str
    model: str
    plate: str
    driver_name: str
    is_4x4: bool
    has_ac: bool
    vehicle_category: str = "sedan"
    category_label: str = "Sedan"
    seats: int = 4
    daily_rate: int
    languages: list[str]
    solo_safe: bool = False
    women_friendly: bool = False
    featured: bool = False
    features: list[str] = []

    class Config:
        from_attributes = True


class GuideOut(BaseModel):
    id: str
    vendor_name: str
    valley: str
    name: str
    specialty: str
    daily_rate: int
    languages: list[str]

    class Config:
        from_attributes = True


class CartLineItem(BaseModel):
    type: str
    id: str
    label: str
    unit_price: int
    quantity: int
    total: int


class CartQuoteRequest(BaseModel):
    room_id: str | None = None
    vehicle_id: str | None = None
    guide_ids: list[str] = []
    experience_ids: list[str] = []
    nights: int = Field(ge=1, le=30)
    guests: int = Field(ge=1, le=20, default=2)
    destination: str | None = None
    stops: list[str] = []
    redeem_points: int = Field(0, ge=0)
    email: EmailStr | None = None


class CartQuoteResponse(BaseModel):
    line_items: list[CartLineItem]
    subtotal: int
    platform_fee: int
    platform_fee_rate: float
    points_discount: int = 0
    points_redeemed: int = 0
    points_balance: int = 0
    points_earn_estimate: int = 0
    total: int
    nights: int
    guests: int


class RecommendRequest(BaseModel):
    destination: str
    nights: int = Field(ge=1, le=30)
    budget: int = Field(ge=5000)
    vibe: str = "backpacker"


class RecommendResponse(BaseModel):
    room_id: str
    vehicle_id: str
    guide_ids: list[str] = []
    reason: str
    source: str
    quote: CartQuoteResponse
    ai_available: bool = True
    fallback_cause: str | None = None
    user_message: str | None = None


class TourPackageOut(BaseModel):
    id: str
    slug: str = ""
    title: str
    destination: str
    valley: str = ""
    nights: int
    duration_label: str
    vibe: str
    badge: str
    badge_style: str = "trending"
    rating: float
    image_layout: str = "single"
    image_colors: list[str] = []
    image_url: str = ""
    starting_price: int
    room_id: str
    vehicle_id: str
    guide_ids: list[str] = []
    reason: str = ""
    quote: CartQuoteResponse | None = None
    operator_name: str = "GoNorth Curated"
    bookable: bool = True
    featured: bool = False


class TourPackageDetailOut(TourPackageOut):
    description: str = ""
    highlights: list[str] = []
    inclusions: list[str] = []
    exclusions: list[str] = []
    itinerary: list[dict] = []


class PackageInquiryRequest(BaseModel):
    name: str = Field(min_length=2)
    email: EmailStr
    phone: str | None = None
    message: str | None = None
    travel_date: str | None = None
    guests: int = Field(default=2, ge=1, le=20)


class PackageInquiryResponse(BaseModel):
    id: str
    message: str


class RoomSearchOut(RoomOut):
    ai_recommended: bool = False
    within_budget: bool = False


class VehicleSearchOut(VehicleOut):
    ai_recommended: bool = False
    within_budget: bool = False
    terrain_compatible: bool = True


class GuideSearchOut(GuideOut):
    ai_recommended: bool = False


class SearchResponse(BaseModel):
    destination: str
    stops: list[str] = []
    nights: int
    guests: int
    budget: int | None
    vibe: str | None
    requires_4x4: bool
    ai_package: RecommendResponse | None = None
    ai_status: str | None = None
    ai_message: str | None = None
    rooms: list[RoomSearchOut]
    vehicles: list[VehicleSearchOut]
    guides: list[GuideSearchOut]
    experiences: list["ExperienceOut"] = []


class ListingsResponse(BaseModel):
    rooms: list[RoomOut]
    vehicles: list[VehicleOut]
    guides: list[GuideOut]
    experiences: list["ExperienceOut"] = []


class ExperienceOut(BaseModel):
    id: str
    vendor_id: str
    vendor_name: str
    vendor_slug: str = ""
    name: str
    category: str
    description: str = ""
    price: int
    pricing_unit: str = "per_person"
    valley: str
    images: list[str] = []
    features: list[str] = []
    solo_safe: bool = False
    women_friendly: bool = False
    featured: bool = False


class VendorStorefrontOut(BaseModel):
    slug: str
    business_name: str
    vendor_type: str
    valley: str
    description: str = ""
    solo_safe: bool = False
    women_friendly: bool = False
    gold_badge: bool = False
    physically_vetted: bool = False
    featured: bool = False
    whatsapp: str = ""
    avg_rating: float | None = None
    review_count: int = 0
    rooms: list[RoomOut] = []
    vehicles: list[VehicleOut] = []
    guides: list[GuideOut] = []
    packages: list[TourPackageOut] = []
    experiences: list[ExperienceOut] = []


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    full_name: str = Field(min_length=2)
    phone: str | None = None
    role: str = "tourist"


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: str
    email: str
    full_name: str
    phone: str | None
    role: str
    created_at: datetime

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class VendorOut(BaseModel):
    id: str
    business_name: str
    slug: str = ""
    vendor_type: str
    valley: str
    status: str
    solo_safe: bool
    women_friendly: bool
    gold_badge: bool
    physically_vetted: bool = False
    featured: bool = False
    kyc_status: str = "none"
    description: str

    class Config:
        from_attributes = True


class VendorRegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    full_name: str
    phone: str | None = None
    business_name: str
    vendor_type: str = "hotel"
    valley: str = "Skardu"
    description: str = ""


class VendorStatusUpdate(BaseModel):
    status: str
