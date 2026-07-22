import json
import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text, create_engine
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship, sessionmaker

from app.config import settings


class Base(DeclarativeBase):
    pass


def _uuid() -> str:
    return str(uuid.uuid4())


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    full_name: Mapped[str] = mapped_column(String(255), default="")
    phone: Mapped[str | None] = mapped_column(String(32), nullable=True)
    role: Mapped[str] = mapped_column(String(20), default="tourist")  # tourist|vendor|admin
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

    vendor: Mapped["Vendor | None"] = relationship(back_populates="user", uselist=False)


class Vendor(Base):
    __tablename__ = "vendors"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), unique=True)
    business_name: Mapped[str] = mapped_column(String(255))
    vendor_type: Mapped[str] = mapped_column(String(20))  # hotel|transport|guide|mixed
    valley: Mapped[str] = mapped_column(String(100), default="Skardu")
    status: Mapped[str] = mapped_column(String(20), default="pending")  # pending|approved|suspended
    solo_safe: Mapped[bool] = mapped_column(Boolean, default=False)
    women_friendly: Mapped[bool] = mapped_column(Boolean, default=False)
    gold_badge: Mapped[bool] = mapped_column(Boolean, default=False)
    description: Mapped[str] = mapped_column(Text, default="")
    kyc_status: Mapped[str] = mapped_column(String(20), default="none")  # none|draft|submitted|approved|rejected
    physically_vetted: Mapped[bool] = mapped_column(Boolean, default=False)
    featured_until: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

    @property
    def is_featured(self) -> bool:
        if not self.featured_until:
            return False
        until = self.featured_until
        if until.tzinfo is None:
            until = until.replace(tzinfo=timezone.utc)
        return until > datetime.now(timezone.utc)

    user: Mapped["User"] = relationship(back_populates="vendor")
    properties: Mapped[list["Property"]] = relationship(back_populates="vendor", cascade="all, delete-orphan")
    vehicles: Mapped[list["Vehicle"]] = relationship(back_populates="vendor", cascade="all, delete-orphan")
    guides: Mapped[list["Guide"]] = relationship(back_populates="vendor", cascade="all, delete-orphan")
    season_rules: Mapped[list["SeasonPricing"]] = relationship(back_populates="vendor", cascade="all, delete-orphan")
    route_tariffs: Mapped[list["RouteTariff"]] = relationship(back_populates="vendor", cascade="all, delete-orphan")
    fleet_drivers: Mapped[list["FleetDriver"]] = relationship(back_populates="vendor", cascade="all, delete-orphan")
    kyc: Mapped["VendorKyc | None"] = relationship(back_populates="vendor", uselist=False)
    wallet: Mapped["VendorWallet | None"] = relationship(back_populates="vendor", uselist=False)


class Property(Base):
    __tablename__ = "properties"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    vendor_id: Mapped[str] = mapped_column(String(36), ForeignKey("vendors.id"))
    name: Mapped[str] = mapped_column(String(255))
    valley: Mapped[str] = mapped_column(String(100))
    description: Mapped[str] = mapped_column(Text, default="")

    vendor: Mapped["Vendor"] = relationship(back_populates="properties")
    rooms: Mapped[list["Room"]] = relationship(back_populates="property", cascade="all, delete-orphan")


class Room(Base):
    __tablename__ = "rooms"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    property_id: Mapped[str] = mapped_column(String(36), ForeignKey("properties.id"))
    name: Mapped[str] = mapped_column(String(255))
    capacity: Mapped[int] = mapped_column(Integer, default=2)
    price_per_night: Mapped[int] = mapped_column(Integer)
    amenities_json: Mapped[str] = mapped_column(Text, default="[]")
    images_json: Mapped[str] = mapped_column(Text, default="[]")
    hidden: Mapped[bool] = mapped_column(Boolean, default=False)

    property: Mapped["Property"] = relationship(back_populates="rooms")
    blocks: Mapped[list["RoomBlock"]] = relationship(back_populates="room", cascade="all, delete-orphan")

    def get_amenities(self) -> list[str]:
        return json.loads(self.amenities_json or "[]")

    def set_amenities(self, value: list[str]) -> None:
        self.amenities_json = json.dumps(value)

    def get_images(self) -> list[str]:
        return json.loads(self.images_json or "[]")

    def set_images(self, value: list[str]) -> None:
        self.images_json = json.dumps(value)


class RoomBlock(Base):
    __tablename__ = "room_blocks"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    room_id: Mapped[str] = mapped_column(String(36), ForeignKey("rooms.id"))
    block_date: Mapped[str] = mapped_column(String(10))  # YYYY-MM-DD

    room: Mapped["Room"] = relationship(back_populates="blocks")


class SeasonPricing(Base):
    __tablename__ = "season_pricing"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    vendor_id: Mapped[str] = mapped_column(String(36), ForeignKey("vendors.id"))
    room_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("rooms.id"), nullable=True)
    season: Mapped[str] = mapped_column(String(10))  # high|mid|low
    multiplier: Mapped[float] = mapped_column(default=1.0)

    vendor: Mapped["Vendor"] = relationship(back_populates="season_rules")


class RouteTariff(Base):
    __tablename__ = "route_tariffs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    vendor_id: Mapped[str] = mapped_column(String(36), ForeignKey("vendors.id"))
    vehicle_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("vehicles.id"), nullable=True)
    origin: Mapped[str] = mapped_column(String(100))
    destination: Mapped[str] = mapped_column(String(100))
    terrain_type: Mapped[str] = mapped_column(String(100), default="Mountain Road")
    daily_rate: Mapped[int] = mapped_column(Integer)
    active: Mapped[bool] = mapped_column(Boolean, default=True)

    vendor: Mapped["Vendor"] = relationship(back_populates="route_tariffs")


class FleetDriver(Base):
    __tablename__ = "fleet_drivers"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    vendor_id: Mapped[str] = mapped_column(String(36), ForeignKey("vendors.id"))
    name: Mapped[str] = mapped_column(String(255))
    phone: Mapped[str] = mapped_column(String(32), default="")
    languages_json: Mapped[str] = mapped_column(Text, default="[]")
    experience_years: Mapped[int] = mapped_column(Integer, default=0)
    route_knowledge: Mapped[str] = mapped_column(Text, default="")
    active: Mapped[bool] = mapped_column(Boolean, default=True)

    vendor: Mapped["Vendor"] = relationship(back_populates="fleet_drivers")
    vehicles: Mapped[list["Vehicle"]] = relationship(back_populates="fleet_driver")


class Vehicle(Base):
    __tablename__ = "vehicles"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    vendor_id: Mapped[str] = mapped_column(String(36), ForeignKey("vendors.id"))
    model: Mapped[str] = mapped_column(String(255))
    plate: Mapped[str] = mapped_column(String(32))
    driver_name: Mapped[str] = mapped_column(String(255))
    is_4x4: Mapped[bool] = mapped_column(Boolean, default=False)
    has_ac: Mapped[bool] = mapped_column(Boolean, default=False)
    daily_rate: Mapped[int] = mapped_column(Integer)
    languages_json: Mapped[str] = mapped_column(Text, default="[]")
    images_json: Mapped[str] = mapped_column(Text, default="[]")
    features_json: Mapped[str] = mapped_column(Text, default="[]")
    model_year: Mapped[int | None] = mapped_column(Integer, nullable=True)
    fleet_driver_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("fleet_drivers.id"), nullable=True)
    hidden: Mapped[bool] = mapped_column(Boolean, default=False)

    vendor: Mapped["Vendor"] = relationship(back_populates="vehicles")
    fleet_driver: Mapped["FleetDriver | None"] = relationship(back_populates="vehicles")

    def get_languages(self) -> list[str]:
        return json.loads(self.languages_json or "[]")

    def get_features(self) -> list[str]:
        return json.loads(self.features_json or "[]")

    def set_features(self, value: list[str]) -> None:
        self.features_json = json.dumps(value)

    def get_images(self) -> list[str]:
        return json.loads(self.images_json or "[]")

    def set_images(self, value: list[str]) -> None:
        self.images_json = json.dumps(value)


class Guide(Base):
    __tablename__ = "guides"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    vendor_id: Mapped[str] = mapped_column(String(36), ForeignKey("vendors.id"))
    name: Mapped[str] = mapped_column(String(255))
    specialty: Mapped[str] = mapped_column(String(255))
    daily_rate: Mapped[int] = mapped_column(Integer)
    languages_json: Mapped[str] = mapped_column(Text, default="[]")

    vendor: Mapped["Vendor"] = relationship(back_populates="guides")

    def get_languages(self) -> list[str]:
        return json.loads(self.languages_json or "[]")


class Booking(Base):
    __tablename__ = "bookings"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    reference: Mapped[str] = mapped_column(String(32), unique=True, index=True)
    user_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("users.id"), nullable=True)

    traveler_name: Mapped[str] = mapped_column(String(255))
    email: Mapped[str] = mapped_column(String(255))
    phone: Mapped[str] = mapped_column(String(32))
    emergency_contact: Mapped[str | None] = mapped_column(String(64), nullable=True)
    blood_group: Mapped[str | None] = mapped_column(String(8), nullable=True)

    destination: Mapped[str] = mapped_column(String(100))
    stops_json: Mapped[str] = mapped_column(Text, default="[]")
    enable_pooling: Mapped[bool] = mapped_column(Boolean, default=False)
    check_in: Mapped[str | None] = mapped_column(String(16), nullable=True)
    nights: Mapped[int] = mapped_column(Integer)
    guests: Mapped[int] = mapped_column(Integer)

    room_id: Mapped[str] = mapped_column(String(36))
    vehicle_id: Mapped[str] = mapped_column(String(36))
    guide_ids_json: Mapped[str] = mapped_column(Text, default="[]")
    line_items_json: Mapped[str] = mapped_column(Text, default="[]")

    subtotal: Mapped[int] = mapped_column(Integer)
    platform_fee: Mapped[int] = mapped_column(Integer)
    total: Mapped[int] = mapped_column(Integer)
    points_redeemed: Mapped[int] = mapped_column(Integer, default=0)
    points_discount: Mapped[int] = mapped_column(Integer, default=0)
    points_earned: Mapped[int] = mapped_column(Integer, default=0)

    status: Mapped[str] = mapped_column(String(20), default="confirmed")
    voucher_token: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

    escrow: Mapped["EscrowEntry | None"] = relationship(back_populates="booking", uselist=False)
    payment: Mapped["PaymentSession | None"] = relationship(back_populates="booking", uselist=False)

    def get_guide_ids(self) -> list[str]:
        return json.loads(self.guide_ids_json or "[]")

    def set_guide_ids(self, ids: list[str]) -> None:
        self.guide_ids_json = json.dumps(ids)


class EscrowEntry(Base):
    __tablename__ = "escrow_entries"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    booking_id: Mapped[str] = mapped_column(String(36), ForeignKey("bookings.id"), unique=True)
    amount: Mapped[int] = mapped_column(Integer)
    platform_share: Mapped[int] = mapped_column(Integer)
    vendor_share: Mapped[int] = mapped_column(Integer)
    status: Mapped[str] = mapped_column(String(20), default="held")
    release_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    release_scheduled_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    paid_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    completion_lat: Mapped[float | None] = mapped_column(nullable=True)
    completion_lng: Mapped[float | None] = mapped_column(nullable=True)
    geofence_flag: Mapped[bool] = mapped_column(Boolean, default=False)
    dispute_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

    booking: Mapped["Booking"] = relationship(back_populates="escrow")


class VendorKyc(Base):
    __tablename__ = "vendor_kyc"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    vendor_id: Mapped[str] = mapped_column(String(36), ForeignKey("vendors.id"), unique=True)
    cnic: Mapped[str] = mapped_column(String(20))
    cnic_name: Mapped[str] = mapped_column(String(255))
    account_title: Mapped[str] = mapped_column(String(255))
    payout_method: Mapped[str] = mapped_column(String(20))  # jazzcash|easypaisa|bank
    account_number: Mapped[str] = mapped_column(String(34))
    cnic_front_url: Mapped[str] = mapped_column(Text, default="")
    cnic_back_url: Mapped[str] = mapped_column(Text, default="")
    license_url: Mapped[str] = mapped_column(Text, default="")
    insurance_url: Mapped[str] = mapped_column(Text, default="")
    title_match_ok: Mapped[bool] = mapped_column(Boolean, default=False)
    cnic_match_ok: Mapped[bool] = mapped_column(Boolean, default=False)
    penny_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    penny_code: Mapped[str | None] = mapped_column(String(16), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="draft")
    admin_notes: Mapped[str] = mapped_column(Text, default="")
    submitted_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

    vendor: Mapped["Vendor"] = relationship(back_populates="kyc")


class VendorWallet(Base):
    __tablename__ = "vendor_wallets"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    vendor_id: Mapped[str] = mapped_column(String(36), ForeignKey("vendors.id"), unique=True)
    balance: Mapped[int] = mapped_column(Integer, default=0)
    pending_balance: Mapped[int] = mapped_column(Integer, default=0)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

    vendor: Mapped["Vendor"] = relationship(back_populates="wallet")
    entries: Mapped[list["WalletLedgerEntry"]] = relationship(back_populates="wallet", cascade="all, delete-orphan")


class WalletLedgerEntry(Base):
    __tablename__ = "wallet_ledger"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    wallet_id: Mapped[str] = mapped_column(String(36), ForeignKey("vendor_wallets.id"))
    entry_type: Mapped[str] = mapped_column(String(32))  # escrow_release|penny_test|payout
    amount: Mapped[int] = mapped_column(Integer)
    reference: Mapped[str] = mapped_column(String(64), default="")
    escrow_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

    wallet: Mapped["VendorWallet"] = relationship(back_populates="entries")


class RidePool(Base):
    __tablename__ = "ride_pools"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    vehicle_id: Mapped[str] = mapped_column(String(36), ForeignKey("vehicles.id"))
    origin: Mapped[str] = mapped_column(String(100))
    destination: Mapped[str] = mapped_column(String(100))
    departure_time: Mapped[str] = mapped_column(String(16))
    max_seats: Mapped[int] = mapped_column(Integer)
    private_fare: Mapped[int] = mapped_column(Integer)
    status: Mapped[str] = mapped_column(String(20), default="open")  # open|full|departed
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

    vehicle: Mapped["Vehicle"] = relationship()
    members: Mapped[list["PoolMember"]] = relationship(back_populates="pool", cascade="all, delete-orphan")


class PoolMember(Base):
    __tablename__ = "pool_members"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    pool_id: Mapped[str] = mapped_column(String(36), ForeignKey("ride_pools.id"))
    user_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("users.id"), nullable=True)
    guest_name: Mapped[str] = mapped_column(String(255))
    guest_phone: Mapped[str] = mapped_column(String(32), default="")
    joined_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

    pool: Mapped["RidePool"] = relationship(back_populates="members")


class SosAlert(Base):
    __tablename__ = "sos_alerts"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    booking_reference: Mapped[str | None] = mapped_column(String(32), nullable=True)
    traveler_name: Mapped[str] = mapped_column(String(255), default="")
    phone: Mapped[str] = mapped_column(String(32))
    lat: Mapped[float] = mapped_column()
    lng: Mapped[float] = mapped_column()
    message: Mapped[str] = mapped_column(Text, default="")
    status: Mapped[str] = mapped_column(String(20), default="pending")  # pending|sent|failed
    sms_sent: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    booking_reference: Mapped[str] = mapped_column(String(32), index=True)
    sender_role: Mapped[str] = mapped_column(String(20))  # tourist|vendor|system
    sender_name: Mapped[str] = mapped_column(String(255))
    body: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))


class RoadAdvisory(Base):
    __tablename__ = "road_advisories"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    region: Mapped[str] = mapped_column(String(100))
    message: Mapped[str] = mapped_column(Text)
    severity: Mapped[str] = mapped_column(String(20), default="info")  # info|warning|critical
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    admin_override: Mapped[bool] = mapped_column(Boolean, default=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))


class BaltiPointsAccount(Base):
    __tablename__ = "balti_points_accounts"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    balance: Mapped[int] = mapped_column(Integer, default=0)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))


class PointsLedgerEntry(Base):
    __tablename__ = "points_ledger"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    account_id: Mapped[str] = mapped_column(String(36), ForeignKey("balti_points_accounts.id"))
    delta: Mapped[int] = mapped_column(Integer)
    reason: Mapped[str] = mapped_column(String(64))
    booking_reference: Mapped[str | None] = mapped_column(String(32), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))


class PricingOverride(Base):
    __tablename__ = "pricing_overrides"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    label: Mapped[str] = mapped_column(String(100))
    category: Mapped[str] = mapped_column(String(32))  # all|room|vehicle|vehicle_4x4
    fixed_rate: Mapped[int | None] = mapped_column(Integer, nullable=True)
    surge_multiplier: Mapped[float] = mapped_column(default=1.0)
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    admin_user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"))
    action: Mapped[str] = mapped_column(String(64))
    entity_type: Mapped[str] = mapped_column(String(32))
    entity_id: Mapped[str] = mapped_column(String(64))
    details_json: Mapped[str] = mapped_column(Text, default="{}")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))


class DisputeTicket(Base):
    __tablename__ = "dispute_tickets"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    escrow_id: Mapped[str] = mapped_column(String(36), ForeignKey("escrow_entries.id"))
    booking_reference: Mapped[str] = mapped_column(String(32))
    filed_by: Mapped[str] = mapped_column(String(255))
    reason: Mapped[str] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(20), default="open")  # open|resolved|dismissed
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))


class PaymentSession(Base):
    __tablename__ = "payment_sessions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    booking_id: Mapped[str] = mapped_column(String(36), ForeignKey("bookings.id"), unique=True)
    gateway: Mapped[str] = mapped_column(String(20))  # jazzcash|easypaisa|stripe
    amount_pkr: Mapped[int] = mapped_column(Integer)
    amount_usd_cents: Mapped[int] = mapped_column(Integer, default=0)
    currency: Mapped[str] = mapped_column(String(8), default="PKR")
    status: Mapped[str] = mapped_column(String(20), default="pending")  # pending|paid|failed|cancelled
    external_id: Mapped[str | None] = mapped_column(String(128), nullable=True)
    checkout_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    metadata_json: Mapped[str] = mapped_column(Text, default="{}")
    paid_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

    booking: Mapped["Booking"] = relationship(back_populates="payment")


class PayoutBatch(Base):
    __tablename__ = "payout_batches"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    status: Mapped[str] = mapped_column(String(20), default="completed")  # pending|completed|failed
    total_amount: Mapped[int] = mapped_column(Integer, default=0)
    vendor_count: Mapped[int] = mapped_column(Integer, default=0)
    method: Mapped[str] = mapped_column(String(20), default="ibft")
    notes: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

    items: Mapped[list["PayoutBatchItem"]] = relationship(back_populates="batch", cascade="all, delete-orphan")


class PayoutBatchItem(Base):
    __tablename__ = "payout_batch_items"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    batch_id: Mapped[str] = mapped_column(String(36), ForeignKey("payout_batches.id"))
    vendor_id: Mapped[str] = mapped_column(String(36), ForeignKey("vendors.id"))
    amount: Mapped[int] = mapped_column(Integer)
    payout_method: Mapped[str] = mapped_column(String(20))
    account_number: Mapped[str] = mapped_column(String(34), default="")
    status: Mapped[str] = mapped_column(String(20), default="sent")  # sent|failed
    external_ref: Mapped[str | None] = mapped_column(String(64), nullable=True)

    batch: Mapped["PayoutBatch"] = relationship(back_populates="items")


class TripReview(Base):
    __tablename__ = "trip_reviews"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    booking_reference: Mapped[str] = mapped_column(String(32), index=True)
    author_name: Mapped[str] = mapped_column(String(255))
    rating: Mapped[int] = mapped_column(Integer)
    body: Mapped[str] = mapped_column(Text, default="")
    photo_url: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))


class ForumPost(Base):
    __tablename__ = "forum_posts"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    author_name: Mapped[str] = mapped_column(String(255))
    valley: Mapped[str] = mapped_column(String(100), default="Skardu")
    title: Mapped[str] = mapped_column(String(255))
    body: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))


class CartAbandonment(Base):
    __tablename__ = "cart_abandonments"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    email: Mapped[str] = mapped_column(String(255))
    phone: Mapped[str | None] = mapped_column(String(32), nullable=True)
    draft_json: Mapped[str] = mapped_column(Text, default="{}")
    sms_sent: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))


class SmsVendorLead(Base):
    __tablename__ = "sms_vendor_leads"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    phone: Mapped[str] = mapped_column(String(32))
    raw_message: Mapped[str] = mapped_column(Text)
    parsed_type: Mapped[str] = mapped_column(String(20), default="unknown")
    business_name: Mapped[str] = mapped_column(String(255), default="")
    status: Mapped[str] = mapped_column(String(20), default="placeholder")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))


engine = create_engine(
    settings.resolved_database_url,
    **(
        {"connect_args": {"check_same_thread": False}}
        if settings.resolved_database_url.startswith("sqlite")
        else {"pool_pre_ping": True}
    ),
)
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)


def init_db() -> None:
    if not settings.using_supabase_db:
        Base.metadata.create_all(bind=engine)
    _migrate_sqlite(engine)


def _migrate_sqlite(eng) -> None:
    """Add columns to existing SQLite tables when schema evolves."""
    from sqlalchemy import inspect, text

    if eng.dialect.name != "sqlite":
        return
    insp = inspect(eng)
    alters = {
        "rooms": [
            ("images_json", "TEXT DEFAULT '[]'"),
            ("hidden", "BOOLEAN DEFAULT 0"),
        ],
        "vehicles": [
            ("images_json", "TEXT DEFAULT '[]'"),
            ("features_json", "TEXT DEFAULT '[]'"),
            ("model_year", "INTEGER"),
            ("fleet_driver_id", "VARCHAR(36)"),
            ("hidden", "BOOLEAN DEFAULT 0"),
        ],
        "vendors": [
            ("kyc_status", "VARCHAR(20) DEFAULT 'none'"),
            ("physically_vetted", "BOOLEAN DEFAULT 0"),
            ("women_friendly", "BOOLEAN DEFAULT 0"),
            ("featured_until", "DATETIME"),
        ],
        "bookings": [
            ("stops_json", "TEXT DEFAULT '[]'"),
            ("enable_pooling", "BOOLEAN DEFAULT 0"),
        ],
    }
    with eng.begin() as conn:
        for table, cols in alters.items():
            if table not in insp.get_table_names():
                continue
            existing = {c["name"] for c in insp.get_columns(table)}
            for col, typedef in cols:
                if col not in existing:
                    conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {col} {typedef}"))


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
