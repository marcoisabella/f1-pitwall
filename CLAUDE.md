# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**F1 PitWall** — Real-time F1 analytics dashboard with ML predictions and Fantasy F1. Monorepo with FastAPI backend, React/Vite frontend, and nginx reverse proxy.

## Build & Development Commands

### Frontend (Vite + React + TypeScript + Tailwind v4)
```bash
cd frontend
pnpm install                    # Install dependencies
pnpm dev                        # Dev server (http://localhost:5173, proxies /api → :8000)
pnpm build                      # Production build (tsc + vite build)
npx tsc -b --noEmit             # Type-check only
```

### Backend (FastAPI + Python 3.10)
```bash
cd backend
pip install -r requirements.txt
python3 -m uvicorn app.main:app --reload --port 8000   # Dev server
```

### ML Training (requires libomp for XGBoost)
```bash
cd backend
brew install libomp                                     # macOS prerequisite
python3 -m app.ml.training.train_race_model             # Train race position model
python3 -m app.ml.training.train_pit_model              # Train pit stop model
```

### Docker (full stack)
```bash
docker compose up --build       # backend:8000, frontend:80, nginx:8780
```

## Architecture

### Backend (`backend/app/`)
- **main.py** — FastAPI app, CORS, lifespan (creates tables, seeds admin user), mounts all routers
- **auth.py** — JWT auth with bcrypt (not passlib — bcrypt 5.x incompatible with passlib)
- **config.py** — pydantic-settings: jwt_secret, database_url, admin_username/password, openf1_base_url
- **models/database.py** — SQLAlchemy async + aiosqlite: User, FantasyTeam, FantasyScore models
- **routers/** — auth, timing, weather, predictions, fantasy, websocket
- **services/openf1_client.py** — Async httpx client with retry + TTL caching against api.openf1.org
- **services/fastf1_service.py** — FastF1 wrapper using run_in_executor
- **services/prediction_engine.py** — Loads ML models lazily (imports xgboost only when model files exist), fallback predictions when no models trained
- **services/fantasy_engine.py** — Team optimizer, scoring, driver pricing
- **ml/models/** — RacePositionPredictor (XGBoost), PitStopWindowPredictor (GBM)
- **ml/features/race_features.py** — Feature engineering from FastF1 historical data
- **ml/training/** — Standalone training scripts
- **fantasy/scoring.py** — Points rules, driver prices, budget constraints
- **fantasy/optimizer.py** — Brute-force C(20,5) team optimization

### Frontend (`frontend/src/`)
- **App.tsx** — BrowserRouter with AuthProvider, routes: /, /strategy, /fantasy (protected), /login
- **styles/f1-theme.css** — Tailwind v4 @theme with F1 TV dark palette (#0F0F13 bg), custom colors (f1-red, f1-cyan, f1-green, f1-purple, f1-yellow)
- **contexts/AuthContext.tsx** — Token in localStorage, validates via /api/auth/me on mount
- **hooks/** — useWebSocket (reconnecting), useLiveTiming, usePredictions, useFantasy, useAuth
- **components/timing/** — LiveTimingBoard, DriverRow, GapIndicator, SectorTimes, TireCompound
- **components/strategy/** — PredictedOrder, PitWindowChart (Recharts), TireDegradationChart (Recharts)
- **components/fantasy/** — DriverCard, DriverSelectionGrid, BudgetTracker, TeamActions, OptimizationSuggestion, ScoreHistory
- **components/layout/** — Sidebar (icon nav), Header ("F1 PITWALL" + clock), Layout (Outlet)
- **utils/teamColors.ts** — Maps F1 team names to hex colors

### Key Conventions
- Python 3.10: use `from __future__ import annotations` for modern type hints
- Fonts: Titillium Web (display via `font-[var(--font-display)]`), JetBrains Mono (timing via `font-timing`)
- Recharts Tooltip formatter params are `number | undefined` — always handle undefined
- ML model imports are lazy in prediction_engine.py to allow startup without xgboost/libomp
