from __future__ import annotations

import logging
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.fantasy.scoring import SCORING_RULES, DRIVER_PRICES, TEAM_BUDGET
from app.fantasy.optimizer import optimize_team
from app.models.database import FantasyTeam, FantasyScore
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
            # Convert position to expected points
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
            # Default: estimate points from prices
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

    async def save_team(self, user_id: int, driver_numbers: list[int], session: AsyncSession):
        """Persist a user's fantasy team selection."""
        team_json = {
            "drivers": driver_numbers,
            "total_price": sum(DRIVER_PRICES.get(d, 0) for d in driver_numbers),
        }
        result = await session.execute(
            select(FantasyTeam).where(
                FantasyTeam.user_id == user_id,
                FantasyTeam.season == 2025,
            )
        )
        existing = result.scalar_one_or_none()
        if existing:
            existing.team_json = team_json
        else:
            team = FantasyTeam(user_id=user_id, season=2025, team_json=team_json)
            session.add(team)
        await session.commit()

    async def get_team(self, user_id: int, session: AsyncSession) -> Optional[dict]:
        """Retrieve a user's current fantasy team."""
        result = await session.execute(
            select(FantasyTeam).where(
                FantasyTeam.user_id == user_id,
                FantasyTeam.season == 2025,
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
