from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.fantasy.scoring import (
    DRIVER_PRICES, TEAM_BUDGET, MAX_DRIVERS_PER_TEAM,
    MAX_DRIVERS_SAME_CONSTRUCTOR, CONSTRUCTOR_PRICES, MAX_CONSTRUCTORS_PER_TEAM,
    CHIPS, FREE_TRANSFERS_PER_RACE,
)
from app.models.database import User, get_session
from app.services.fantasy_engine import fantasy_engine
from app.utils.f1_constants import DRIVERS_2026, CONSTRUCTORS_2026

router = APIRouter()


class TeamCreateRequest(BaseModel):
    drivers: list[int]
    constructors: list[str] = []
    team_number: int = 1
    name: str | None = None
    drs_boost_driver: int | None = None
    active_chip: str | None = None


class LeagueCreateRequest(BaseModel):
    name: str


class ChipActivateRequest(BaseModel):
    chip: str
    round_number: int


class DrsApplyRequest(BaseModel):
    team_number: int
    driver_number: int


class TransferRequest(BaseModel):
    team_number: int
    drivers_in: list[int] = []
    drivers_out: list[int] = []
    constructors_in: list[str] = []
    constructors_out: list[str] = []


class SettingsUpdateRequest(BaseModel):
    active_team_number: int | None = None
    f1_fantasy_league_code: str | None = None


class ImportRequest(BaseModel):
    cookie: str
    slot: int = 1
    team_number: int = 1
    save: bool = False


@router.get("/drivers")
async def get_fantasy_drivers():
    """Get available drivers with prices, predicted points, and tier. Public endpoint."""
    return await fantasy_engine.get_available_drivers()


@router.post("/team")
async def create_or_update_team(
    body: TeamCreateRequest,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """Create or update a user's fantasy team. Requires auth."""
    if len(body.drivers) != MAX_DRIVERS_PER_TEAM:
        raise HTTPException(400, f"Team must have exactly {MAX_DRIVERS_PER_TEAM} drivers")

    if body.team_number < 1 or body.team_number > 3:
        raise HTTPException(400, "team_number must be 1, 2, or 3")

    for d in body.drivers:
        if d not in DRIVERS_2026:
            raise HTTPException(400, f"Unknown driver number: {d}")

    if body.constructors:
        if len(body.constructors) != MAX_CONSTRUCTORS_PER_TEAM:
            raise HTTPException(400, f"Team must have exactly {MAX_CONSTRUCTORS_PER_TEAM} constructors")
        for c in body.constructors:
            if c not in CONSTRUCTORS_2026:
                raise HTTPException(400, f"Unknown constructor: {c}")

    if body.drs_boost_driver is not None and body.drs_boost_driver not in body.drivers:
        raise HTTPException(400, "DRS boost driver must be one of the selected drivers")

    total_price = sum(DRIVER_PRICES.get(d, 0) for d in body.drivers)
    total_price += sum(CONSTRUCTOR_PRICES.get(c, 0) for c in body.constructors)
    if total_price > TEAM_BUDGET:
        raise HTTPException(400, f"Team exceeds budget of {TEAM_BUDGET}M (total: {total_price}M)")

    teams = [DRIVERS_2026[d]["team"] for d in body.drivers]
    for t in set(teams):
        if teams.count(t) > MAX_DRIVERS_SAME_CONSTRUCTOR:
            raise HTTPException(400, f"Max {MAX_DRIVERS_SAME_CONSTRUCTOR} drivers from {t}")

    await fantasy_engine.save_team(
        user.id, body.drivers, session,
        constructor_ids=body.constructors or None,
        team_number=body.team_number,
        name=body.name,
        drs_boost_driver=body.drs_boost_driver,
        active_chip=body.active_chip,
    )
    return {
        "status": "ok",
        "team": body.drivers,
        "constructors": body.constructors,
        "team_number": body.team_number,
        "total_price": total_price,
    }


@router.get("/team")
async def get_team(
    team_number: int | None = None,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """Get a user's fantasy team. Accepts optional ?team_number= param. Requires auth."""
    team = await fantasy_engine.get_team(user.id, session, team_number=team_number)
    if not team:
        return {"team": None}
    return {"team": team}


@router.get("/teams")
async def get_all_teams(
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """Get all user teams (up to 3). Requires auth."""
    teams = await fantasy_engine.get_all_teams(user.id, session)
    return {"teams": teams}


@router.get("/settings")
async def get_settings(
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """Get user fantasy settings. Requires auth."""
    settings = await fantasy_engine.get_settings(user.id, session)
    if not settings:
        # Return defaults
        return {
            "active_team_number": 1,
            "transfers_used": 0,
            "free_transfers_remaining": FREE_TRANSFERS_PER_RACE,
            "chips_used": {},
            "season": 2026,
        }
    return settings


@router.put("/settings")
async def update_settings(
    body: SettingsUpdateRequest,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """Update user fantasy settings. Requires auth."""
    kwargs = {}
    if body.active_team_number is not None:
        if body.active_team_number < 1 or body.active_team_number > 3:
            raise HTTPException(400, "active_team_number must be 1, 2, or 3")
        kwargs["active_team_number"] = body.active_team_number
    if body.f1_fantasy_league_code is not None:
        kwargs["f1_fantasy_league_code"] = body.f1_fantasy_league_code
    result = await fantasy_engine.update_settings(user.id, session, **kwargs)
    return result


@router.post("/chips/activate")
async def activate_chip(
    body: ChipActivateRequest,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """Activate a chip for a round. Requires auth."""
    try:
        result = await fantasy_engine.activate_chip(user.id, session, body.chip, body.round_number)
        return result
    except ValueError as e:
        raise HTTPException(400, str(e))


@router.post("/drs/apply")
async def apply_drs_boost(
    body: DrsApplyRequest,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """Set DRS boost driver on a team. Requires auth."""
    try:
        result = await fantasy_engine.set_drs_boost(user.id, session, body.team_number, body.driver_number)
        return result
    except ValueError as e:
        raise HTTPException(400, str(e))


@router.post("/transfer")
async def make_transfer(
    body: TransferRequest,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """Make driver/constructor transfers. Requires auth."""
    try:
        result = await fantasy_engine.make_transfer(
            user.id, session,
            team_number=body.team_number,
            drivers_in=body.drivers_in,
            drivers_out=body.drivers_out,
            constructors_in=body.constructors_in or None,
            constructors_out=body.constructors_out or None,
        )
        return result
    except ValueError as e:
        raise HTTPException(400, str(e))


@router.get("/best-team/{round_number}")
async def get_best_team(round_number: int, season: int = 2025):
    """Get optimal team for a historical round. Public endpoint."""
    result = await fantasy_engine.get_best_team_for_round(season, round_number)
    return result


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


@router.get("/constructors")
async def get_fantasy_constructors():
    """Get available constructors with prices, expected points, and tier. Public endpoint."""
    return await fantasy_engine.get_available_constructors()


@router.get("/simulate")
async def get_simulation():
    """Run simulation for all drivers and constructors. Public endpoint."""
    return await fantasy_engine.run_monte_carlo()


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


@router.get("/chips/list")
async def get_chips_list():
    """Get all available chips with descriptions. Public endpoint."""
    return {"chips": CHIPS}


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


@router.get("/price-predictions")
async def get_price_predictions():
    """Get price change thresholds and predictions. Public endpoint."""
    result = await fantasy_engine.predict_price_changes()
    return result


@router.post("/import")
async def import_team(
    body: ImportRequest,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """Import team from official F1 Fantasy. Requires auth."""
    from app.services.f1_fantasy_import import f1_fantasy_importer

    result = await f1_fantasy_importer.import_team(body.cookie, team_no=body.slot)

    if "error" in result:
        raise HTTPException(400, result["error"])

    if body.save:
        drivers = result.get("drivers", [])
        constructors = result.get("constructors", [])
        if len(drivers) != MAX_DRIVERS_PER_TEAM:
            raise HTTPException(
                400,
                f"Imported team has {len(drivers)} drivers (need {MAX_DRIVERS_PER_TEAM}). "
                f"{len(result.get('unmapped', []))} player(s) could not be mapped.",
            )
        if constructors and len(constructors) != MAX_CONSTRUCTORS_PER_TEAM:
            raise HTTPException(
                400,
                f"Imported team has {len(constructors)} constructors (need {MAX_CONSTRUCTORS_PER_TEAM}).",
            )

        await fantasy_engine.save_team(
            user.id,
            drivers,
            session,
            constructor_ids=constructors or None,
            team_number=body.team_number,
            name="Imported Team",
            drs_boost_driver=result.get("drs_boost_driver"),
        )
        result["saved"] = True
        result["team_number"] = body.team_number

    return result


@router.post("/import/leagues")
async def import_leagues(
    body: ImportRequest,
    user: User = Depends(get_current_user),
):
    """Fetch user's F1 Fantasy leagues. Requires auth."""
    from app.services.f1_fantasy_import import f1_fantasy_importer

    result = await f1_fantasy_importer.get_my_leagues(body.cookie)
    if not result:
        raise HTTPException(400, "Could not fetch leagues. Cookie may be invalid or expired.")
    return result


# ── League-based sync (no user cookie needed) ────────────────────────


class ConnectRequest(BaseModel):
    cookie: str


class SyncTeamRequest(BaseModel):
    slot: int = 1
    team_number: int = 1
    save: bool = False


@router.post("/f1-connect")
async def f1_connect(
    body: ConnectRequest,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """
    Store the user's F1 Fantasy cookie and validate it.
    This enables importing teams directly from fantasy.formula1.com.
    """
    from app.services.f1_fantasy_import import f1_fantasy_importer

    # Validate the cookie
    validation = await f1_fantasy_importer.validate_cookie(body.cookie)
    if not validation.get("valid"):
        raise HTTPException(
            400,
            validation.get("error", "Cookie is invalid or expired."),
        )

    guid = validation.get("guid", "")

    # Try to fetch teams immediately
    teams_result = await f1_fantasy_importer.fetch_my_teams(body.cookie)

    # Try to find leagues
    leagues = await f1_fantasy_importer.get_my_leagues(body.cookie)

    # Store cookie in settings
    await fantasy_engine.update_settings(
        user.id, session,
        f1_fantasy_cookie=body.cookie,
    )

    return {
        "connected": True,
        "guid": guid,
        "leagues": leagues,
        "teams": teams_result.get("teams", []),
        "teams_error": teams_result.get("error"),
    }


@router.get("/f1-status")
async def f1_status(
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """Check if F1 Fantasy connection is active."""
    settings = await fantasy_engine.get_settings(user.id, session)
    if not settings:
        return {"connected": False}

    cookie = settings.get("f1_fantasy_cookie")
    if not cookie:
        return {"connected": False}

    from app.services.f1_fantasy_import import f1_fantasy_importer
    validation = await f1_fantasy_importer.validate_cookie(cookie)

    return {
        "connected": validation.get("valid", False),
        "guid": validation.get("guid"),
        "expired": not validation.get("valid", False),
    }


@router.get("/f1-league")
async def f1_league(
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """Get the user's F1 Fantasy leagues using stored cookie."""
    from app.services.f1_fantasy_import import f1_fantasy_importer

    settings = await fantasy_engine.get_settings(user.id, session)
    if not settings or not settings.get("f1_fantasy_cookie"):
        raise HTTPException(400, "Not connected to F1 Fantasy. Run setup first.")

    cookie = settings["f1_fantasy_cookie"]
    leagues = await f1_fantasy_importer.get_my_leagues(cookie)
    return {"leagues": leagues}


@router.post("/f1-sync-team")
async def f1_sync_team(
    body: SyncTeamRequest,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """
    Fetch teams from F1 Fantasy using stored cookie.
    If no user_global_id provided, fetches the authenticated user's own teams.
    """
    from app.services.f1_fantasy_import import f1_fantasy_importer

    settings = await fantasy_engine.get_settings(user.id, session)
    if not settings or not settings.get("f1_fantasy_cookie"):
        raise HTTPException(400, "Not connected to F1 Fantasy. Run setup first.")

    cookie = settings["f1_fantasy_cookie"]

    # Fetch user's own teams
    result = await f1_fantasy_importer.fetch_my_teams(cookie)
    if "error" in result:
        raise HTTPException(400, result["error"])

    teams = result.get("teams", [])

    # Find the requested team
    target = None
    for t in teams:
        if t.get("team_no") == body.slot:
            target = t
            break
    if not target and teams:
        target = teams[0]

    if not target:
        raise HTTPException(400, "No teams found.")

    if body.save:
        drivers = target.get("drivers", [])
        constructors = target.get("constructors", [])
        if len(drivers) != MAX_DRIVERS_PER_TEAM:
            raise HTTPException(
                400,
                f"Team has {len(drivers)} drivers (need {MAX_DRIVERS_PER_TEAM}). "
                f"{len(target.get('unmapped', []))} unmapped.",
            )
        await fantasy_engine.save_team(
            user.id, drivers, session,
            constructor_ids=constructors or None,
            team_number=body.team_number,
            name="Imported Team",
            drs_boost_driver=target.get("drs_boost_driver"),
        )
        target["saved"] = True
        target["team_number"] = body.team_number

    return {"teams": teams, "selected": target}


@router.get("/f1-players")
async def f1_players():
    """Get live player data from F1 Fantasy public feed. Includes prices, selection %, points."""
    import logging
    log = logging.getLogger(__name__)
    from app.services.f1_fantasy_import import f1_fantasy_importer
    from app.utils.f1_constants import TEAM_COLORS, CONSTRUCTORS_2026

    try:
        players = await f1_fantasy_importer.get_players()
    except Exception as e:
        log.exception("f1-players: get_players() failed")
        raise HTTPException(502, f"Could not fetch player data: {e}")

    if not players:
        raise HTTPException(502, "Could not fetch F1 Fantasy player data.")

    drivers = []
    constructors = []
    for p in players:
        info = f1_fantasy_importer._map_player(p)
        if not info:
            continue

        value = p.get("Value") or 0
        old_value = p.get("OldPlayerValue") or 0
        team_name = info.get("team", p.get("TeamName", ""))
        team_color = TEAM_COLORS.get(team_name, {}).get("hex", "#666666")

        def _num(v) -> float:
            try:
                return float(v) if v is not None else 0.0
            except (ValueError, TypeError):
                return 0.0

        entry = {
            "type": info.get("type"),
            "name": info.get("name", ""),
            "tla": info.get("tla", ""),
            "team_name": team_name,
            "team_color": team_color,
            "price": value,
            "old_price": old_value,
            "price_change": round(value - old_value, 1),
            "selected_pct": _num(p.get("SelectedPercentage")),
            "captain_pct": _num(p.get("CaptainSelectedPercentage")),
            "gameday_points": _num(p.get("GamedayPoints")),
            "overall_points": _num(p.get("OverallPpints") or p.get("OverallPoints")),
            "projected_points": _num(p.get("ProjectedGamedayPoints")),
            "status": str(p.get("Status") or ""),
            "is_active": str(p.get("IsActive", "1")) == "1",
        }

        if info["type"] == "constructor":
            cid = info.get("mapped_to", "")
            entry["constructor_id"] = cid
            cinfo = CONSTRUCTORS_2026.get(cid, {})
            entry["team_color"] = cinfo.get("color", team_color)
            constructors.append(entry)
        else:
            entry["driver_number"] = info.get("mapped_to")
            drivers.append(entry)

    return {"drivers": drivers, "constructors": constructors}


@router.get("/f1-stats")
async def f1_stats():
    """Get round-by-round statistics from F1 Fantasy API."""
    from app.services.f1_fantasy_import import f1_fantasy_importer
    driver_stats = await f1_fantasy_importer.get_driver_statistics()
    constructor_stats = await f1_fantasy_importer.get_constructor_statistics()
    return {
        "drivers": driver_stats or [],
        "constructors": constructor_stats or [],
    }


