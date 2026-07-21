import random
import string
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.db.models import User, Vendor, VendorKyc
from app.services.wallet import normalize_name


def mock_title_fetch(payout_method: str, account_number: str, account_title: str) -> dict:
    """Sandbox title lookup — production replaces with JazzCash/EasyPaisa API."""
    digits = account_number.replace("-", "").replace(" ", "")[-4:]
    fetched = account_title.strip()
    return {
        "payout_method": payout_method,
        "account_number": account_number,
        "fetched_title": fetched,
        "provider_ref": f"MOCK-{digits}-{random.randint(1000, 9999)}",
    }


def validate_kyc_fields(cnic_name: str, account_title: str) -> tuple[bool, bool]:
    title_match = normalize_name(cnic_name) == normalize_name(account_title)
    cnic_ok = len(cnic_name.strip()) >= 3
    return title_match, cnic_ok


def get_kyc(db: Session, vendor_id: str) -> VendorKyc | None:
    return db.query(VendorKyc).filter(VendorKyc.vendor_id == vendor_id).first()


def upsert_kyc_draft(db: Session, vendor: Vendor, data: dict) -> VendorKyc:
    kyc = get_kyc(db, vendor.id)
    if not kyc:
        kyc = VendorKyc(vendor_id=vendor.id)
        db.add(kyc)
    fields = (
        "cnic", "cnic_name", "account_title", "payout_method", "account_number",
        "cnic_front_url", "cnic_back_url", "license_url", "insurance_url",
    )
    for key in fields:
        if data.get(key) is not None:
            setattr(kyc, key, data[key])
    kyc.status = "draft"
    vendor.kyc_status = "draft"
    db.commit()
    db.refresh(kyc)
    return kyc


def submit_kyc(db: Session, vendor: Vendor, user: User) -> VendorKyc:
    kyc = get_kyc(db, vendor.id)
    if not kyc:
        raise ValueError("Complete KYC form before submitting")
    if not kyc.cnic_front_url or not kyc.cnic_back_url:
        raise ValueError("CNIC front and back photos are required")

    title_lookup = mock_title_fetch(kyc.payout_method, kyc.account_number, kyc.account_title)
    title_match, cnic_match = validate_kyc_fields(kyc.cnic_name, kyc.account_title)
    kyc.title_match_ok = title_match and normalize_name(title_lookup["fetched_title"]) == normalize_name(kyc.account_title)
    kyc.cnic_match_ok = cnic_match and normalize_name(kyc.cnic_name) == normalize_name(user.full_name or kyc.cnic_name)

    kyc.status = "submitted"
    kyc.submitted_at = datetime.now(timezone.utc)
    vendor.kyc_status = "submitted"
    db.commit()
    db.refresh(kyc)
    return kyc


def initiate_penny_test(db: Session, vendor: Vendor) -> VendorKyc:
    kyc = get_kyc(db, vendor.id)
    if not kyc:
        raise ValueError("Submit KYC first")
    if not kyc.title_match_ok:
        raise ValueError("Title verification must pass before penny test")
    code = "".join(random.choices(string.digits, k=6))
    kyc.penny_code = code
    db.commit()
    db.refresh(kyc)
    return kyc


def verify_penny_test(db: Session, vendor: Vendor, code: str) -> VendorKyc:
    kyc = get_kyc(db, vendor.id)
    if not kyc or not kyc.penny_code:
        raise ValueError("Initiate penny test first")
    if code.strip() != kyc.penny_code:
        raise ValueError("Invalid verification code")
    kyc.penny_verified = True
    kyc.penny_code = None
    db.commit()
    db.refresh(kyc)
    return kyc


def review_kyc(
    db: Session,
    kyc_id: str,
    *,
    approved: bool,
    notes: str = "",
    physically_vetted: bool | None = None,
) -> VendorKyc:
    kyc = db.get(VendorKyc, kyc_id)
    if not kyc:
        raise ValueError("KYC not found")
    vendor = db.get(Vendor, kyc.vendor_id)
    kyc.status = "approved" if approved else "rejected"
    kyc.admin_notes = notes
    kyc.reviewed_at = datetime.now(timezone.utc)
    if vendor:
        vendor.kyc_status = kyc.status
        if approved and kyc.penny_verified and kyc.title_match_ok:
            vendor.status = "approved"
        if physically_vetted is not None:
            vendor.physically_vetted = physically_vetted
            vendor.gold_badge = physically_vetted
    db.commit()
    db.refresh(kyc)
    return kyc


def list_kyc_queue(db: Session, status: str | None = "submitted") -> list[VendorKyc]:
    q = db.query(VendorKyc).order_by(VendorKyc.submitted_at.desc())
    if status:
        q = q.filter(VendorKyc.status == status)
    return q.all()
