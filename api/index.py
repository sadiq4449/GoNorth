"""Vercel serverless entry for the BaltiTour FastAPI backend."""
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "backend"))

from app.db.models import SessionLocal, init_db
from app.seed import seed
from app.services.community import ensure_community_demo, ensure_featured_vendors
from app.services.escrow import process_due_escrows
from app.services.pools import ensure_demo_pools
from app.services.safety import ensure_default_advisories

init_db()
db = SessionLocal()
try:
    ensure_demo_pools(db)
    ensure_default_advisories(db)
    ensure_community_demo(db)
    ensure_featured_vendors(db)
    process_due_escrows(db)
finally:
    db.close()

seed()

from app.main import app  # noqa: E402,F401
