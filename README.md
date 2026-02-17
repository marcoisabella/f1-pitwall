# F1 PitWall

Real-time F1 analytics dashboard with ML-powered race predictions, pit strategy analysis, and Fantasy F1 team optimizer.

## Features

- **Live Timing Board** — Real-time driver positions, gaps, sector times, tire compounds via OpenF1 API + WebSocket
- **Strategy Analysis** — ML-predicted finishing order, pit stop windows, tire degradation curves
- **Fantasy F1** — Build a team within $100M budget, AI-optimized team suggestions, score tracking
- **Authentication** — JWT-based auth for Fantasy features

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 19, TypeScript, Vite 7, Tailwind CSS v4, Recharts, React Router v7 |
| Backend | FastAPI, SQLAlchemy (async), aiosqlite, httpx |
| ML | XGBoost, scikit-learn, FastF1 |
| Auth | JWT (python-jose), bcrypt |
| Infra | Docker Compose, nginx reverse proxy |

## Quick Start

### Prerequisites

- Python 3.10+
- Node.js 18+ with pnpm (`npm install -g pnpm`)
- (Optional) Docker & Docker Compose

### Option A: Local Development

**1. Clone and configure**

```bash
git clone <repo-url> && cd f1app
cp .env.example .env
# Edit .env — at minimum change JWT_SECRET to a random string
```

**2. Backend**

```bash
cd backend
pip install -r requirements.txt
python3 -m uvicorn app.main:app --reload --port 8000
```

The backend starts on `http://localhost:8000`. On first start it creates a SQLite database and seeds an admin user (credentials from `.env`).

**3. Frontend**

```bash
cd frontend
pnpm install
pnpm dev
```

Opens on `http://localhost:5173`. The Vite dev server proxies `/api` and `/ws` requests to the backend on port 8000.

### Option B: Docker Compose

```bash
cp .env.example .env
docker compose up --build
```

The app is available at `http://localhost:8780` (nginx proxies frontend + backend).

## Usage

### Live Timing

Navigate to `/` — shows the live timing board when a session is active on the F1 calendar. Data comes from the [OpenF1 API](https://openf1.org).

### Strategy Analysis

Navigate to `/strategy` — shows ML-predicted finishing order. Click a driver to see their predicted pit windows and tire degradation curves.

Works with fallback predictions out of the box. For ML-powered predictions, train the models first (see below).

### Fantasy F1

Navigate to `/fantasy` (requires login). Build a team of 5 drivers within $100M budget (max 2 per constructor). Click **AI OPTIMIZE** for an ML-recommended team.

**Auth endpoints:**
- Register: `POST /api/auth/register` with `{"username": "...", "password": "..."}`
- Login: `POST /api/auth/login` with same body
- Or use the login page at `/login`

## Training ML Models (Optional)

The app works without trained models (uses grid-position-based fallback predictions). To train real models from historical F1 data:

```bash
cd backend

# Install OpenMP runtime (required by XGBoost on macOS)
brew install libomp

# Train race position predictor (XGBoost, uses 2022-2024 data via FastF1)
python3 -m app.ml.training.train_race_model

# Train pit stop predictor (GBM)
python3 -m app.ml.training.train_pit_model
```

Trained models are saved to `backend/app/ml/saved_models/` and loaded automatically on next backend start.

## API Endpoints

| Endpoint | Auth | Description |
|----------|------|-------------|
| `GET /api/health` | No | Health check |
| `POST /api/auth/register` | No | Create account, returns JWT |
| `POST /api/auth/login` | No | Login, returns JWT |
| `GET /api/auth/me` | Yes | Current user info |
| `GET /api/timing/sessions` | No | Recent F1 sessions |
| `GET /api/timing/live` | No | Live timing data |
| `GET /api/weather/current` | No | Current session weather |
| `GET /api/predictions/race?session_key=` | No | Predicted finishing order |
| `GET /api/predictions/strategy/{driver}?session_key=` | No | Pit windows + tire degradation |
| `GET /api/fantasy/drivers` | No | Available drivers with prices |
| `POST /api/fantasy/team` | Yes | Save team selection |
| `GET /api/fantasy/team` | Yes | Get saved team |
| `GET /api/fantasy/scores` | Yes | Score history |
| `GET /api/fantasy/optimize` | Yes | ML-optimized team recommendation |
| `WS /ws/timing` | No | WebSocket live timing stream |

## Configuration

All config is in `.env` (see `.env.example`):

| Variable | Default | Description |
|----------|---------|-------------|
| `ADMIN_USERNAME` | `admin` | Seeded admin username |
| `ADMIN_PASSWORD` | `changeme` | Seeded admin password |
| `JWT_SECRET` | — | Secret key for JWT signing (change this!) |
| `DATABASE_URL` | `sqlite+aiosqlite:///./data/f1app.db` | SQLAlchemy database URL |
| `OPENF1_BASE_URL` | `https://api.openf1.org/v1` | OpenF1 API base URL |

## Project Structure

```
f1app/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app entry point
│   │   ├── auth.py              # JWT + bcrypt auth
│   │   ├── config.py            # Settings from .env
│   │   ├── models/database.py   # SQLAlchemy models
│   │   ├── routers/             # API route handlers
│   │   ├── services/            # OpenF1 client, prediction engine, fantasy engine
│   │   ├── ml/                  # ML models, features, training scripts
│   │   ├── fantasy/             # Scoring rules, team optimizer
│   │   └── utils/               # F1 constants, team colors
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── App.tsx              # Routes + AuthProvider
│   │   ├── pages/               # Live, Strategy, Fantasy, Login
│   │   ├── components/          # timing/, strategy/, fantasy/, layout/, common/
│   │   ├── hooks/               # useWebSocket, useLiveTiming, usePredictions, useFantasy, useAuth
│   │   ├── contexts/            # AuthContext
│   │   ├── styles/f1-theme.css  # F1 TV dark theme (Tailwind v4)
│   │   └── utils/               # Team color mapping
│   ├── package.json
│   └── vite.config.ts
├── nginx/
│   ├── nginx.conf
│   └── Dockerfile
├── docker-compose.yml
└── .env.example
```
