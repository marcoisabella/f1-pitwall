from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select

from app.auth import hash_password
from app.config import settings
from app.models.database import User, async_session, create_tables
from app.routers import auth, timing, weather, predictions, fantasy, websocket


@asynccontextmanager
async def lifespan(app: FastAPI):
    await create_tables()
    # Seed admin user if not exists
    async with async_session() as session:
        result = await session.execute(
            select(User).where(User.username == settings.admin_username)
        )
        if not result.scalar_one_or_none():
            admin = User(
                username=settings.admin_username,
                hashed_password=hash_password(settings.admin_password),
                is_admin=True,
            )
            session.add(admin)
            await session.commit()
    yield


app = FastAPI(title="F1 PitWall API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(timing.router, prefix="/api/timing", tags=["timing"])
app.include_router(weather.router, prefix="/api/weather", tags=["weather"])
app.include_router(predictions.router, prefix="/api/predictions", tags=["predictions"])
app.include_router(fantasy.router, prefix="/api/fantasy", tags=["fantasy"])
app.include_router(websocket.router, tags=["websocket"])


@app.get("/api/health")
async def health():
    return {"status": "ok"}
