from contextlib import asynccontextmanager
from pathlib import Path
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.db.models import SessionLocal, init_db
from app.services.community import ensure_community_demo, ensure_featured_vendors
from app.services.campaigns import ensure_default_campaigns
from app.services.experiences_seed import ensure_demo_experiences
from app.services.marketplace_packages import ensure_default_packages
from app.services.pools import ensure_demo_pools
from app.services.vehicle_categories import backfill_vehicle_categories
from app.services.vendor_slugs import backfill_vendor_slugs
from app.routers import admin, auth, bookings, campaigns, cart, community, health, listings, packages, payments, points, pools, recommend, safety, search, vendor_portal, vendors
from app.services.escrow import process_due_escrows
from app.services.safety import ensure_default_advisories


@asynccontextmanager
async def lifespan(app: FastAPI):
    from app.seed import seed

    init_db()
    db = SessionLocal()
    try:
        ensure_demo_pools(db)
        ensure_default_advisories(db)
        ensure_default_campaigns(db)
        ensure_default_packages(db)
        ensure_demo_experiences(db)
        backfill_vendor_slugs(db)
        ensure_community_demo(db)
        ensure_featured_vendors(db)
        backfill_vehicle_categories(db)
        process_due_escrows(db)
    finally:
        db.close()
    seed()
    db = SessionLocal()
    try:
        backfill_vendor_slugs(db)
    finally:
        db.close()
    yield


app = FastAPI(title="GoNorth API", version="1.0.0", lifespan=lifespan)

if settings.sentry_dsn:
    try:
        import sentry_sdk
        from sentry_sdk.integrations.fastapi import FastApiIntegration

        sentry_sdk.init(dsn=settings.sentry_dsn, integrations=[FastApiIntegration()], traces_sample_rate=0.1)
    except Exception:
        pass

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(recommend.router)
app.include_router(auth.router)
app.include_router(listings.router)
app.include_router(search.router)
app.include_router(cart.router)
app.include_router(payments.router)
app.include_router(points.router)
app.include_router(bookings.router)
app.include_router(safety.router)
app.include_router(campaigns.router)
app.include_router(packages.router)
app.include_router(community.router)
app.include_router(pools.router)
app.include_router(vendor_portal.router)
app.include_router(admin.router)
app.include_router(vendors.router)

uploads_dir = Path(os.environ.get("UPLOAD_DIR", str(Path(__file__).resolve().parents[1] / "uploads")))
uploads_dir.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(uploads_dir)), name="uploads")
