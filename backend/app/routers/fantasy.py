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

    # Validate all drivers exist
    for d in body.drivers:
        if d not in DRIVERS_2025:
            raise HTTPException(400, f"Unknown driver number: {d}")

    total_price = sum(DRIVER_PRICES.get(d, 0) for d in body.drivers)
    if total_price > TEAM_BUDGET:
        raise HTTPException(400, f"Team exceeds budget of {TEAM_BUDGET}M (total: {total_price}M)")

    # Check constructor constraint
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
