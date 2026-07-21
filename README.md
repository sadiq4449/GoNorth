# BaltiTour

AI-powered trip builder for Baltistan — **React** frontend + **FastAPI** backend.

## Stack

| Layer | Tech |
| :--- | :--- |
| Frontend | React 18, Vite, React Router |
| Backend | FastAPI, Python 3.11+ |
| AI | NVIDIA NIM (required at v1) |
| Database | Supabase (Iteration 1+) |
| Payments | JazzCash / EasyPaisa (local) · Stripe cards (foreign) |

## Quick Start

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate          # Windows
pip install -r requirements.txt
copy .env.example .env            # add NVIDIA_API_KEY
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173 — click **AI Magic Build** to test the recommend endpoint.

## Project Layout

```
backend/          FastAPI app (app/main.py, routers/, services/)
frontend/         React + Vite
baltitour.html    Original UI prototype (design reference)
programming_iterations.md   Roadmap
```

## Docs

- `features.md` — SRS
- `userstories.md` — acceptance criteria
- `market_analysis.md` — 120% pool economics
- `vendor_onboarding_guide.md` — wallet KYC rules
- `programming_iterations.md` — iteration plan (locked decisions)

## Hero Image

Place `mountains_hero_banner.png` in `frontend/public/assets/` for the hero background.

## Legacy

Root `main.py` is superseded by `backend/app/main.py`. Use the backend folder going forward.
