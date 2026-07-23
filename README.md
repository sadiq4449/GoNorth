# GoNorth

AI-powered trip builder and marketplace for Baltistan — **React** frontend + **FastAPI** backend.

GoNorth connects tourists with verified local vendors (hostels, 4x4 drivers, guides) through an AI-assisted trip builder, escrow-protected payments, and offline-ready vouchers. The platform earns **10% commission** on every booking while vendors receive automated wallet payouts after trip completion.

## Business Model

| Revenue stream | How it works |
| :--- | :--- |
| **Platform commission** | 10% fee on every booking; transparent in cart and invoice |
| **Escrow & payouts** | Tourist payment held until trip completion; vendor share released after 12–48h buffer |
| **Ride pooling (120%)** | Shared fares use 120% of private rate — drivers earn more, passengers save up to 70% |
| **BaltiPoints loyalty** | Earn points per PKR spent; redeem up to 20% on future bookings |
| **Featured vendor boost** | Paid visibility slots for hostels and transporters by valley |
| **Payment routing** | JazzCash / EasyPaisa (PKR) for local tourists · Stripe (USD) for foreign cards |

**Target users:** Solo backpackers, adventure travelers, and foreign tourists visiting Skardu, Shigar, Khaplu, Deosai, Basho, and Hunza.

**Vendor side:** Hotels, fleet owners, and guides onboard via KYC, manage inventory in a web portal, and receive IBFT or mobile-wallet payouts.

## Features

### Tourist Application
- **Smart Search & AI Onboarding** — Multi-destination hubs, budget filter, vibe presets (Backpacker / Adventure / Luxury), AI Magic Build
- **Dynamic Package Builder** — Stay + transport + guides on one screen; multi-leg routes; real-time cart with 10% platform fee
- **Seat Pooling** — Active pool feed, join/leave seats, 120% fare economics
- **Offline Survivor Kit** — IndexedDB booking cache, QR vouchers, GSM `tel:` links to drivers
- **Safety** — Global SOS (GPS + SMS), road/weather advisories, 4x4 terrain enforcement, optional Trip Safety Profile
- **Community** — BaltiPoints, visual trek reviews, cart-abandon SMS, traveler forum
- **Trip Experience** — Day-by-day timeline, vendor chat, trust badges (Solo-safe, Women-friendly, Gold Partner)

### Vendor Management
- **Onboarding** — 4-step KYC wizard, SMS-lite registration, physical vetting → Gold badge
- **Hotels** — Room-level inventory, amenity tags, calendar blocking, seasonal pricing, photo uploads
- **Transport** — Fleet + driver management, route tariff matrix, offline trip completion sync
- **Compliance** — Document portal, penny-test wallet verification, vendor wallet + escrow
- **Growth** — Featured boost, platform verification badges

### Admin Control Tower
- **Registry** — Create vendors, hide assets, approve/suspend, global pricing override & surge
- **Finance** — Escrow ledger, commission split, payout batches (IBFT / JazzCash / EasyPaisa)
- **Operations** — Fleet map, dispute center, KYC queue, SOS log, audit trail

See `features.md` and `userstories.md` for full SRS and acceptance criteria.

## Stack

| Layer | Tech |
| :--- | :--- |
| Frontend | React 19, Vite, React Router |
| Backend | FastAPI, Python 3.11+ |
| AI | OpenRouter (Gemini Flash default) |
| Database | Supabase PostgreSQL (SQLite for local dev) |
| Payments | JazzCash / EasyPaisa (local) · Stripe cards (foreign) |
| Deploy | Render (API + static site) · Vercel (frontend option) |

## Quick Start

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate          # Windows
pip install -r requirements.txt
copy .env.example .env            # add OPENROUTER_API_KEY
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173 — click **AI Magic Build** to test the recommend endpoint.

**Demo accounts** (after `python -m app.seed`):
- Admin: `admin@baltitour.com` / `admin123`
- Vendor: `hostel@skardu.com` / `vendor123`

## Project Layout

```
backend/          FastAPI app (app/main.py, routers/, services/)
frontend/         React + Vite SPA (tourist, vendor, admin portals)
baltitour.html    Original UI prototype (design reference)
programming_iterations.md   Locked roadmap & iteration status
```

## Docs

- `features.md` — SRS & comprehensive feature blueprint
- `userstories.md` — Acceptance criteria (US-101 → US-306)
- `market_analysis.md` — 120% pool economics, escrow risk rules
- `vendor_onboarding_guide.md` — Wallet KYC, penny verification, escrow timers
- `programming_iterations.md` — Iteration plan (MVP complete)

## Hero Image

Place `mountains_hero_banner.png` in `frontend/public/assets/` for the hero background.

## Legacy

Root `main.py` is superseded by `backend/app/main.py`. Use the backend folder going forward.
