from app.db.models import Vendor
from app.models.schemas import VendorOut


def vendor_out(vendor: Vendor) -> VendorOut:
    return VendorOut.model_validate(vendor).model_copy(update={"featured": vendor.is_featured})
