from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.auth.security import require_roles
from app.db.models import Booking, User, Vendor, get_db
from app.models.kyc_schemas import EscrowAdminOut, KycOut, KycReviewRequest
from app.models.campaign_schemas import PromoCampaignOut, PromoCampaignUpsert
from app.models.safety_schemas import AdvisoryOut, AdvisoryUpsertRequest, SosOut
from app.services.campaigns import list_all_campaigns, upsert_campaign
from app.services.safety import list_advisories, list_sos_alerts, upsert_advisory
from app.config import settings
from app.models.admin_schemas import (
    AdminPackageOut,
    AuditLogOut,
    BookingAdminUpdate,
    DisputeOut,
    PlatformReportsOut,
    PlatformSettingsOut,
    PlatformSettingsUpdate,
    PricingOverrideOut,
    PricingOverrideUpsert,
)
from app.models.community_schemas import AdminVendorCreate, FleetTripOut
from app.models.payment_schemas import PayoutBatchOut
from app.models.schemas import VendorOut
from app.services.vendor_helpers import vendor_out
from app.models.booking_schemas import BookingOut
from app.services.admin_tools import get_active_overrides, log_audit, upsert_override
from app.services.disputes import list_disputes
from app.services.payouts import list_payout_batches, run_vendor_payout_batch
from app.services.escrow import dispute_escrow, force_payout_escrow, list_escrows, payout_escrow, process_due_escrows, resolve_dispute
from app.services.platform_settings import load_platform_config, update_platform_config
from app.services.kyc import list_kyc_queue, review_kyc

router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.get("/reports", response_model=PlatformReportsOut)
def admin_reports(
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(require_roles("admin"))],
):
    from app.db.models import DisputeTicket, EscrowEntry, Guide, Property, Room, TourPackage, Vehicle

    vendors = db.query(Vendor).all()
    bookings = db.query(Booking).all()
    escrows = db.query(EscrowEntry).all()
    disputes = db.query(DisputeTicket).filter(DisputeTicket.status == "open").count()
    kyc_pending = len(list_kyc_queue(db, "submitted"))
    packages = db.query(TourPackage).all()
    rooms_live = db.query(Room).join(Property).filter(Room.hidden.is_(False)).count()
    vehicles_live = db.query(Vehicle).filter(Vehicle.hidden.is_(False)).count()
    guides_live = db.query(Guide).count()
    platform_rev = sum(e.platform_share for e in escrows if e.status == "paid")
    vendor_rev = sum(e.vendor_share for e in escrows if e.status == "paid")

    return PlatformReportsOut(
        vendors_total=len(vendors),
        vendors_pending=sum(1 for v in vendors if v.status == "pending"),
        vendors_approved=sum(1 for v in vendors if v.status == "approved"),
        vendors_suspended=sum(1 for v in vendors if v.status == "suspended"),
        bookings_total=len(bookings),
        bookings_confirmed=sum(1 for b in bookings if b.status == "confirmed"),
        escrow_held=sum(1 for e in escrows if e.status in {"pending", "held", "release_scheduled", "disputed"}),
        escrow_paid=sum(1 for e in escrows if e.status == "paid"),
        disputes_open=disputes,
        kyc_pending=kyc_pending,
        packages_active=sum(1 for p in packages if p.active),
        packages_inactive=sum(1 for p in packages if not p.active),
        rooms_live=rooms_live,
        vehicles_live=vehicles_live,
        guides_live=guides_live,
        revenue_platform=platform_rev,
        revenue_vendor=vendor_rev,
    )


@router.get("/settings", response_model=PlatformSettingsOut)
def admin_settings(
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(require_roles("admin"))],
):
    load_platform_config(db)
    return PlatformSettingsOut(
        ai_configured=settings.ai_configured,
        ai_model=settings.openrouter_model,
        advisory_live_weather=settings.advisory_live_weather,
        advisory_ndma_sync=settings.advisory_ndma_sync,
        advisory_seasonal_rules=settings.advisory_seasonal_rules,
        allow_direct_booking=settings.allow_direct_booking,
        usd_pkr_rate=settings.usd_pkr_rate,
        sms_configured=bool(settings.sms_api_url and settings.sms_api_key),
        stripe_configured=bool(settings.stripe_secret_key),
    )


@router.patch("/settings", response_model=PlatformSettingsOut)
def admin_update_settings(
    data: PlatformSettingsUpdate,
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(require_roles("admin"))],
):
    changes = {}
    for field in (
        "advisory_live_weather",
        "advisory_ndma_sync",
        "advisory_seasonal_rules",
        "allow_direct_booking",
        "usd_pkr_rate",
    ):
        val = getattr(data, field)
        if val is not None:
            changes[field] = val
    if changes:
        update_platform_config(db, changes)
        log_audit(db, admin_user_id=user.id, action="settings_update", entity_type="platform", entity_id="settings", details=changes)
    return admin_settings(db, user)


@router.get("/packages", response_model=list[AdminPackageOut])
def admin_list_packages(
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(require_roles("admin"))],
):
    from app.db.models import TourPackage

    rows = db.query(TourPackage).order_by(TourPackage.sort_order, TourPackage.title).all()
    out = []
    for pkg in rows:
        vendor = db.get(Vendor, pkg.vendor_id) if pkg.vendor_id else None
        out.append(
            AdminPackageOut(
                id=pkg.id,
                slug=pkg.slug,
                title=pkg.title,
                destination=pkg.destination,
                vendor_name=vendor.business_name if vendor else "GoNorth Curated",
                active=pkg.active,
                featured=pkg.featured,
                starting_price=pkg.starting_price,
                bookable=bool(pkg.room_id and pkg.vehicle_id),
            )
        )
    return out


@router.patch("/packages/{package_id}", response_model=AdminPackageOut)
def admin_update_package(
    package_id: str,
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(require_roles("admin"))],
    active: bool | None = Query(None),
    featured: bool | None = Query(None),
):
    from app.db.models import TourPackage

    pkg = db.get(TourPackage, package_id)
    if not pkg:
        raise HTTPException(status_code=404, detail="Package not found")
    changes = {}
    if active is not None:
        pkg.active = active
        changes["active"] = active
    if featured is not None:
        pkg.featured = featured
        changes["featured"] = featured
    db.commit()
    db.refresh(pkg)
    vendor = db.get(Vendor, pkg.vendor_id) if pkg.vendor_id else None
    log_audit(db, admin_user_id=user.id, action="package_update", entity_type="package", entity_id=pkg.id, details=changes)
    return AdminPackageOut(
        id=pkg.id,
        slug=pkg.slug,
        title=pkg.title,
        destination=pkg.destination,
        vendor_name=vendor.business_name if vendor else "GoNorth Curated",
        active=pkg.active,
        featured=pkg.featured,
        starting_price=pkg.starting_price,
        bookable=bool(pkg.room_id and pkg.vehicle_id),
    )


def _kyc_out(kyc) -> KycOut:
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


def _escrow_out(db: Session, escrow) -> EscrowAdminOut:
    booking = db.get(Booking, escrow.booking_id)
    return EscrowAdminOut(
        id=escrow.id,
        booking_reference=booking.reference if booking else "",
        destination=booking.destination if booking else "",
        traveler_name=booking.traveler_name if booking else "",
        amount=escrow.amount,
        platform_share=escrow.platform_share,
        vendor_share=escrow.vendor_share,
        status=escrow.status,
        release_at=escrow.release_at,
        completed_at=escrow.completed_at,
        geofence_flag=escrow.geofence_flag,
        dispute_reason=escrow.dispute_reason,
    )


@router.get("/kyc", response_model=list[KycOut])
def kyc_queue(
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(require_roles("admin"))],
    status: str = Query("submitted"),
):
    return [_kyc_out(k) for k in list_kyc_queue(db, status)]


@router.post("/kyc/{kyc_id}/review", response_model=KycOut)
def review_kyc_endpoint(
    kyc_id: str,
    data: KycReviewRequest,
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(require_roles("admin"))],
):
    try:
        kyc = review_kyc(
            db,
            kyc_id,
            approved=data.approved,
            notes=data.notes,
            physically_vetted=data.physically_vetted,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    log_audit(
        db,
        admin_user_id=user.id,
        action="kyc_review",
        entity_type="kyc",
        entity_id=kyc_id,
        details={"approved": data.approved, "notes": data.notes},
    )
    return _kyc_out(kyc)


@router.get("/escrow", response_model=list[EscrowAdminOut])
def escrow_list(
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(require_roles("admin"))],
    status: str | None = None,
):
    return [_escrow_out(db, e) for e in list_escrows(db, status)]


@router.post("/escrow/process-due")
def process_due(
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(require_roles("admin"))],
):
    count = process_due_escrows(db)
    log_audit(db, admin_user_id=user.id, action="escrow_process_due", entity_type="escrow", entity_id="batch", details={"processed": count})
    return {"processed": count}


@router.post("/escrow/{escrow_id}/dispute", response_model=EscrowAdminOut)
def escrow_dispute(
    escrow_id: str,
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(require_roles("admin"))],
    reason: str = Query("Admin dispute"),
):
    try:
        escrow = dispute_escrow(db, escrow_id, reason)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    log_audit(db, admin_user_id=user.id, action="escrow_dispute", entity_type="escrow", entity_id=escrow_id, details={"reason": reason})
    return _escrow_out(db, escrow)


@router.post("/escrow/{escrow_id}/resolve", response_model=EscrowAdminOut)
def escrow_resolve(
    escrow_id: str,
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(require_roles("admin"))],
    action: str = Query(..., pattern="^(release|refund_hold)$"),
):
    try:
        escrow = resolve_dispute(db, escrow_id, action)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    log_audit(db, admin_user_id=user.id, action="escrow_resolve", entity_type="escrow", entity_id=escrow_id, details={"action": action})
    return _escrow_out(db, escrow)


@router.post("/escrow/{escrow_id}/force-payout", response_model=EscrowAdminOut)
def force_payout(
    escrow_id: str,
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(require_roles("admin"))],
    override_geofence: bool = Query(False),
):
    try:
        escrow = force_payout_escrow(db, escrow_id, override_geofence=override_geofence)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    log_audit(
        db,
        admin_user_id=user.id,
        action="escrow_force_payout",
        entity_type="escrow",
        entity_id=escrow_id,
        details={"override_geofence": override_geofence},
    )
    return _escrow_out(db, escrow)


@router.patch("/vendors/{vendor_id}/physical-vet", response_model=VendorOut)
def physical_vet(
    vendor_id: str,
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(require_roles("admin"))],
    vetted: bool = Query(True),
):
    vendor = db.get(Vendor, vendor_id)
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    vendor.physically_vetted = vetted
    vendor.gold_badge = vetted
    db.commit()
    db.refresh(vendor)
    log_audit(
        db,
        admin_user_id=user.id,
        action="vendor_physical_vet",
        entity_type="vendor",
        entity_id=vendor_id,
        details={"vetted": vetted},
    )
    return vendor_out(vendor)


@router.get("/advisories", response_model=list[AdvisoryOut])
def admin_list_advisories(
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(require_roles("admin"))],
):
    from app.db.models import RoadAdvisory
    rows = db.query(RoadAdvisory).order_by(RoadAdvisory.region).all()
    return rows


@router.put("/advisories", response_model=AdvisoryOut)
def admin_upsert_advisory(
    data: AdvisoryUpsertRequest,
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(require_roles("admin"))],
):
    row = upsert_advisory(
        db,
        region=data.region,
        message=data.message,
        severity=data.severity,
        active=data.active,
        admin_override=data.admin_override,
    )
    log_audit(
        db,
        admin_user_id=user.id,
        action="advisory_upsert",
        entity_type="advisory",
        entity_id=row.id,
        details={"region": data.region, "severity": data.severity, "active": data.active},
    )
    return row


@router.get("/sos", response_model=list[SosOut])
def admin_sos_log(
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(require_roles("admin"))],
):
    return [
        SosOut(
            id=a.id,
            status=a.status,
            sms_sent=a.sms_sent,
            message=a.message,
            created_at=a.created_at,
        )
        for a in list_sos_alerts(db)
    ]


@router.get("/pricing", response_model=list[PricingOverrideOut])
def list_pricing(db: Annotated[Session, Depends(get_db)], user: Annotated[User, Depends(require_roles("admin"))]):
    from app.db.models import PricingOverride
    return db.query(PricingOverride).order_by(PricingOverride.category).all()


@router.put("/pricing", response_model=PricingOverrideOut)
def set_pricing(
    data: PricingOverrideUpsert,
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(require_roles("admin"))],
):
    row = upsert_override(
        db,
        label=data.label,
        category=data.category,
        fixed_rate=data.fixed_rate,
        surge_multiplier=data.surge_multiplier,
        active=data.active,
    )
    log_audit(db, admin_user_id=user.id, action="pricing_override", entity_type="pricing", entity_id=row.id, details=data.model_dump())
    return row


@router.get("/bookings", response_model=list[BookingOut])
def admin_list_bookings(
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(require_roles("admin"))],
    q: str | None = Query(None),
):
    from app.routers.bookings import _booking_out
    query = db.query(Booking).order_by(Booking.created_at.desc())
    if q:
        query = query.filter(Booking.reference.ilike(f"%{q}%"))
    return [_booking_out(db, b) for b in query.limit(50).all()]


@router.patch("/bookings/{reference}", response_model=BookingOut)
def admin_update_booking(
    reference: str,
    data: BookingAdminUpdate,
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(require_roles("admin"))],
):
    from app.routers.bookings import _booking_out
    booking = db.query(Booking).filter(Booking.reference == reference).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    changes = {}
    for field in (
        "destination",
        "nights",
        "guests",
        "status",
        "traveler_name",
        "phone",
        "email",
        "check_in",
        "room_id",
        "vehicle_id",
    ):
        val = getattr(data, field)
        if val is not None:
            if field == "room_id":
                from app.db.models import Room
                if not db.get(Room, val):
                    raise HTTPException(status_code=400, detail="Room not found")
            if field == "vehicle_id":
                from app.db.models import Vehicle
                if not db.get(Vehicle, val):
                    raise HTTPException(status_code=400, detail="Vehicle not found")
            changes[field] = val if field != "email" else str(val)
            setattr(booking, field, val if field != "email" else str(val))
    db.commit()
    db.refresh(booking)
    log_audit(db, admin_user_id=user.id, action="booking_edit", entity_type="booking", entity_id=reference, details=changes)
    return _booking_out(db, booking)


@router.get("/audit-log", response_model=list[AuditLogOut])
def audit_log(db: Annotated[Session, Depends(get_db)], user: Annotated[User, Depends(require_roles("admin"))]):
    from app.db.models import AuditLog
    import json
    rows = db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(100).all()
    return [
        AuditLogOut(
            id=r.id,
            action=r.action,
            entity_type=r.entity_type,
            entity_id=r.entity_id,
            details=json.loads(r.details_json or "{}"),
            created_at=r.created_at,
        )
        for r in rows
    ]


@router.get("/disputes", response_model=list[DisputeOut])
def admin_disputes(
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(require_roles("admin"))],
    status: str | None = Query(None),
):
    return [DisputeOut.model_validate(d) for d in list_disputes(db, status)]


@router.post("/disputes/{ticket_id}/resolve")
def resolve_dispute_ticket(
    ticket_id: str,
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(require_roles("admin"))],
    action: str = Query("release", pattern="^(release|dismiss)$"),
):
    from app.db.models import DisputeTicket, EscrowEntry
    from app.services.escrow import resolve_dispute as resolve_escrow

    ticket = db.get(DisputeTicket, ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Dispute not found")
    if action == "release":
        resolve_escrow(db, ticket.escrow_id, "release")
        ticket.status = "resolved"
    else:
        escrow = db.get(EscrowEntry, ticket.escrow_id)
        if escrow and escrow.status == "disputed":
            resolve_escrow(db, ticket.escrow_id, "refund_hold")
        ticket.status = "dismissed"
    db.commit()
    log_audit(db, admin_user_id=user.id, action=f"dispute_{action}", entity_type="dispute", entity_id=ticket_id, details={"reference": ticket.booking_reference})
    return {"ok": True}


@router.get("/payouts", response_model=list[PayoutBatchOut])
def admin_payouts(db: Annotated[Session, Depends(get_db)], user: Annotated[User, Depends(require_roles("admin"))]):
    return list_payout_batches(db)


@router.post("/payouts/run", response_model=PayoutBatchOut)
def admin_run_payouts(db: Annotated[Session, Depends(get_db)], user: Annotated[User, Depends(require_roles("admin"))]):
    batch = run_vendor_payout_batch(db)
    log_audit(
        db,
        admin_user_id=user.id,
        action="payout_batch",
        entity_type="payout",
        entity_id=batch.id,
        details={"total": batch.total_amount, "vendors": batch.vendor_count},
    )
    return batch


@router.get("/fleet/active", response_model=list[FleetTripOut])
def fleet_active(db: Annotated[Session, Depends(get_db)], user: Annotated[User, Depends(require_roles("admin"))]):
    from app.services.catalog import get_vehicle
    from app.services.wallet import destination_coords

    rows = db.query(Booking).filter(Booking.status == "confirmed").order_by(Booking.created_at.desc()).limit(50).all()
    out = []
    for b in rows:
        vehicle = get_vehicle(db, b.vehicle_id)
        coords = destination_coords(b.destination) or (35.297, 75.633)
        out.append(
            FleetTripOut(
                reference=b.reference,
                destination=b.destination,
                traveler_name=b.traveler_name,
                driver_name=vehicle.driver_name if vehicle else None,
                status=b.status,
                lat=coords[0],
                lng=coords[1],
                last_ping=b.created_at,
            )
        )
    return out


@router.post("/vendors/create", response_model=VendorOut)
def admin_create_vendor(
    data: AdminVendorCreate,
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(require_roles("admin"))],
):
    from app.auth.security import hash_password
    from app.db.models import User as UserModel

    if db.query(UserModel).filter(UserModel.email == data.email.lower()).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    u = UserModel(
        email=data.email.lower(),
        password_hash=hash_password(data.password),
        full_name=data.full_name,
        role="vendor",
    )
    db.add(u)
    db.flush()
    vendor = Vendor(
        user_id=u.id,
        business_name=data.business_name,
        vendor_type=data.vendor_type,
        valley=data.valley,
        status="approved",
    )
    db.add(vendor)
    db.commit()
    db.refresh(vendor)
    log_audit(db, admin_user_id=user.id, action="vendor_create", entity_type="vendor", entity_id=vendor.id, details={"email": data.email})
    return vendor_out(vendor)


@router.get("/registry")
def admin_registry(
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(require_roles("admin"))],
):
    from app.db.models import Property, Room, Vehicle

    rows = []
    for room in db.query(Room).join(Property).order_by(Room.name).limit(200).all():
        prop = db.get(Property, room.property_id)
        vendor = db.get(Vendor, prop.vendor_id) if prop else None
        rows.append(
            {
                "type": "room",
                "id": room.id,
                "label": room.name,
                "vendor_name": vendor.business_name if vendor else "",
                "valley": prop.valley if prop else "",
                "hidden": room.hidden,
            }
        )
    for vehicle in db.query(Vehicle).order_by(Vehicle.model).limit(200).all():
        vendor = db.get(Vendor, vehicle.vendor_id)
        rows.append(
            {
                "type": "vehicle",
                "id": vehicle.id,
                "label": vehicle.model,
                "vendor_name": vendor.business_name if vendor else "",
                "valley": vendor.valley if vendor else "",
                "hidden": vehicle.hidden,
            }
        )
    return rows


@router.delete("/rooms/{room_id}")
def admin_delete_room(
    room_id: str,
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(require_roles("admin"))],
):
    from app.db.models import Room

    room = db.get(Room, room_id)
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    room.hidden = True
    db.commit()
    log_audit(db, admin_user_id=user.id, action="room_hide", entity_type="room", entity_id=room_id, details={})
    return {"ok": True}


@router.delete("/vehicles/{vehicle_id}")
def admin_delete_vehicle(
    vehicle_id: str,
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(require_roles("admin"))],
):
    from app.db.models import Vehicle

    vehicle = db.get(Vehicle, vehicle_id)
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    vehicle.hidden = True
    db.commit()
    log_audit(db, admin_user_id=user.id, action="vehicle_hide", entity_type="vehicle", entity_id=vehicle_id, details={})
    return {"ok": True}


@router.get("/campaigns", response_model=list[PromoCampaignOut])
def admin_list_campaigns(
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(require_roles("admin"))],
):
    return list_all_campaigns(db)


@router.put("/campaigns", response_model=PromoCampaignOut)
def admin_upsert_campaign(
    data: PromoCampaignUpsert,
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(require_roles("admin"))],
):
    try:
        row = upsert_campaign(db, data.model_dump())
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    log_audit(
        db,
        admin_user_id=user.id,
        action="campaign_upsert",
        entity_type="campaign",
        entity_id=row.id,
        details={"title": row.title, "active": row.active},
    )
    return row
