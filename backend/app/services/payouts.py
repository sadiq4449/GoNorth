import random
import string

from sqlalchemy.orm import Session

from app.db.models import PayoutBatch, PayoutBatchItem, Vendor, VendorKyc, VendorWallet
from app.services.local_wallets import mock_disbursement_ref


def _batch_ref() -> str:
    return "PB-" + "".join(random.choices(string.digits, k=6))


def run_vendor_payout_batch(db: Session, *, method: str = "ibft", min_balance: int = 1000) -> PayoutBatch:
    wallets = (
        db.query(VendorWallet)
        .filter(VendorWallet.balance >= min_balance)
        .all()
    )
    batch = PayoutBatch(status="completed", method=method, notes=f"Batch {_batch_ref()}")
    db.add(batch)
    db.flush()

    total = 0
    count = 0
    for wallet in wallets:
        vendor = db.get(Vendor, wallet.vendor_id)
        if not vendor or vendor.status != "approved":
            continue
        kyc = db.query(VendorKyc).filter(VendorKyc.vendor_id == vendor.id, VendorKyc.status == "approved").first()
        if not kyc:
            continue

        amount = wallet.balance
        if amount <= 0:
            continue

        payout_method = kyc.payout_method if kyc.payout_method in ("jazzcash", "easypaisa") else "ibft"
        ext_ref = mock_disbursement_ref(vendor.id, payout_method)

        db.add(
            PayoutBatchItem(
                batch_id=batch.id,
                vendor_id=vendor.id,
                amount=amount,
                payout_method=payout_method,
                account_number=kyc.account_number,
                status="sent",
                external_ref=ext_ref,
            )
        )
        wallet.balance = 0
        total += amount
        count += 1

    batch.total_amount = total
    batch.vendor_count = count
    db.commit()
    db.refresh(batch)
    return batch


def list_payout_batches(db: Session, limit: int = 20) -> list[PayoutBatch]:
    return db.query(PayoutBatch).order_by(PayoutBatch.created_at.desc()).limit(limit).all()
