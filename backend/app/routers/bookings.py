import json
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.auth.security import get_optional_user
from app.db.models import Booking, User, Vendor, get_db
from app.models.booking_schemas import (
    BookingCreateRequest,
    BookingOut,
    EscrowOut,
    TimelineDay,
    VoucherVerifyResponse,
)
from app.models.kyc_schemas import CompletionTokenOut, TripCompleteRequest
from app.models.safety_schemas import ChatMessageOut, ChatPostRequest
from app.services.bookings import build_timeline, create_booking, verify_voucher_token
from app.services.escrow import complete_trip, create_completion_token
from app.services.chat import list_messages, post_message
from app.services.catalog import get_vehicle
from app.models.admin_schemas import DisputeCreateRequest, DisputeOut
from app.services.disputes import file_dispute

router = APIRouter(prefix="/api/bookings", tags=["bookings"])


def _escrow_out(db: Session, escrow) -> EscrowOut | None:
    if not escrow:
        return None
    splits = escrow.get_vendor_splits() if hasattr(escrow, "get_vendor_splits") else []
    return EscrowOut(
        status=escrow.status,
        amount=escrow.amount,
        platform_share=escrow.platform_share,
        vendor_share=escrow.vendor_share,
        release_at=escrow.release_at,
        release_scheduled_at=escrow.release_scheduled_at,
        completed_at=escrow.completed_at,
        geofence_flag=escrow.geofence_flag,
        dispute_reason=escrow.dispute_reason,
        paid_at=escrow.paid_at,
        vendor_splits=splits,
    )


def _booking_out(db: Session, booking: Booking) -> BookingOut:
    timeline = build_timeline(db, booking)
    escrow_out = _escrow_out(db, booking.escrow)
    vehicle = get_vehicle(db, booking.vehicle_id) if booking.vehicle_id else None
    driver_name = vehicle.driver_name if vehicle else None
    driver_phone = None
    if vehicle:
        vendor = db.get(Vendor, vehicle.vendor_id)
        if vendor:
            vuser = db.get(User, vendor.user_id)
            driver_phone = vuser.phone if vuser else None
    return BookingOut(
        id=booking.id,
        reference=booking.reference,
        traveler_name=booking.traveler_name,
        email=booking.email,
        phone=booking.phone,
        emergency_contact=booking.emergency_contact,
        blood_group=booking.blood_group,
        destination=booking.destination,
        stops=json.loads(getattr(booking, "stops_json", None) or "[]"),
        check_in=booking.check_in,
        nights=booking.nights,
        guests=booking.guests,
        room_id=booking.room_id,
        vehicle_id=booking.vehicle_id,
        subtotal=booking.subtotal,
        platform_fee=booking.platform_fee,
        total=booking.total,
        points_redeemed=getattr(booking, "points_redeemed", 0) or 0,
        points_discount=getattr(booking, "points_discount", 0) or 0,
        points_earned=getattr(booking, "points_earned", 0) or 0,
        status=booking.status,
        voucher_token=booking.voucher_token,
        line_items=json.loads(booking.line_items_json or "[]"),
        guide_ids=booking.get_guide_ids(),
        created_at=booking.created_at,
        driver_name=driver_name,
        driver_phone=driver_phone,
        escrow=escrow_out,
        timeline=[TimelineDay(**d) for d in timeline],
    )


@router.get("/verify/voucher", response_model=VoucherVerifyResponse)
def verify_voucher(token: str = Query(...), db: Annotated[Session, Depends(get_db)] = None):
    payload = verify_voucher_token(token)
    if not payload:
        return VoucherVerifyResponse(valid=False)
    booking = db.get(Booking, payload.get("bid"))
    if not booking or booking.reference != payload.get("ref"):
        return VoucherVerifyResponse(valid=False)
    return VoucherVerifyResponse(
        valid=True,
        reference=booking.reference,
        traveler_name=booking.traveler_name,
        destination=booking.destination,
        status=booking.status,
    )


@router.post("", response_model=BookingOut)
def create_booking_endpoint(
    data: BookingCreateRequest,
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User | None, Depends(get_optional_user)] = None,
):
    sp = data.safety_profile
    try:
        booking = create_booking(
            db,
            destination=data.destination,
            nights=data.nights,
            guests=data.guests,
            room_id=data.room_id,
            vehicle_id=data.vehicle_id,
            guide_ids=data.guide_ids,
            experience_ids=data.experience_ids,
            traveler_name=sp.traveler_name,
            email=sp.email,
            phone=sp.phone,
            emergency_contact=sp.emergency_contact,
            blood_group=sp.blood_group,
            check_in=data.check_in,
            user_id=user.id if user else None,
            redeem_points=data.redeem_points,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return _booking_out(db, booking)


@router.post("/{reference}/dispute", response_model=DisputeOut)
def file_booking_dispute(reference: str, data: DisputeCreateRequest, db: Annotated[Session, Depends(get_db)]):
    try:
        ticket = file_dispute(db, booking_reference=reference, filed_by=data.filed_by, reason=data.reason)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return DisputeOut.model_validate(ticket)


@router.get("/{reference}/chat", response_model=list[ChatMessageOut])
def get_chat(reference: str, db: Annotated[Session, Depends(get_db)]):
    booking = db.query(Booking).filter(Booking.reference == reference).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    return list_messages(db, reference)


@router.post("/{reference}/chat", response_model=ChatMessageOut)
def send_chat(reference: str, data: ChatPostRequest, db: Annotated[Session, Depends(get_db)]):
    booking = db.query(Booking).filter(Booking.reference == reference).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    return post_message(
        db,
        booking_reference=reference,
        sender_role=data.sender_role,
        sender_name=data.sender_name,
        body=data.body,
    )


@router.get("/{reference}/completion-token", response_model=CompletionTokenOut)
def get_completion_token(reference: str, db: Annotated[Session, Depends(get_db)]):
    booking = db.query(Booking).filter(Booking.reference == reference).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    token = create_completion_token(booking.id, booking.reference)
    return CompletionTokenOut(token=token, reference=booking.reference)


@router.post("/complete", response_model=EscrowOut)
def complete_trip_endpoint(data: TripCompleteRequest, db: Annotated[Session, Depends(get_db)]):
    try:
        escrow = complete_trip(db, token=data.token, lat=data.lat, lng=data.lng)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return EscrowOut.model_validate(escrow)


@router.get("/{reference}", response_model=BookingOut)
def get_booking(reference: str, db: Annotated[Session, Depends(get_db)]):
    booking = db.query(Booking).filter(Booking.reference == reference).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    return _booking_out(db, booking)


@router.get("/{reference}/timeline", response_model=list[TimelineDay])
def get_timeline(reference: str, db: Annotated[Session, Depends(get_db)]):
    booking = db.query(Booking).filter(Booking.reference == reference).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    return [TimelineDay(**d) for d in build_timeline(db, booking)]
