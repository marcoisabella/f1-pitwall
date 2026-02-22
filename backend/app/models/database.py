from datetime import datetime

from sqlalchemy import JSON, Boolean, Column, DateTime, Float, Integer, String, Text, ForeignKey
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase, relationship

from app.config import settings

engine = create_async_engine(settings.database_url, echo=False)
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String, unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=False)
    is_admin = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    fantasy_teams = relationship("FantasyTeam", back_populates="user")
    fantasy_scores = relationship("FantasyScore", back_populates="user")


class FantasyTeam(Base):
    __tablename__ = "fantasy_teams"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    season = Column(Integer, nullable=False)
    team_json = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="fantasy_teams")


class FantasyScore(Base):
    __tablename__ = "fantasy_scores"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    session_key = Column(Integer, nullable=False)
    score = Column(Float, nullable=False)
    breakdown_json = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="fantasy_scores")


class SeasonCache(Base):
    __tablename__ = "season_cache"

    id = Column(Integer, primary_key=True, autoincrement=True)
    cache_key = Column(String, unique=True, nullable=False, index=True)
    season = Column(Integer, nullable=False, default=2026)
    data_json = Column(Text, nullable=False)
    source = Column(String, nullable=False, default="seed")
    fetched_at = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)


class FantasyPrice(Base):
    __tablename__ = "fantasy_prices"

    id = Column(Integer, primary_key=True, autoincrement=True)
    driver_number = Column(Integer, nullable=False)
    season = Column(Integer, nullable=False)
    round = Column(Integer, nullable=False)
    price = Column(Float, nullable=False)
    price_change = Column(Float, default=0.0)
    effective_date = Column(DateTime, default=datetime.utcnow)


class FantasyLeague(Base):
    __tablename__ = "fantasy_leagues"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, nullable=False)
    invite_code = Column(String, unique=True, nullable=False, index=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    season = Column(Integer, nullable=False, default=2026)
    created_at = Column(DateTime, default=datetime.utcnow)

    creator = relationship("User", foreign_keys=[created_by])
    memberships = relationship("LeagueMembership", back_populates="league")


class LeagueMembership(Base):
    __tablename__ = "league_memberships"

    id = Column(Integer, primary_key=True, autoincrement=True)
    league_id = Column(Integer, ForeignKey("fantasy_leagues.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    joined_at = Column(DateTime, default=datetime.utcnow)

    league = relationship("FantasyLeague", back_populates="memberships")
    user = relationship("User")


class FantasyHistoricalScore(Base):
    __tablename__ = "fantasy_historical_scores"

    id = Column(Integer, primary_key=True, autoincrement=True)
    season = Column(Integer, nullable=False)
    round = Column(Integer, nullable=False)
    driver_number = Column(Integer, nullable=False)
    points = Column(Float, nullable=False, default=0.0)
    breakdown_json = Column(JSON)


async def create_tables():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def get_session() -> AsyncSession:
    async with async_session() as session:
        yield session
