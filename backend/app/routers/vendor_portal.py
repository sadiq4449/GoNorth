from datetime import date
from typing import Annotated

from fastapi import APIRouter, Depends, File, Query, UploadFile
from sqlalchemy.orm import Session

from app.auth.security import require_roles
from app.db.models import User, get_db
from app.models.vendor_schemas import (
    CalendarToggleRequest,
    FleetDriverCreate,
    FleetDriverOut,
    FleetDriverUpdate,
    OnboardingStatusOut,
    RouteTariffCreate,
    RouteTariffOut,
    RouteTariffUpdate,
    RoomCalendarOut,
    SeasonPricingPreview,
    SeasonPricingUpdate,
    SeasonRuleOut,
    UploadResponse,
    VendorDashboardOut,
    VendorGuideCreate,
    VendorGuideOut,
    VendorGuideUpdate,
    VendorProfileOut,
    VendorProfileUpdate,
    VendorRoomCreate,
    VendorRoomOut,
    VendorRoomUpdate,
    VendorVehicleCreate,
    VendorVehicleOut,
    VendorVehicleUpdate,
)
from app.models.community_schemas import VendorBoostOut, VendorBoostRequest, VendorPendingTripOut
from app.models.kyc_schemas import (
    KycOut,
    KycSubmitRequest,
    PennyTestResponse,
    PennyVerifyRequest,
    TripCompleteRequest,
    WalletOut,
)
from app.services import vendor_portal as svc
from app.services.kyc import (
    get_kyc,
    initiate_penny_test,
    submit_kyc,
    upsert_kyc_draft,
    verify_penny_test,
)
from app.services.wallet import get_or_create_wallet

router = APIRouter(prefix="/api/vendor", tags=["vendor-portal"])


def _vendor(db: Session, user: User):
    return svc.get_vendor_for_user(db, user)


@router.get("/dashboard", response_model=VendorDashboardOut)
def vendor_dashboard(
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(require_roles("vendor"))],
):
    return svc.dashboard_summary(db, _vendor(db, user))


@router.get("/onboarding", response_model=OnboardingStatusOut)
def vendor_onboarding_status(
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(require_roles("vendor"))],
):
    vendor = _vendor(db, user)
    return svc.onboarding_status(db, vendor, user)


@router.get("/profile", response_model=VendorProfileOut)
def get_vendor_profile(
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(require_roles("vendor"))],
):
    vendor = _vendor(db, user)
    return svc.vendor_profile_detail(db, vendor, user)


@router.patch("/profile", response_model=VendorProfileOut)
def update_vendor_profile(
    data: VendorProfileUpdate,
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(require_roles("vendor"))],
):
    vendor = _vendor(db, user)
    svc.update_vendor_profile(db, vendor, user, data)
    return svc.vendor_profile_detail(db, vendor, user)


@router.post("/guides", response_model=VendorGuideOut)
def create_guide(
    data: VendorGuideCreate,
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(require_roles("vendor"))],
):
    return svc.create_guide(db, _vendor(db, user), data)


@router.get("/guides", response_model=list[VendorGuideOut])
def list_guides(
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(require_roles("vendor"))],
):
    return svc.list_guides(db, _vendor(db, user))


@router.patch("/guides/{guide_id}", response_model=VendorGuideOut)
def update_guide(
    guide_id: str,
    data: VendorGuideUpdate,
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(require_roles("vendor"))],
):
    return svc.update_guide(db, _vendor(db, user), guide_id, data)


@router.get("/rooms", response_model=list[VendorRoomOut])
def list_rooms(
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(require_roles("vendor"))],
):
    return svc.list_vendor_rooms(db, _vendor(db, user))


@router.post("/rooms", response_model=VendorRoomOut)
def create_room(
    data: VendorRoomCreate,
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(require_roles("vendor"))],
):
    return svc.create_room(db, _vendor(db, user), data)


@router.patch("/rooms/{room_id}", response_model=VendorRoomOut)
def update_room(
    room_id: str,
    data: VendorRoomUpdate,
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(require_roles("vendor"))],
):
    return svc.update_room(db, _vendor(db, user), room_id, data)


@router.get("/rooms/{room_id}/calendar", response_model=RoomCalendarOut)
def get_calendar(
    room_id: str,
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(require_roles("vendor"))],
    start: str | None = None,
    days: int = Query(14, ge=1, le=31),
):
    start_date = start or date.today().isoformat()
    return svc.room_calendar(db, _vendor(db, user), room_id, start_date, days)


@router.post("/rooms/{room_id}/calendar/toggle", response_model=RoomCalendarOut)
def toggle_calendar(
    room_id: str,
    data: CalendarToggleRequest,
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(require_roles("vendor"))],
    days: int = Query(14, ge=1, le=31),
):
    svc.toggle_room_block(db, _vendor(db, user), room_id, data.date, data.blocked)
    return svc.room_calendar(db, _vendor(db, user), room_id, data.date, days)


@router.get("/season-pricing", response_model=list[SeasonRuleOut])
def get_season_pricing(
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(require_roles("vendor"))],
):
    return svc.list_season_rules(db, _vendor(db, user))


@router.put("/season-pricing", response_model=list[SeasonPricingPreview])
def put_season_pricing(
    data: SeasonPricingUpdate,
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(require_roles("vendor"))],
):
    return svc.update_season_rules(db, _vendor(db, user), data.rules)


@router.get("/vehicles", response_model=list[VendorVehicleOut])
def list_vehicles(
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(require_roles("vendor"))],
):
    return svc.list_vehicles(db, _vendor(db, user))


@router.post("/vehicles", response_model=VendorVehicleOut)
def create_vehicle(
    data: VendorVehicleCreate,
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(require_roles("vendor"))],
):
    return svc.create_vehicle(db, _vendor(db, user), data)


@router.patch("/vehicles/{vehicle_id}", response_model=VendorVehicleOut)
def update_vehicle(
    vehicle_id: str,
    data: VendorVehicleUpdate,
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(require_roles("vendor"))],
):
    return svc.update_vehicle(db, _vendor(db, user), vehicle_id, data)


@router.get("/tariffs", response_model=list[RouteTariffOut])
def list_tariffs(
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(require_roles("vendor"))],
):
    return svc.list_tariffs(db, _vendor(db, user))


@router.post("/tariffs", response_model=RouteTariffOut)
def create_tariff(
    data: RouteTariffCreate,
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(require_roles("vendor"))],
):
    return svc.create_tariff(db, _vendor(db, user), data)


@router.patch("/tariffs/{tariff_id}", response_model=RouteTariffOut)
def update_tariff(
    tariff_id: str,
    data: RouteTariffUpdate,
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(require_roles("vendor"))],
):
    return svc.update_tariff(db, _vendor(db, user), tariff_id, data)


@router.delete("/tariffs/{tariff_id}")
def delete_tariff(
    tariff_id: str,
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(require_roles("vendor"))],
):
    svc.delete_tariff(db, _vendor(db, user), tariff_id)
    return {"ok": True}


@router.get("/drivers", response_model=list[FleetDriverOut])
def list_drivers(
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(require_roles("vendor"))],
):
    return svc.list_fleet_drivers(db, _vendor(db, user))


@router.post("/drivers", response_model=FleetDriverOut)
def create_driver(
    data: FleetDriverCreate,
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(require_roles("vendor"))],
):
    return svc.create_fleet_driver(db, _vendor(db, user), data)


@router.patch("/drivers/{driver_id}", response_model=FleetDriverOut)
def update_driver(
    driver_id: str,
    data: FleetDriverUpdate,
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(require_roles("vendor"))],
):
    return svc.update_fleet_driver(db, _vendor(db, user), driver_id, data)


@router.post("/uploads", response_model=UploadResponse)
async def upload_image(
    user: Annotated[User, Depends(require_roles("vendor"))],
    file: UploadFile = File(...),
):
    url = await svc.save_upload(file)
    return UploadResponse(url=url)


def _kyc_out(vendor, kyc) -> KycOut:
    if not kyc:
        return KycOut(vendor_id=vendor.id, status=vendor.kyc_status or "none")
    return KycOut(
        id=kyc.id,
        vendor_id=kyc.vendor_id,
        cnic=kyc.cnic,
        cnic_name=kyc.cnic_name,
        account_title=kyc.account_title,
        payout_method=kyc.payout_method,
        account_number=kyc.account_number,
        cnic_front_url=kyc.cnic_front_url,
        cnic_back_url=kyc.cnic_back_url,
        license_url=kyc.license_url,
        insurance_url=kyc.insurance_url,
        title_match_ok=kyc.title_match_ok,
        cnic_match_ok=kyc.cnic_match_ok,
        penny_verified=kyc.penny_verified,
        status=kyc.status,
        admin_notes=kyc.admin_notes,
        submitted_at=kyc.submitted_at,
    )


@router.get("/kyc", response_model=KycOut)
def get_vendor_kyc(
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(require_roles("vendor"))],
):
    vendor = _vendor(db, user)
    return _kyc_out(vendor, get_kyc(db, vendor.id))


@router.put("/kyc", response_model=KycOut)
def save_vendor_kyc(
    data: KycSubmitRequest,
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(require_roles("vendor"))],
):
    vendor = _vendor(db, user)
    kyc = upsert_kyc_draft(db, vendor, data.model_dump())
    return _kyc_out(vendor, kyc)


@router.post("/kyc/submit", response_model=KycOut)
def submit_vendor_kyc(
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(require_roles("vendor"))],
):
    vendor = _vendor(db, user)
    try:
        kyc = submit_kyc(db, vendor, user)
    except ValueError as e:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail=str(e))
    return _kyc_out(vendor, kyc)


@router.post("/kyc/penny-test", response_model=PennyTestResponse)
def penny_test(
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(require_roles("vendor"))],
):
    vendor = _vendor(db, user)
    try:
        kyc = initiate_penny_test(db, vendor)
    except ValueError as e:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail=str(e))
    return PennyTestResponse(
        message="1 PKR sandbox credit sent. Enter the 6-digit code shown below.",
        sandbox_code=kyc.penny_code or "",
    )


@router.post("/kyc/penny-verify", response_model=KycOut)
def penny_verify(
    data: PennyVerifyRequest,
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(require_roles("vendor"))],
):
    vendor = _vendor(db, user)
    try:
        kyc = verify_penny_test(db, vendor, data.code)
    except ValueError as e:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail=str(e))
    return _kyc_out(vendor, kyc)


@router.get("/wallet", response_model=WalletOut)
def vendor_wallet(
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(require_roles("vendor"))],
):
    vendor = _vendor(db, user)
    wallet = get_or_create_wallet(db, vendor.id)
    db.commit()
    return WalletOut(balance=wallet.balance, pending_balance=wallet.pending_balance, vendor_id=vendor.id)


@router.post("/trips/complete")
def vendor_complete_trip(
    data: TripCompleteRequest,
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(require_roles("vendor"))],
):
    from app.models.booking_schemas import EscrowOut
    from app.services.escrow import complete_trip
    from fastapi import HTTPException

    try:
        escrow = complete_trip(db, token=data.token, lat=data.lat, lng=data.lng)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return EscrowOut.model_validate(escrow)


@router.get("/trips/pending", response_model=list[VendorPendingTripOut])
def vendor_pending_trips(
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(require_roles("vendor"))],
):
    from app.db.models import Booking, EscrowEntry, Property, Room, Vehicle
    from app.services.escrow import create_completion_token

    vendor = _vendor(db, user)
    prop_ids = [p.id for p in db.query(Property).filter(Property.vendor_id == vendor.id).all()]
    room_ids = [r.id for r in db.query(Room).filter(Room.property_id.in_(prop_ids)).all()] if prop_ids else []
    vehicle_ids = [v.id for v in db.query(Vehicle).filter(Vehicle.vendor_id == vendor.id).all()]

    bookings = (
        db.query(Booking)
        .join(EscrowEntry, EscrowEntry.booking_id == Booking.id)
        .filter(
            Booking.status == "confirmed",
            EscrowEntry.status.in_(["held", "pending"]),
        )
        .order_by(Booking.check_in.asc())
        .all()
    )
    out = []
    for b in bookings:
        if b.room_id not in room_ids and b.vehicle_id not in vehicle_ids:
            continue
        escrow = db.query(EscrowEntry).filter(EscrowEntry.booking_id == b.id).first()
        out.append(
            VendorPendingTripOut(
                reference=b.reference,
                destination=b.destination,
                traveler_name=b.traveler_name,
                check_in=b.check_in,
                nights=b.nights,
                escrow_status=escrow.status if escrow else "unknown",
                completion_token=create_completion_token(b.id, b.reference),
            )
        )
    return out


@router.post("/boost", response_model=VendorBoostOut)
def vendor_boost_listing(
    data: VendorBoostRequest,
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(require_roles("vendor"))],
):
    from app.services.community import set_vendor_featured
    from fastapi import HTTPException

    vendor = _vendor(db, user)
    wallet = get_or_create_wallet(db, vendor.id)
    cost = data.days * 500
    if wallet.balance < cost:
        raise HTTPException(status_code=400, detail=f"Insufficient wallet balance (need Rs. {cost:,})")
    wallet.balance -= cost
    set_vendor_featured(db, vendor, days=data.days)
    db.refresh(vendor)
    return VendorBoostOut(
        featured=vendor.is_featured,
        featured_until=vendor.featured_until,
        message=f"Featured for {data.days} days (−Rs. {cost:,} from wallet)",
    )
