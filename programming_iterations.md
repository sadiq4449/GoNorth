# BaltiTour — Programming Iterations (Locked Plan)

**Date:** July 16, 2026  
**Stack:** **React (Vite)** + **Python (FastAPI)** + **Supabase**  
**Platform:** Web only (no Flutter, no mobile app in MVP)

---

## Locked Product Decisions

| Decision | Choice |
| :--- | :--- |
| **Platform** | Web only — responsive PWA for mobile browsers |
| **Frontend** | React 18 + Vite + React Router |
| **Backend** | FastAPI + Python 3.11+ |
| **Database** | Supabase PostgreSQL + Auth + Storage + Realtime |
| **Local payments** | JazzCash + EasyPaisa (PKR, CNIC-verified wallets) |
| **Foreign payments** | Card gateway (Stripe or Safepay) — USD/PKR display |
| **Government registry** | **Not required at launch** — rebrand as optional "Trip Safety Profile" (emergency contact, blood group) instead of mandatory GB state permit |
| **AI** | **Required at v1** — NVIDIA NIM for Magic Build; rules engine only as outage fallback (not primary UX) |
| **Branding** | Private marketplace ("BaltiTour") — remove "Government of GB" official portal framing from production UI |

---

## Tech Stack

```
Frontend:   React + Vite + React Router + TanStack Query (API cache)
Backend:    FastAPI + Uvicorn + Pydantic v2
Database:   Supabase PostgreSQL
Auth:       Supabase Auth (phone OTP for PK, email for foreign)
Storage:    Supabase Storage (KYC docs, room photos)
Realtime:   Supabase Realtime (chat, pool seat updates)
AI:         NVIDIA NIM API (required) — minimax-m3 or equivalent
Payments:   JazzCash API + EasyPaisa API (local) | Stripe (foreign cards)
SMS:        Twilio or local PK gateway (SOS, booking alerts)
Deploy:     Render — static site (React build) + web service (FastAPI)
```

---

## Reference Assets

| File | Role |
| :--- | :--- |
| `baltitour.html` | UI/UX reference — migrate screens into React components |
| `features.md` | SRS feature list |
| `userstories.md` | Acceptance criteria per sprint |
| `market_analysis.md` | 120% pool economics, escrow rules |
| `vendor_onboarding_guide.md` | Wallet KYC, penny verification, escrow timers |
| `mountains_hero_banner.png` | Hero image — place in `frontend/public/assets/` |

---

## 1. Current State

- **Prototype:** `baltitour.html` (~85% UX coverage, all mock data)
- **Backend:** Single `main.py` with `/api/recommend` only
- **React app:** Not started → **Iteration 0 in progress**

---

## 2. Scope Adjustments (Based on Decisions)

### Remove / Soften at Launch
- Mandatory "State Visitor Registry" legal framing
- GB Tourism department KPI widgets (replace with marketplace stats)
- Gov Preferred / State Verified badges → **Platform Verified** / **Gold Partner**

### Keep & Prioritize
- AI Magic Build (required, Iteration 2)
- JazzCash/EasyPaisa checkout for PK users (Iteration 9)
- Stripe/card for foreign tourists with passport onboarding
- Trip Safety Profile (optional emergency info, not gov permit)
- 120% ride pooling economics
- Escrow + vendor KYC

### Payment Routing Logic (Iteration 9)
```
if user.country == "PK" and user.payout_pref in ["jazzcash", "easypaisa"]:
    → JazzCash / EasyPaisa checkout (PKR)
elif user.is_foreign or user.payment_method == "card":
    → Stripe checkout (USD with PKR estimate shown)
else:
    → prompt user to select payment type
```

---

## 3. Programming Iterations

Each iteration ≈ 1–2 weeks. Check boxes as completed.

---

### Iteration 0 — React + FastAPI Bootstrap ⬅️ **START HERE**
**Goal:** Monorepo scaffold, dev servers running, AI endpoint wired to React.

**Tasks:**
- [x] Lock product decisions (this section)
- [x] `frontend/` — Vite + React + React Router shell
- [x] `backend/` — FastAPI app structure (`routers/`, `services/`, `models/`)
- [x] `GET /api/health`, `POST /api/recommend` (with `vibe` field + rules fallback)
- [x] React hero + quick search bar calling AI endpoint
- [x] `requirements.txt`, `.env.example`, root `README.md`
- [x] Copy `mountains_hero_banner.png` → `frontend/public/assets/`
- [x] Keep `baltitour.html` as design reference (do not delete)

**Done when:**
```bash
# Terminal 1
cd backend && uvicorn app.main:app --reload --port 8000

# Terminal 2
cd frontend && npm run dev
```
React app loads, AI Magic Build button returns a package from FastAPI.

---

### Iteration 1 — Supabase Schema & Auth ✅
**Goal:** Real users and vendor entities.  
**Stories:** Foundation for US-302, US-304

**Tasks:**
- [x] SQL schema + RLS template (`backend/supabase/schema.sql`)
- [x] SQLite dev database + SQLAlchemy models
- [x] JWT auth: register vendor, login, role-based access
- [x] CRUD/listings: `/api/listings`, `/api/vendors`, `/api/rooms`, `/api/vehicles`, `/api/guides`
- [x] Seed script: 5 hotels, 8 vehicles, 3 guides + admin account
- [x] React: login pages, protected routes, Plan Trip live listings, admin vendor approval

**Demo accounts:**
- Admin: `admin@baltitour.com` / `admin123`
- Vendor: `hostel@skardu.com` / `vendor123`

**Seed command:** `cd backend; .venv\Scripts\python -m app.seed`

**Done when:** Vendor registers → admin approves → React fetches live listings. ✅

---

### Iteration 2 — Trip Builder + AI (Required) ✅
**Goal:** API-driven builder with NVIDIA AI as primary path.  
**Stories:** US-102, US-106, US-107, US-111

**Tasks:**
- [x] `GET /api/search?destination=&nights=&guests=&budget=&vibe=`
- [x] `POST /api/cart/quote` — line items + 10% platform fee
- [x] Terrain engine: Deosai/Basho → 4x4 required
- [x] AI service uses live DB listings (room/vehicle/guide UUIDs)
- [x] Rules fallback when NVIDIA API unavailable
- [x] React: StayCard, RideCard, GuideCard, InvoiceSidebar, Plan Trip builder

**Done when:** AI Magic Build populates real API-driven cart; budget filter works. ✅

---

### Iteration 3 — Booking, Safety Profile & QR Vouchers
**Goal:** Checkout without gov registry requirement.  
**Stories:** US-104, US-112

**Tasks:**
- [x] Rename "Visitor Registry" → **Trip Safety Profile** (optional emergency contact, blood group)
- [x] `POST /api/bookings` + escrow pending entry
- [x] Signed QR voucher (JWT/HMAC) — vendor scannable
- [x] Trip timeline API + React TripFlow page
- [x] IndexedDB cache of active booking (offline prep)

**Done when:** User books → receives QR pass + timeline; no gov permit language. ✅

---

### Iteration 4 — Ride Pooling (120% Model)
**Goal:** Correct shared fare economics.  
**Stories:** US-103, `market_analysis.md`

**Tasks:**
- [x] `pools` + `pool_members` tables
- [x] Shared fare = private_fare × 1.2; per-seat = shared_fare ÷ passengers
- [x] `GET /api/pools/active`, join/leave endpoints with realtime seat updates
- [x] React CarpoolPage wired to API

**Done when:** 4-seat pool on 10,000 private fare → 3,000/seat; driver nets more than private. ✅

---

### Iteration 5 — Vendor Portal
**Stories:** US-201, US-202, US-205, US-207, US-208

**Tasks:**
- [x] Room calendar block/unblock API
- [x] Seasonal pricing multipliers
- [x] Vehicle tariff matrix CRUD
- [x] Fleet sub-driver management
- [x] Supabase Storage image uploads
- [x] React VendorDashboard (migrate from prototype tabs)

**Done when:** Vendor can block rooms, set seasonal rates, manage fleet/tariffs from portal. ✅

---

### Iteration 6 — KYC, Wallets & Escrow
**Stories:** US-301, US-302, US-303, `vendor_onboarding_guide.md`

**Tasks:**
- [x] KYC upload + admin review queue
- [x] Wallet: JazzCash/EasyPaisa title match + CNIC cross-check + penny test
- [x] Escrow FSM: pending → held → release_scheduled → paid | disputed
- [x] Tiered release: 12h city / 24–48h adventure
- [x] QR completion handshake + geofence flag

**Done when:** Vendor completes KYC; escrow releases to wallet after trip completion timer. ✅

---

### Iteration 7 — Safety, Offline PWA & Chat
**Stories:** US-104, US-105, US-109, US-113

**Tasks:**
- [x] Service Worker + offline shell
- [x] Priority sync queue (SOS > booking > chat)
- [x] SOS → SMS gateway
- [x] Supabase Realtime chat per booking
- [x] Weather/road advisory feed + admin override

**Done when:** App works offline for active trip; SOS queues and sends; chat + advisories live. ✅

_Note: Chat uses REST polling locally; swap to Supabase Realtime in production._

---

### Iteration 8 — BaltiPoints & Admin Tools ✅
**Stories:** US-110, US-305, US-306

**Tasks:**
- [x] BaltiPoints earn/redeem (max 20% at checkout)
- [x] Admin global pricing override + surge
- [x] Admin trip editor + audit log
- [x] Dispute center → escrow hold

**API v0.9.0** — `/api/points/balance`, admin pricing/bookings/audit/disputes, booking dispute filing.

---

### Iteration 9 — Payments & Production Deploy ✅
**Stories:** Go-live

**Tasks:**
- [x] **Local:** JazzCash + EasyPaisa sandbox → webhook → confirm booking
- [x] **Foreign:** Stripe card checkout (USD) with PKR estimate
- [x] Payment router selects gateway by user locale/type
- [x] Vendor payout batch (JazzCash/EasyPaisa disbursement or IBFT)
- [x] Render deploy: React static site + FastAPI web service (`render.yaml`)
- [x] Sentry + uptime monitoring (optional `SENTRY_DSN`)

**API v1.0.0** — `/api/payments/init`, sandbox complete, webhooks, admin payout batch.

**Done when:** PK user pays via JazzCash sandbox; foreign user pays via Stripe test card (or sandbox mock).

---

## 4. Project Structure

```
newforntend/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── routers/
│   │   │   ├── health.py
│   │   │   └── recommend.py
│   │   ├── services/
│   │   │   └── ai.py
│   │   └── models/
│   │       └── schemas.py
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── public/assets/
│   │   └── mountains_hero_banner.png
│   ├── src/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   ├── api/client.js
│   │   ├── pages/
│   │   ├── components/
│   │   └── styles/
│   ├── package.json
│   └── vite.config.js
├── baltitour.html              # UX reference (keep)
├── features.md
├── userstories.md
├── market_analysis.md
├── vendor_onboarding_guide.md
├── programming_iterations.md
├── .env.example
└── README.md
```

---

## 5. User Story Map

| Sprint | Stories | Iteration |
| :--- | :--- | :--- |
| Tourist core | US-101 → US-113 | 2–4, 7–8 |
| Vendor | US-201 → US-208 | 5–6 |
| Admin | US-301 → US-306 | 6, 8 |
| Payments | — | 9 |

**Post-MVP:** Flutter native app (web PWA covers mobile browsers).

---

## Gap closure (July 2026)

Implemented after MVP iterations 0–9 to align with `features.md` / user stories:

| Area | Delivered |
| :--- | :--- |
| US-101 multi-leg | `stops` on search/cart/booking + Plan Trip stop chips |
| US-103 pooling | Checkout toggle → auto pool join on payment confirm |
| US-108 filters | Solo-safe / women-friendly / featured filters on search |
| US-111 room cards | Expandable StayCard with amenity icons |
| US-203 vendor complete | `/vendor/trips` queue + offline sync |
| US-204 SMS reg | Vendor login SMS-lite form + admin SMS leads tab |
| US-206 featured boost | `POST /api/vendor/boost` + dashboard CTA |
| US-303 physical vet | Admin physical-vet toggle + gold badge |
| US-304 admin CRUD | `/admin/registry` create vendor + hide assets |
| Fleet map | `/admin/fleet` live trip panel |
| Community | Reviews, forum, cart-abandon SMS endpoints + UI |

**Still manual:** public Render deploy (see `render.yaml`).

---

## 6. Environment Variables

```env
# Backend (.env)
NVIDIA_API_KEY=nvapi-...
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=...
CORS_ORIGINS=http://localhost:5173
JAZZCASH_MERCHANT_ID=
JAZZCASH_PASSWORD=
EASYPAISA_STORE_ID=
EASYPAISA_HASH_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# Frontend (.env)
VITE_API_URL=http://localhost:8000
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=...
VITE_STRIPE_PUBLISHABLE_KEY=...
```

---

*Last updated: July 16, 2026 — decisions locked, Iteration 0 in progress.*
