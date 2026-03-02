from __future__ import annotations

import logging
import secrets
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.fantasy.scoring import (
    SCORING_RULES, DRIVER_PRICES, TEAM_BUDGET,
    CONSTRUCTOR_PRICES, CONSTRUCTOR_EXPECTED_POINTS,
    CHIPS, FREE_TRANSFERS_PER_RACE, TRANSFER_PENALTY,
    get_driver_tier, get_constructor_tier,
)
from app.fantasy.optimizer import optimize_team
from app.fantasy.monte_carlo import monte_carlo
from app.fantasy.budget_optimizer import optimize_team_monte_carlo
from app.fantasy.chip_optimizer import chip_optimizer
from app.fantasy.price_changes import predict_all_changes, get_thresholds
from app.models.database import (
    FantasyTeam, FantasyScore, FantasyLeague, LeagueMembership,
    FantasyPrice, FantasyHistoricalScore, FantasySettings, async_session,
)
from app.services.openf1_client import openf1
from app.services.prediction_engine import prediction_engine
from app.utils.f1_constants import DRIVERS_2026, CONSTRUCTORS_2026

logger = logging.getLogger(__name__)


class FantasyEngine:
    """Fantasy F1 team optimization and scoring."""

    async def get_available_drivers(self) -> list[dict]:
        """Get list of available drivers with prices, predicted points, and tier."""
        # Try to fetch real prices from F1 Fantasy API
        real_prices: dict[int, float] = {}
        try:
            from app.services.f1_fantasy_import import f1_fantasy_importer
            players = await f1_fantasy_importer.get_players()
            if players:
                for p in players:
                    mapped = f1_fantasy_importer._map_player(p)
                    if mapped and mapped.get("type") == "driver":
                        real_prices[mapped["mapped_to"]] = p.get("Value", 0)
        except Exception as e:
            logger.warning(f"Failed to fetch real F1 Fantasy prices: {e}")

        price_source = real_prices if real_prices else DRIVER_PRICES

        # Try fantasy-specific predictions first
        fantasy_preds = []
        try:
            fantasy_preds = await prediction_engine.predict_fantasy_points()
        except Exception as e:
            logger.warning(f"Failed to get fantasy predictions: {e}")

        if fantasy_preds:
            pred_map = {p["driver_number"]: p for p in fantasy_preds}
            drivers = []
            for num, info in DRIVERS_2026.items():
                pred = pred_map.get(num, {})
                expected_pts = pred.get("expected_points", 0)
                predicted_pos = pred.get("pred_finish_position", 10)
                drivers.append({
                    "driver_number": num,
                    "name_acronym": info["abbreviation"],
                    "full_name": info["name"],
                    "team_name": info["team"],
                    "price": price_source.get(num, DRIVER_PRICES.get(num, 10.0)),
                    "predicted_points": expected_pts,
                    "form_score": round(max(0, (21 - predicted_pos) / 20), 2),
                    "tier": get_driver_tier(num),
                    "breakdown": pred.get("breakdown"),
                })
            drivers.sort(key=lambda d: d["price"], reverse=True)
            return drivers

        # Fallback to race position model
        session = await openf1.get_latest_session()
        race_predictions = []
        if session:
            try:
                race_predictions = await prediction_engine.predict_race(session["session_key"])
            except Exception as e:
                logger.warning(f"Failed to get predictions for fantasy: {e}")

        pred_map = {p["driver_number"]: p for p in race_predictions}

        drivers = []
        for num, info in DRIVERS_2026.items():
            pred = pred_map.get(num, {})
            predicted_pos = pred.get("predicted_position", 10)
            expected_pts = SCORING_RULES["finish_position"].get(predicted_pos, 0)

            drivers.append({
                "driver_number": num,
                "name_acronym": info["abbreviation"],
                "full_name": info["name"],
                "team_name": info["team"],
                "price": price_source.get(num, DRIVER_PRICES.get(num, 10.0)),
                "predicted_points": expected_pts,
                "form_score": round(max(0, (21 - predicted_pos) / 20), 2),
                "tier": get_driver_tier(num),
            })

        drivers.sort(key=lambda d: d["price"], reverse=True)
        return drivers

    async def get_available_constructors(self) -> list[dict]:
        """Get list of available constructors with prices, expected points, and tier."""
        # Try to fetch real prices from F1 Fantasy API
        real_prices: dict[str, float] = {}
        try:
            from app.services.f1_fantasy_import import f1_fantasy_importer
            players = await f1_fantasy_importer.get_players()
            if players:
                for p in players:
                    mapped = f1_fantasy_importer._map_player(p)
                    if mapped and mapped.get("type") == "constructor":
                        real_prices[mapped["mapped_to"]] = p.get("Value", 0)
        except Exception as e:
            logger.warning(f"Failed to fetch real F1 Fantasy constructor prices: {e}")

        price_source = real_prices if real_prices else CONSTRUCTOR_PRICES

        constructors = []
        for cid, info in CONSTRUCTORS_2026.items():
            driver_abbrevs = []
            for dnum in info.get("drivers", []):
                d = DRIVERS_2026.get(dnum)
                if d:
                    driver_abbrevs.append(d["abbreviation"])
            constructors.append({
                "constructor_id": cid,
                "name": info["name"],
                "full_name": info.get("full_name", info["name"]),
                "color": info["color"],
                "engine": info.get("engine", ""),
                "drivers": info.get("drivers", []),
                "driver_abbreviations": driver_abbrevs,
                "price": price_source.get(cid, CONSTRUCTOR_PRICES.get(cid, 10.0)),
                "expected_points": CONSTRUCTOR_EXPECTED_POINTS.get(cid, 0),
                "tier": get_constructor_tier(cid),
            })
        constructors.sort(key=lambda c: c["price"], reverse=True)
        return constructors

    async def optimize_team_selection(self) -> dict:
        """Get ML-optimized team recommendation."""
        session = await openf1.get_latest_session()

        if not session:
            predicted_points = {num: price * 0.4 for num, price in DRIVER_PRICES.items()}
        else:
            try:
                race_predictions = await prediction_engine.predict_race(session["session_key"])
                predicted_points = {}
                for pred in race_predictions:
                    pos = pred["predicted_position"]
                    pts = SCORING_RULES["finish_position"].get(pos, 0)
                    predicted_points[pred["driver_number"]] = pts
            except Exception:
                predicted_points = {num: price * 0.4 for num, price in DRIVER_PRICES.items()}

        constructor_pts = {cid: pts for cid, pts in CONSTRUCTOR_EXPECTED_POINTS.items()}
        return optimize_team(predicted_points, constructor_points=constructor_pts)

    async def run_monte_carlo(self) -> dict:
        """Run Monte Carlo simulation for all drivers and constructors."""
        driver_results: list[dict] = []

        try:
            fantasy_preds = await prediction_engine.predict_fantasy_points()
            if fantasy_preds:
                fantasy_preds = [p for p in fantasy_preds if p["driver_number"] in DRIVERS_2026]
                if fantasy_preds:
                    residual_std = 3.0
                    if prediction_engine.delta_model is not None:
                        residual_std = getattr(prediction_engine.delta_model, "residual_std", 3.0)
                    driver_results = monte_carlo.simulate_fantasy(fantasy_preds, residual_std=residual_std)
                    for r in driver_results:
                        info = DRIVERS_2026.get(r["driver_number"], {})
                        r["name_acronym"] = info.get("abbreviation", "")
                        r["full_name"] = info.get("name", "")
                        r["team_name"] = info.get("team", "")
                    sim_nums = {r["driver_number"] for r in driver_results}
                    missing = [num for num in DRIVERS_2026 if num not in sim_nums]
                    if missing:
                        fallback_preds = {}
                        sorted_drivers = sorted(DRIVER_PRICES.items(), key=lambda x: x[1], reverse=True)
                        for i, (num, _) in enumerate(sorted_drivers):
                            if num in missing:
                                fallback_preds[num] = 10 + i
                        if fallback_preds:
                            extra = monte_carlo.simulate(fallback_preds)
                            for r in extra:
                                info = DRIVERS_2026.get(r["driver_number"], {})
                                r["name_acronym"] = info.get("abbreviation", "")
                                r["full_name"] = info.get("name", "")
                                r["team_name"] = info.get("team", "")
                            driver_results.extend(extra)
        except Exception as e:
            logger.warning(f"Fantasy Monte Carlo failed, falling back: {e}")

        if not driver_results:
            session = await openf1.get_latest_session()
            driver_predictions = {}

            if session:
                try:
                    race_predictions = await prediction_engine.predict_race(session["session_key"])
                    for pred in race_predictions:
                        driver_predictions[pred["driver_number"]] = pred.get("predicted_position", 10)
                except Exception:
                    pass

            if not driver_predictions:
                sorted_drivers = sorted(DRIVER_PRICES.items(), key=lambda x: x[1], reverse=True)
                for i, (num, _) in enumerate(sorted_drivers):
                    driver_predictions[num] = i + 1

            driver_results = monte_carlo.simulate(driver_predictions)
            for r in driver_results:
                info = DRIVERS_2026.get(r["driver_number"], {})
                r["name_acronym"] = info.get("abbreviation", "")
                r["full_name"] = info.get("name", "")
                r["team_name"] = info.get("team", "")

        constructor_results = monte_carlo.simulate_constructors()

        return {"drivers": driver_results, "constructors": constructor_results}

    async def get_optimized_team_mc(self, mode: str = "value") -> dict:
        """Get team optimized using Monte Carlo expected points."""
        mc_data = await self.run_monte_carlo()
        expected = {r["driver_number"]: r for r in mc_data["drivers"]}
        constructor_expected = {r["constructor_id"]: r for r in mc_data["constructors"]}
        return optimize_team_monte_carlo(expected, mode=mode, constructor_expected=constructor_expected)

    async def get_chip_recommendations(self, chips_used: dict | None = None) -> list[dict]:
        """Get chip usage recommendations."""
        remaining_rounds = list(range(1, 25))
        chip_inventory = {}
        for chip_key in CHIPS:
            if chips_used and chip_key in chips_used:
                chip_inventory[chip_key] = False
            else:
                chip_inventory[chip_key] = True
        return chip_optimizer.recommend_chips(remaining_rounds, chip_inventory)

    async def get_driver_statistics(self) -> list[dict]:
        """Get driver statistics summary."""
        drivers = await self.get_available_drivers()
        mc_data = await self.run_monte_carlo()
        mc_map = {r["driver_number"]: r for r in mc_data["drivers"]}

        stats = []
        for d in drivers:
            mc = mc_map.get(d["driver_number"], {})
            stats.append({
                **d,
                "mean_points": mc.get("mean_points", 0),
                "std_dev": mc.get("std_dev", 0),
                "p10": mc.get("p10", 0),
                "p90": mc.get("p90", 0),
                "value": mc.get("value", 0),
                "consistency": round(1 - mc.get("std_dev", 10) / 20, 2),
            })
        return stats

    async def predict_price_changes(self, round_scores: dict | None = None) -> dict:
        """Predict price changes after a round.

        If round_scores is None, returns thresholds only.
        If provided, returns predicted changes for all entities.
        """
        if round_scores is None:
            return {"thresholds": get_thresholds(), "predictions": []}
        predictions = predict_all_changes(round_scores)
        return {"thresholds": get_thresholds(), "predictions": predictions}

    async def get_price_history(self) -> list[dict]:
        """Get price history for all drivers."""
        async with async_session() as session:
            result = await session.execute(
                select(FantasyPrice).order_by(FantasyPrice.effective_date)
            )
            prices = result.scalars().all()
            if not prices:
                return [
                    {
                        "driver_number": num,
                        "season": 2026,
                        "round": 0,
                        "price": price,
                        "price_change": 0,
                        "name_acronym": DRIVERS_2026.get(num, {}).get("abbreviation", ""),
                    }
                    for num, price in DRIVER_PRICES.items()
                ]
            return [
                {
                    "driver_number": p.driver_number,
                    "season": p.season,
                    "round": p.round,
                    "price": p.price,
                    "price_change": p.price_change,
                }
                for p in prices
            ]

    async def create_league(self, name: str, user_id: int, session: AsyncSession) -> dict:
        """Create a new fantasy league."""
        invite_code = secrets.token_urlsafe(8)
        league = FantasyLeague(
            name=name,
            invite_code=invite_code,
            created_by=user_id,
            season=2026,
        )
        session.add(league)
        membership = LeagueMembership(league_id=0, user_id=user_id)
        session.add(league)
        await session.flush()
        membership.league_id = league.id
        session.add(membership)
        await session.commit()
        return {"id": league.id, "name": league.name, "invite_code": league.invite_code}

    async def join_league(self, invite_code: str, user_id: int, session: AsyncSession) -> dict | None:
        """Join a league by invite code."""
        result = await session.execute(
            select(FantasyLeague).where(FantasyLeague.invite_code == invite_code)
        )
        league = result.scalar_one_or_none()
        if not league:
            return None

        existing = await session.execute(
            select(LeagueMembership).where(
                LeagueMembership.league_id == league.id,
                LeagueMembership.user_id == user_id,
            )
        )
        if existing.scalar_one_or_none():
            return {"id": league.id, "name": league.name, "already_member": True}

        membership = LeagueMembership(league_id=league.id, user_id=user_id)
        session.add(membership)
        await session.commit()
        return {"id": league.id, "name": league.name, "invite_code": invite_code}

    async def get_league(self, invite_code: str, session: AsyncSession) -> dict | None:
        """Get league info with members."""
        result = await session.execute(
            select(FantasyLeague).where(FantasyLeague.invite_code == invite_code)
        )
        league = result.scalar_one_or_none()
        if not league:
            return None

        members_result = await session.execute(
            select(LeagueMembership).where(LeagueMembership.league_id == league.id)
        )
        members = members_result.scalars().all()
        return {
            "id": league.id,
            "name": league.name,
            "invite_code": league.invite_code,
            "member_count": len(members),
        }

    async def get_historical_scores(self, season: int) -> list[dict]:
        """Get historical fantasy scores by round."""
        async with async_session() as session:
            result = await session.execute(
                select(FantasyHistoricalScore)
                .where(FantasyHistoricalScore.season == season)
                .order_by(FantasyHistoricalScore.round)
            )
            scores = result.scalars().all()
            return [
                {
                    "season": s.season,
                    "round": s.round,
                    "driver_number": s.driver_number,
                    "points": s.points,
                    "breakdown": s.breakdown_json,
                }
                for s in scores
            ]

    # ── Multi-team CRUD ──────────────────────────────────────────────

    async def save_team(
        self,
        user_id: int,
        driver_numbers: list[int],
        session: AsyncSession,
        constructor_ids: list[str] | None = None,
        team_number: int = 1,
        name: str | None = None,
        drs_boost_driver: int | None = None,
        active_chip: str | None = None,
    ):
        """Persist a user's fantasy team selection (by team_number)."""
        total_price = sum(DRIVER_PRICES.get(d, 0) for d in driver_numbers)
        if constructor_ids:
            total_price += sum(CONSTRUCTOR_PRICES.get(c, 0) for c in constructor_ids)
        team_json: dict = {
            "drivers": driver_numbers,
            "constructors": constructor_ids or [],
            "total_price": total_price,
        }
        result = await session.execute(
            select(FantasyTeam).where(
                FantasyTeam.user_id == user_id,
                FantasyTeam.season == 2026,
                FantasyTeam.team_number == team_number,
            )
        )
        existing = result.scalar_one_or_none()
        if existing:
            existing.team_json = team_json
            existing.name = name
            existing.drs_boost_driver = drs_boost_driver
            existing.active_chip = active_chip
        else:
            team = FantasyTeam(
                user_id=user_id,
                season=2026,
                team_number=team_number,
                name=name,
                team_json=team_json,
                drs_boost_driver=drs_boost_driver,
                active_chip=active_chip,
            )
            session.add(team)
        await session.commit()

    async def get_team(self, user_id: int, session: AsyncSession, team_number: int | None = None) -> Optional[dict]:
        """Retrieve a user's fantasy team. If team_number is None, use active from settings."""
        if team_number is None:
            settings = await self.get_settings(user_id, session)
            team_number = settings.get("active_team_number", 1) if settings else 1

        result = await session.execute(
            select(FantasyTeam).where(
                FantasyTeam.user_id == user_id,
                FantasyTeam.season == 2026,
                FantasyTeam.team_number == team_number,
            )
        )
        team = result.scalar_one_or_none()
        if not team:
            return None
        data = dict(team.team_json) if team.team_json else {}
        data["team_number"] = team.team_number
        data["name"] = team.name
        data["drs_boost_driver"] = team.drs_boost_driver
        data["active_chip"] = team.active_chip
        return data

    async def get_all_teams(self, user_id: int, session: AsyncSession) -> list[dict]:
        """Return all teams (up to 3) for a user."""
        result = await session.execute(
            select(FantasyTeam).where(
                FantasyTeam.user_id == user_id,
                FantasyTeam.season == 2026,
            ).order_by(FantasyTeam.team_number)
        )
        teams = result.scalars().all()
        out = []
        for t in teams:
            data = dict(t.team_json) if t.team_json else {}
            data["team_number"] = t.team_number
            data["name"] = t.name
            data["drs_boost_driver"] = t.drs_boost_driver
            data["active_chip"] = t.active_chip
            out.append(data)
        return out

    # ── Settings ─────────────────────────────────────────────────────

    async def get_settings(self, user_id: int, session: AsyncSession) -> dict | None:
        result = await session.execute(
            select(FantasySettings).where(FantasySettings.user_id == user_id)
        )
        s = result.scalar_one_or_none()
        if not s:
            return None
        return {
            "active_team_number": s.active_team_number,
            "transfers_used": s.transfers_used,
            "free_transfers_remaining": s.free_transfers_remaining,
            "chips_used": s.chips_used_json or {},
            "season": s.season,
            "f1_fantasy_league_code": s.f1_fantasy_league_code,
            "f1_fantasy_cookie": s.f1_fantasy_cookie,
            "f1_fantasy_league_id": s.f1_fantasy_league_id,
        }

    async def update_settings(self, user_id: int, session: AsyncSession, **kwargs) -> dict:
        result = await session.execute(
            select(FantasySettings).where(FantasySettings.user_id == user_id)
        )
        s = result.scalar_one_or_none()
        if not s:
            s = FantasySettings(user_id=user_id, season=2026)
            session.add(s)
        for key, val in kwargs.items():
            if key == "chips_used":
                s.chips_used_json = val
            elif hasattr(s, key):
                setattr(s, key, val)
        await session.commit()
        return {
            "active_team_number": s.active_team_number,
            "transfers_used": s.transfers_used,
            "free_transfers_remaining": s.free_transfers_remaining,
            "chips_used": s.chips_used_json or {},
            "season": s.season,
            "f1_fantasy_league_code": s.f1_fantasy_league_code,
            "f1_fantasy_cookie": s.f1_fantasy_cookie,
            "f1_fantasy_league_id": s.f1_fantasy_league_id,
        }

    # ── Chips ────────────────────────────────────────────────────────

    async def activate_chip(self, user_id: int, session: AsyncSession, chip: str, round_number: int) -> dict:
        if chip not in CHIPS:
            raise ValueError(f"Unknown chip: {chip}")
        settings = await self.get_settings(user_id, session) or {}
        chips_used = dict(settings.get("chips_used", {}))
        if chip in chips_used:
            raise ValueError(f"Chip '{chip}' already used in round {chips_used[chip]}")
        chips_used[chip] = round_number
        return await self.update_settings(user_id, session, chips_used=chips_used)

    # ── DRS Boost ────────────────────────────────────────────────────

    async def set_drs_boost(self, user_id: int, session: AsyncSession, team_number: int, driver_number: int) -> dict:
        team_data = await self.get_team(user_id, session, team_number=team_number)
        if not team_data:
            raise ValueError(f"Team {team_number} not found")
        if driver_number not in team_data.get("drivers", []):
            raise ValueError(f"Driver {driver_number} is not on team {team_number}")
        result = await session.execute(
            select(FantasyTeam).where(
                FantasyTeam.user_id == user_id,
                FantasyTeam.season == 2026,
                FantasyTeam.team_number == team_number,
            )
        )
        team = result.scalar_one_or_none()
        if team:
            team.drs_boost_driver = driver_number
            await session.commit()
        return {"team_number": team_number, "drs_boost_driver": driver_number}

    # ── Transfers ────────────────────────────────────────────────────

    async def make_transfer(
        self,
        user_id: int,
        session: AsyncSession,
        team_number: int,
        drivers_in: list[int],
        drivers_out: list[int],
        constructors_in: list[str] | None = None,
        constructors_out: list[str] | None = None,
    ) -> dict:
        team_data = await self.get_team(user_id, session, team_number=team_number)
        if not team_data:
            raise ValueError(f"Team {team_number} not found")

        current_drivers = list(team_data.get("drivers", []))
        current_constructors = list(team_data.get("constructors", []))

        for d in drivers_out:
            if d in current_drivers:
                current_drivers.remove(d)
        current_drivers.extend(drivers_in)

        if constructors_out:
            for c in constructors_out:
                if c in current_constructors:
                    current_constructors.remove(c)
        if constructors_in:
            current_constructors.extend(constructors_in)

        num_transfers = len(drivers_in) + len(constructors_in or [])

        settings = await self.get_settings(user_id, session) or {}
        free_remaining = settings.get("free_transfers_remaining", FREE_TRANSFERS_PER_RACE)
        penalty = 0
        excess = max(0, num_transfers - free_remaining)
        if excess > 0:
            penalty = excess * abs(TRANSFER_PENALTY)

        new_free = max(0, free_remaining - num_transfers)
        await self.update_settings(
            user_id, session,
            free_transfers_remaining=new_free,
            transfers_used=settings.get("transfers_used", 0) + num_transfers,
        )

        await self.save_team(
            user_id, current_drivers, session,
            constructor_ids=current_constructors,
            team_number=team_number,
            name=team_data.get("name"),
            drs_boost_driver=team_data.get("drs_boost_driver"),
        )

        return {
            "team_number": team_number,
            "transfers": num_transfers,
            "penalty": penalty,
            "free_remaining": new_free,
        }

    # ── Best team for round ──────────────────────────────────────────

    async def get_best_team_for_round(self, season: int, round_number: int) -> dict:
        async with async_session() as session:
            result = await session.execute(
                select(FantasyHistoricalScore)
                .where(
                    FantasyHistoricalScore.season == season,
                    FantasyHistoricalScore.round == round_number,
                )
                .order_by(FantasyHistoricalScore.points.desc())
            )
            scores = result.scalars().all()
            if not scores:
                return {"round": round_number, "drivers": [], "constructors": [], "total_points": 0}

            top_drivers = scores[:5]
            return {
                "round": round_number,
                "drivers": [
                    {"driver_number": s.driver_number, "points": s.points}
                    for s in top_drivers
                ],
                "constructors": [],
                "total_points": sum(s.points for s in top_drivers),
            }

    async def get_scores(self, user_id: int, session: AsyncSession) -> list[dict]:
        """Get a user's score history."""
        result = await session.execute(
            select(FantasyScore)
            .where(FantasyScore.user_id == user_id)
            .order_by(FantasyScore.created_at.desc())
        )
        scores = result.scalars().all()
        return [
            {
                "session_key": s.session_key,
                "score": s.score,
                "breakdown": s.breakdown_json,
                "created_at": s.created_at.isoformat() if s.created_at else None,
            }
            for s in scores
        ]


fantasy_engine = FantasyEngine()
