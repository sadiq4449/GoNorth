"""Demo Control Tower workflows — bookings, escrow states, KYC, disputes."""

from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.auth.security import hash_password
from app.db.models import Booking, DisputeTicket, Room, SmsVendorLead, User, Vehicle, Vendor, VendorKyc
from app.services.bookings import create_booking
from app.services.disputes import file_dispute
from app.services.escrow import payout_escrow
from app.services.vendor_slugs import ensure_unique_slug

DEMO_MARKER = "BT-2026-DEMO1"


def seed_admin_workflows(db: Session) -> None:
    if db.query(Booking).filter(Booking.reference == DEMO_MARKER).first():
        return

    room = db.query(Room).filter(Room.hidden.is_(False)).first()
    vehicle = db.query(Vehicle).filter(Vehicle.hidden.is_(False), Vehicle.is_4x4.is_(True)).first()
    if not room or not vehicle:
        return

    _seed_pending_vendor(db)
    _seed_kyc_queue(db)
    _seed_sms_lead(db)
    _seed_bookings_and_escrow(db, room.id, vehicle.id)


def _seed_pending_vendor(db: Session) -> None:
    if db.query(User).filter(User.email == "pending@skardu.com").first():
        return
    user = User(
        email="pending@skardu.com",
        password_hash=hash_password("vendor123"),
        full_name="New Balti Lodge",
        role="vendor",
    )
    db.add(user)
    db.flush()
    db.add(
        Vendor(
            user_id=user.id,
            business_name="New Balti Lodge (Pending)",
            slug=ensure_unique_slug(db, "New Balti Lodge Pending"),
            vendor_type="hotel",
            valley="Skardu",
            status="pending",
        )
    )
    db.commit()


def _seed_kyc_queue(db: Session) -> None:
    vendor = db.query(Vendor).filter(Vendor.business_name == "Murad Mountain Transport").first()
    if not vendor or db.query(VendorKyc).filter(VendorKyc.vendor_id == vendor.id).first():
        return
    now = datetime.now(timezone.utc)
    kyc = VendorKyc(
        vendor_id=vendor.id,
        cnic="35202-1234567-1",
        cnic_name="Ali Murad",
        account_title="Ali Murad",
        payout_method="jazzcash",
        account_number="03001234567",
        cnic_front_url="/uploads/demo/cnic-front.jpg",
        cnic_back_url="/uploads/demo/cnic-back.jpg",
        insurance_url="/uploads/demo/insurance.pdf",
        title_match_ok=True,
        cnic_match_ok=True,
        penny_verified=True,
        status="submitted",
        submitted_at=now,
    )
    db.add(kyc)
    vendor.kyc_status = "submitted"
    db.commit()


def _seed_sms_lead(db: Session) -> None:
    if db.query(SmsVendorLead).first():
        return
    db.add(
        SmsVendorLead(
            phone="+923001112233",
            raw_message="REG HOTEL Deosai View Guest House",
            parsed_type="hotel",
            business_name="Deosai View Guest House",
            status="placeholder",
        )
    )
    db.commit()


def _seed_bookings_and_escrow(db: Session, room_id: str, vehicle_id: str) -> None:
    now = datetime.now(timezone.utc)
    common = dict(
        destination="Skardu",
        nights=3,
        guests=2,
        room_id=room_id,
        vehicle_id=vehicle_id,
        traveler_name="Demo Traveler",
        email="demo.traveler@example.com",
        phone="+923009998877",
        emergency_contact="+923008887766",
        blood_group="O+",
        check_in="2026-08-01",
    )

    held = create_booking(db, **common, escrow_status="held")
    held.reference = DEMO_MARKER
    db.commit()

    release = create_booking(
        db,
        **{**common, "traveler_name": "Release Scheduled Guest", "email": "release@example.com"},
        escrow_status="held",
    )
    release.reference = "BT-2026-DEMO2"
    db.flush()
    escrow = release.escrow
    escrow.status = "release_scheduled"
    escrow.completed_at = now
    escrow.release_scheduled_at = now
    escrow.release_at = now + timedelta(hours=6)
    escrow.geofence_flag = True
    db.commit()

    disputed = create_booking(
        db,
        **{**common, "traveler_name": "Dispute Guest", "email": "dispute@example.com"},
        escrow_status="held",
    )
    disputed.reference = "BT-2026-DEMO3"
    db.commit()
    file_dispute(
        db,
        booking_reference="BT-2026-DEMO3",
        filed_by="dispute@example.com",
        reason="Vehicle did not arrive at agreed pickup point.",
    )

    paid = create_booking(
        db,
        **{**common, "traveler_name": "Completed Guest", "email": "paid@example.com", "booking_status": "completed"},
        escrow_status="held",
    )
    paid.reference = "BT-2026-DEMO4"
    db.flush()
    payout_escrow(db, paid.escrow, paid)
