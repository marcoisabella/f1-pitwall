from __future__ import annotations

import logging
import secrets
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.fantasy.scoring import SCORING_RULES, DRIVER_PRICES, TEAM_BUDGET
from app.fantasy.optimizer import optimize_team
from app.fantasy.monte_carlo import monte_carlo
from app.fantasy.budget_optimizer import optimize_team_monte_carlo
from app.fantasy.chip_optimizer import chip_optimizer
from app.models.database import (
    FantasyTeam, FantasyScore, FantasyLeague, LeagueMembership,
    FantasyPrice, FantasyHistoricalScore, async_session,
)
from app.services.openf1_client import openf1
from app.services.prediction_engine import prediction_engine
from app.utils.f1_constants import DRIVERS_2025

logger = logging.getLogger(__name__)


class FantasyEngine:
    """Fantasy F1 team optimization and scoring."""

    async def get_available_drivers(self) -> list[dict]:
        """Get list of available drivers with prices and predicted points."""
        session = await openf1.get_latest_session()
        race_predictions = []
        if session:
            try:
                race_predictions = await prediction_engine.predict_race(session["session_key"])
            except Exception as e:
                logger.warning(f"Failed to get predictions for fantasy: {e}")

        pred_map = {p["driver_number"]: p for p in race_predictions}

        drivers = []
        for num, info in DRIVERS_2025.items():
            pred = pred_map.get(num, {})
            predicted_pos = pred.get("predicted_position", 10)
            expected_pts = SCORING_RULES["finish_position"].get(predicted_pos, 0)

            drivers.append({
                "driver_number": num,
                "name_acronym": info["abbreviation"],
                "full_name": info["name"],
                "team_name": info["team"],
                "price": DRIVER_PRICES.get(num, 10.0),
                "predicted_points": expected_pts,
                "form_score": round(max(0, (21 - predicted_pos) / 20), 2),
            })

        drivers.sort(key=lambda d: d["price"], reverse=True)
        return drivers

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

        return optimize_team(predicted_points)

    async def run_monte_carlo(self) -> list[dict]:
        """Run Monte Carlo simulation for all drivers."""
        session = await openf1.get_latest_session()
        driver_predictions = {}

        if session:
            try:
                race_predictions = await prediction_engine.predict_race(session["session_key"])
                for pred in race_predictions:
                    driver_predictions[pred["driver_number"]] = pred.get("predicted_position", 10)
            except Exception:
                pass

        # Fallback: estimate from prices
        if not driver_predictions:
            sorted_drivers = sorted(DRIVER_PRICES.items(), key=lambda x: x[1], reverse=True)
            for i, (num, _) in enumerate(sorted_drivers):
                driver_predictions[num] = i + 1

        results = monte_carlo.simulate(driver_predictions)
        # Enrich with driver names
        for r in results:
            info = DRIVERS_2025.get(r["driver_number"], {})
            r["name_acronym"] = info.get("abbreviation", "")
            r["full_name"] = info.get("name", "")
            r["team_name"] = info.get("team", "")

        return results

    async def get_optimized_team_mc(self, mode: str = "value") -> dict:
        """Get team optimized using Monte Carlo expected points."""
        mc_results = await self.run_monte_carlo()
        expected = {r["driver_number"]: r for r in mc_results}
        return optimize_team_monte_carlo(expected, mode=mode)

    async def get_chip_recommendations(self, remaining_rounds: list[int] | None = None) -> list[dict]:
        """Get chip usage recommendations."""
        if remaining_rounds is None:
            remaining_rounds = list(range(1, 25))
        chip_inventory = {
            "drsBoost": True,
            "wildcard": True,
            "limitless": True,
            "extraDrs": True,
        }
        return chip_optimizer.recommend_chips(remaining_rounds, chip_inventory)

    async def get_driver_statistics(self) -> list[dict]:
        """Get driver statistics summary."""
        drivers = await self.get_available_drivers()
        mc_results = await self.run_monte_carlo()
        mc_map = {r["driver_number"]: r for r in mc_results}

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

    async def get_price_history(self) -> list[dict]:
        """Get price history for all drivers."""
        async with async_session() as session:
            result = await session.execute(
                select(FantasyPrice).order_by(FantasyPrice.effective_date)
            )
            prices = result.scalars().all()
            if not prices:
                # Return current prices as initial data
                return [
                    {
                        "driver_number": num,
                        "season": 2026,
                        "round": 0,
                        "price": price,
                        "price_change": 0,
                        "name_acronym": DRIVERS_2025.get(num, {}).get("abbreviation", ""),
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
        # Auto-join creator
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

        # Check if already a member
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

    async def save_team(self, user_id: int, driver_numbers: list[int], session: AsyncSession):
        """Persist a user's fantasy team selection."""
        team_json = {
            "drivers": driver_numbers,
            "total_price": sum(DRIVER_PRICES.get(d, 0) for d in driver_numbers),
        }
        result = await session.execute(
            select(FantasyTeam).where(
                FantasyTeam.user_id == user_id,
                FantasyTeam.season == 2026,
            )
        )
        existing = result.scalar_one_or_none()
        if existing:
            existing.team_json = team_json
        else:
            team = FantasyTeam(user_id=user_id, season=2026, team_json=team_json)
            session.add(team)
        await session.commit()

    async def get_team(self, user_id: int, session: AsyncSession) -> Optional[dict]:
        """Retrieve a user's current fantasy team."""
        result = await session.execute(
            select(FantasyTeam).where(
                FantasyTeam.user_id == user_id,
                FantasyTeam.season == 2026,
            )
        )
        team = result.scalar_one_or_none()
        if not team:
            return None
        return team.team_json

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
