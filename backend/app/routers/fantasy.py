from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.fantasy.scoring import DRIVER_PRICES, TEAM_BUDGET, MAX_DRIVERS_PER_TEAM, MAX_DRIVERS_SAME_CONSTRUCTOR
from app.models.database import User, get_session
from app.services.fantasy_engine import fantasy_engine
from app.utils.f1_constants import DRIVERS_2025

router = APIRouter()


class TeamCreateRequest(BaseModel):
    drivers: list[int]


class LeagueCreateRequest(BaseModel):
    name: str


@router.get("/drivers")
async def get_fantasy_drivers():
    """Get available drivers with prices and predicted points. Public endpoint."""
    return await fantasy_engine.get_available_drivers()


@router.post("/team")
async def create_or_update_team(
    body: TeamCreateRequest,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """Create or update the user's fantasy team. Requires auth."""
    if len(body.drivers) != MAX_DRIVERS_PER_TEAM:
        raise HTTPException(400, f"Team must have exactly {MAX_DRIVERS_PER_TEAM} drivers")

    for d in body.drivers:
        if d not in DRIVERS_2025:
            raise HTTPException(400, f"Unknown driver number: {d}")

    total_price = sum(DRIVER_PRICES.get(d, 0) for d in body.drivers)
    if total_price > TEAM_BUDGET:
        raise HTTPException(400, f"Team exceeds budget of {TEAM_BUDGET}M (total: {total_price}M)")

    teams = [DRIVERS_2025[d]["team"] for d in body.drivers]
    for t in set(teams):
        if teams.count(t) > MAX_DRIVERS_SAME_CONSTRUCTOR:
            raise HTTPException(400, f"Max {MAX_DRIVERS_SAME_CONSTRUCTOR} drivers from {t}")

    await fantasy_engine.save_team(user.id, body.drivers, session)
    return {"status": "ok", "team": body.drivers, "total_price": total_price}


@router.get("/team")
async def get_team(
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """Get the current user's fantasy team. Requires auth."""
    team = await fantasy_engine.get_team(user.id, session)
    if not team:
        return {"team": None}
    return {"team": team}


@router.get("/scores")
async def get_scores(
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """Get the user's scoring history. Requires auth."""
    scores = await fantasy_engine.get_scores(user.id, session)
    return {"scores": scores}


@router.get("/optimize")
async def get_optimized_team(
    user: User = Depends(get_current_user),
):
    """Get ML-optimized team recommendation. Requires auth."""
    result = await fantasy_engine.optimize_team_selection()
    return result


@router.get("/simulate")
async def get_simulation():
    """Run Monte Carlo simulation for all drivers. Public endpoint."""
    results = await fantasy_engine.run_monte_carlo()
    return {"drivers": results}


@router.get("/prices")
async def get_prices():
    """Get price history for all drivers. Public endpoint."""
    prices = await fantasy_engine.get_price_history()
    return {"prices": prices}


@router.get("/statistics")
async def get_statistics():
    """Get driver statistics. Public endpoint."""
    stats = await fantasy_engine.get_driver_statistics()
    return {"drivers": stats}


@router.get("/chips/recommend")
async def get_chip_recommendations():
    """Get chip usage recommendations. Public endpoint."""
    recs = await fantasy_engine.get_chip_recommendations()
    return {"recommendations": recs}


@router.get("/historical/{season}")
async def get_historical(season: int):
    """Get historical scores by season. Public endpoint."""
    scores = await fantasy_engine.get_historical_scores(season)
    return {"scores": scores}


@router.post("/league")
async def create_league(
    body: LeagueCreateRequest,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """Create a new fantasy league. Requires auth."""
    result = await fantasy_engine.create_league(body.name, user.id, session)
    return result


@router.get("/league/{invite_code}")
async def get_league(
    invite_code: str,
    session: AsyncSession = Depends(get_session),
):
    """Get league info. Public endpoint."""
    league = await fantasy_engine.get_league(invite_code, session)
    if not league:
        raise HTTPException(404, "League not found")
    return league


@router.post("/league/{invite_code}/join")
async def join_league(
    invite_code: str,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """Join a league. Requires auth."""
    result = await fantasy_engine.join_league(invite_code, user.id, session)
    if not result:
        raise HTTPException(404, "League not found")
    return result


@router.get("/optimize/mc")
async def get_optimized_team_mc(mode: str = "value"):
    """Get Monte Carlo optimized team. Public endpoint."""
    if mode not in ("value", "ceiling"):
        raise HTTPException(400, "Mode must be 'value' or 'ceiling'")
    result = await fantasy_engine.get_optimized_team_mc(mode)
    return result
