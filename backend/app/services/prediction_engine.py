from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Any, Optional

import numpy as np

from app.fantasy.scoring import SCORING_RULES
from app.services.openf1_client import openf1
from app.utils.f1_constants import DRIVERS_2026, TIRE_COMPOUNDS

logger = logging.getLogger(__name__)

MODEL_DIR = Path(__file__).parent.parent / "ml" / "saved_models"


class PredictionEngine:
    """ML-based race outcome predictions."""

    def __init__(self):
        self.race_model = None
        self.pit_model = None
        self.quali_model = None
        self.delta_model = None
        self.fl_model = None
        self.dnf_model = None
        self.driver_rolling_stats: dict[str, Any] = {}
        self._load_models()

    def _load_models(self):
        race_path = MODEL_DIR / "race_position_model.joblib"
        pit_path = MODEL_DIR / "pit_stop_model.joblib"
        quali_path = MODEL_DIR / "qualifying_model.joblib"
        delta_path = MODEL_DIR / "position_delta_model.joblib"
        fl_path = MODEL_DIR / "fastest_lap_model.joblib"
        dnf_path = MODEL_DIR / "dnf_model.joblib"
        stats_path = MODEL_DIR / "driver_rolling_stats.json"

        if race_path.exists():
            try:
                from app.ml.models.race_predictor import RacePositionPredictor
                self.race_model = RacePositionPredictor.load(race_path)
                logger.info("Race position model loaded")
            except Exception as e:
                logger.error(f"Failed to load race model: {e}")
        else:
            logger.warning("No race position model found — using fallback predictions")

        if pit_path.exists():
            try:
                from app.ml.models.pit_stop_predictor import PitStopWindowPredictor
                self.pit_model = PitStopWindowPredictor.load(pit_path)
                logger.info("Pit stop model loaded")
            except Exception as e:
                logger.error(f"Failed to load pit model: {e}")
        else:
            logger.warning("No pit stop model found — using fallback strategy")

        # Fantasy component models (lazy imports — xgboost may not be installed)
        if quali_path.exists():
            try:
                from app.ml.models.qualifying_predictor import QualifyingPredictor
                self.quali_model = QualifyingPredictor.load(quali_path)
                logger.info("Qualifying model loaded")
            except Exception as e:
                logger.error(f"Failed to load qualifying model: {e}")

        if delta_path.exists():
            try:
                from app.ml.models.position_delta_predictor import PositionDeltaPredictor
                self.delta_model = PositionDeltaPredictor.load(delta_path)
                logger.info("Position delta model loaded")
            except Exception as e:
                logger.error(f"Failed to load position delta model: {e}")

        if fl_path.exists():
            try:
                from app.ml.models.fastest_lap_predictor import FastestLapPredictor
                self.fl_model = FastestLapPredictor.load(fl_path)
                logger.info("Fastest lap model loaded")
            except Exception as e:
                logger.error(f"Failed to load fastest lap model: {e}")

        if dnf_path.exists():
            try:
                from app.ml.models.dnf_predictor import DNFPredictor
                self.dnf_model = DNFPredictor.load(dnf_path)
                logger.info("DNF model loaded")
            except Exception as e:
                logger.error(f"Failed to load DNF model: {e}")

        if stats_path.exists():
            try:
                with open(stats_path) as f:
                    self.driver_rolling_stats = json.load(f)
                logger.info("Driver rolling stats loaded")
            except Exception as e:
                logger.error(f"Failed to load rolling stats: {e}")

    async def predict_race(self, session_key: int) -> list[dict]:
        """Predict finishing order for current/upcoming race."""
        drivers = await openf1.get_drivers(session_key)
        positions = await openf1.get_positions(session_key)
        weather = await openf1.get_weather(session_key)

        if not drivers:
            return []

        # Get latest position per driver
        latest_positions: dict[int, int] = {}
        for p in positions:
            num = p.get("driver_number")
            pos = p.get("position")
            if num and pos:
                latest_positions[num] = pos

        # Weather features
        is_wet = 0
        air_temp = 25.0
        track_temp = 35.0
        if weather:
            latest_w = weather[-1]
            is_wet = 1 if latest_w.get("rainfall") else 0
            air_temp = latest_w.get("air_temperature", 25.0)
            track_temp = latest_w.get("track_temperature", 35.0)

        if self.race_model is None:
            return self._fallback_race_prediction(drivers, latest_positions)

        predictions = []
        for d in drivers:
            num = d.get("driver_number")
            if not num:
                continue

            grid = latest_positions.get(num, 10)
            features = np.array([[
                grid,                   # grid_position
                grid,                   # qualifying_position
                grid,                   # driver_avg_finish_last_5 (approximate)
                grid,                   # team_avg_finish_last_5
                0.05,                   # driver_dnf_rate
                grid,                   # circuit_driver_avg
                is_wet,
                air_temp,
                track_temp,
            ]], dtype=np.float32)

            pred_pos = float(self.race_model.predict(features)[0])
            predictions.append({
                "driver_number": num,
                "name_acronym": d.get("name_acronym", ""),
                "team_name": d.get("team_name", ""),
                "predicted_position": pred_pos,
                "confidence": 0.7,
                "grid_position": grid,
            })

        predictions.sort(key=lambda p: p["predicted_position"])
        for i, p in enumerate(predictions, 1):
            p["predicted_position"] = i

        return predictions

    async def predict_strategy(self, session_key: int, driver_number: int) -> dict:
        """Predict optimal pit strategy for a specific driver."""
        stints = await openf1.get_stints(session_key, driver_number)
        laps = await openf1.get_laps(session_key, driver_number)
        weather = await openf1.get_weather(session_key)

        driver_info = DRIVERS_2026.get(driver_number, {})
        name = driver_info.get("abbreviation", "UNK")

        track_temp = 35.0
        if weather:
            track_temp = weather[-1].get("track_temperature", 35.0)

        # Determine current state
        current_compound = "MEDIUM"
        stint_length = 0
        total_laps = 57  # default
        current_lap = 0

        if stints:
            latest_stint = stints[-1]
            current_compound = latest_stint.get("compound", "MEDIUM")
            stint_start = latest_stint.get("lap_start", 1)
            stint_end = latest_stint.get("lap_end")
            if stint_end:
                stint_length = stint_end - stint_start
                current_lap = stint_end
            else:
                stint_length = 10

        if laps:
            lap_numbers = [l.get("lap_number", 0) for l in laps if l.get("lap_number")]
            if lap_numbers:
                current_lap = max(current_lap, max(lap_numbers))

        # Generate pit windows
        pit_windows = self._generate_pit_windows(
            current_compound, current_lap, total_laps, track_temp
        )

        # Generate tire degradation curves
        tire_degradation = self._generate_degradation_curves(total_laps, track_temp)

        return {
            "driver_number": driver_number,
            "name_acronym": name,
            "recommended_stops": max(1, len(pit_windows)),
            "pit_windows": pit_windows,
            "tire_degradation": tire_degradation,
        }

    def _generate_pit_windows(
        self, current_compound: str, current_lap: int, total_laps: int, track_temp: float
    ) -> list[dict]:
        """Generate recommended pit windows."""
        windows = []
        compound_map = {"SOFT": "MEDIUM", "MEDIUM": "HARD", "HARD": "MEDIUM"}

        if self.pit_model is not None:
            # Use model to find optimal windows
            compound_encoded = {"SOFT": 0, "MEDIUM": 1, "HARD": 2}.get(current_compound.upper(), 1)
            best_lap = current_lap + 15
            best_prob = 0.0

            for future_lap in range(current_lap + 5, min(current_lap + 30, total_laps)):
                features = np.array([[
                    compound_encoded,
                    future_lap - current_lap,  # stint_length
                    90.0,                       # estimated lap time
                    track_temp,
                    future_lap / total_laps,
                    5.0,                        # estimated position
                    total_laps,
                ]], dtype=np.float32)
                prob = float(self.pit_model.predict_proba(features)[0])
                if prob > best_prob:
                    best_prob = prob
                    best_lap = future_lap

            windows.append({
                "lap_start": max(1, best_lap - 2),
                "lap_end": min(total_laps, best_lap + 2),
                "compound_from": current_compound.upper(),
                "compound_to": compound_map.get(current_compound.upper(), "HARD"),
                "probability": round(best_prob, 2),
            })
        else:
            # Fallback: standard 1-stop
            mid = total_laps // 2
            windows.append({
                "lap_start": mid - 3,
                "lap_end": mid + 3,
                "compound_from": current_compound.upper(),
                "compound_to": compound_map.get(current_compound.upper(), "HARD"),
                "probability": 0.65,
            })

        return windows

    def _generate_degradation_curves(self, total_laps: int, track_temp: float) -> list[dict]:
        """Generate tire degradation curves for all dry compounds."""
        curves = []
        # Degradation rates (seconds per lap) — approximate
        deg_rates = {"SOFT": 0.08, "MEDIUM": 0.05, "HARD": 0.03}
        base_times = {"SOFT": 88.0, "MEDIUM": 89.2, "HARD": 90.0}

        # Adjust for track temperature
        temp_factor = 1 + (track_temp - 30) * 0.001

        for compound in ["SOFT", "MEDIUM", "HARD"]:
            rate = deg_rates[compound] * temp_factor
            base = base_times[compound]

            for lap in range(1, min(total_laps + 1, 60)):
                degradation = rate * lap
                curves.append({
                    "lap": lap,
                    "degradation_percent": round(degradation / base * 100, 1),
                    "compound": compound,
                    "predicted_lap_time": round(base + degradation, 3),
                })

        return curves

    async def predict_fantasy_points(self, session_key: int | None = None) -> list[dict]:
        """Predict per-driver fantasy points with full component breakdown.

        Uses 4 specialized models: qualifying, position delta, fastest lap, DNF.
        Falls back to existing predict_race() → scoring lookup if models missing.
        """
        has_fantasy_models = all([
            self.quali_model, self.delta_model, self.fl_model, self.dnf_model,
        ])
        if not has_fantasy_models:
            return await self._fallback_fantasy_prediction(session_key)

        # Fetch live data
        if session_key is None:
            session = await openf1.get_latest_session()
            if not session:
                return []
            session_key = session["session_key"]

        drivers = await openf1.get_drivers(session_key)
        positions = await openf1.get_positions(session_key)
        weather = await openf1.get_weather(session_key)

        if not drivers:
            return []

        latest_positions: dict[int, int] = {}
        for p in positions:
            num = p.get("driver_number")
            pos = p.get("position")
            if num and pos:
                latest_positions[num] = pos

        is_wet = 0
        air_temp = 25.0
        track_temp = 35.0
        if weather:
            latest_w = weather[-1]
            is_wet = 1 if latest_w.get("rainfall") else 0
            air_temp = latest_w.get("air_temperature", 25.0)
            track_temp = latest_w.get("track_temperature", 35.0)

        field_size = len(drivers)
        driver_stats = self.driver_rolling_stats.get("drivers", {})
        team_stats = self.driver_rolling_stats.get("teams", {})

        finish_pts_table = SCORING_RULES["finish_position"]
        quali_pts_table = SCORING_RULES["qualifying_position"]

        predictions = []
        raw_fl_probs: list[tuple[int, float]] = []

        for d in drivers:
            num = d.get("driver_number")
            if not num:
                continue

            abbr = d.get("name_acronym", "")
            team = d.get("team_name", "")
            grid = latest_positions.get(num, 10)

            # Look up rolling stats (fallback to reasonable defaults)
            ds = driver_stats.get(abbr, {})
            ts = team_stats.get(team, {})

            avg_quali_5 = ds.get("avg_quali_last_5", float(grid))
            team_avg_quali_5 = ts.get("avg_quali_last_5", float(grid))
            avg_finish_5 = ds.get("avg_finish_last_5", float(grid))
            team_avg_finish_5 = ts.get("avg_finish_last_5", float(grid))
            delta_avg = ds.get("position_delta_avg", 0.0)
            fl_rate = ds.get("fastest_lap_rate", 0.05)
            dnf_rate = ds.get("dnf_rate", 0.05)
            team_dnf_rate = ts.get("dnf_rate", 0.05)

            # 1. Qualifying prediction
            q_features = np.array([[
                avg_quali_5, team_avg_quali_5, avg_quali_5,  # circuit_driver_avg_quali ≈ driver avg
                0,  # is_wet_qualifying (unknown for upcoming)
                air_temp, field_size,
            ]], dtype=np.float32)
            pred_quali = float(self.quali_model.predict(q_features)[0])
            pred_quali = max(1, min(field_size, round(pred_quali)))

            # 2. Position delta prediction
            d_features = np.array([[
                grid, avg_finish_5, team_avg_finish_5,
                delta_avg, avg_finish_5,  # circuit_driver_avg_finish ≈ driver avg
                is_wet, air_temp, track_temp,
            ]], dtype=np.float32)
            pred_delta = float(self.delta_model.predict(d_features)[0])

            # 3. Fastest lap probability
            fl_features = np.array([[
                grid, avg_finish_5, team_avg_finish_5,
                fl_rate, is_wet, air_temp, track_temp,
            ]], dtype=np.float32)
            fl_prob = float(self.fl_model.predict_proba(fl_features)[0])
            raw_fl_probs.append((num, fl_prob))

            # 4. DNF probability
            dnf_features = np.array([[
                grid, dnf_rate, team_dnf_rate, 0.1,  # circuit_dnf_rate ≈ average
                is_wet, air_temp, track_temp, field_size,
            ]], dtype=np.float32)
            dnf_prob = float(self.dnf_model.predict_proba(dnf_features)[0])

            predictions.append({
                "driver_number": num,
                "name_acronym": abbr,
                "team_name": team,
                "grid_position": grid,
                "pred_quali_position": pred_quali,
                "pred_position_delta": round(pred_delta, 2),
                "fl_prob_raw": fl_prob,
                "dnf_prob": round(dnf_prob, 3),
            })

        # Normalize FL probabilities across field to sum to 1
        total_fl = sum(p["fl_prob_raw"] for p in predictions) or 1.0
        for p in predictions:
            p["fl_prob"] = round(p["fl_prob_raw"] / total_fl, 3)
            del p["fl_prob_raw"]

        # Compute expected fantasy points per component
        for p in predictions:
            grid = p["grid_position"]
            quali_pos = p["pred_quali_position"]
            delta = p["pred_position_delta"]
            fl_prob = p["fl_prob"]
            dnf_prob = p["dnf_prob"]

            # Expected finish position
            pred_finish = max(1, min(field_size, round(grid - delta)))

            quali_pts = quali_pts_table.get(quali_pos, 0)
            finish_pts = finish_pts_table.get(pred_finish, 0)

            gained = grid - pred_finish
            if gained > 0:
                gained_pts = gained * SCORING_RULES.get("positions_gained", 2)
            elif gained < 0:
                gained_pts = abs(gained) * SCORING_RULES.get("positions_lost", -1)
            else:
                gained_pts = 0

            fl_expected = fl_prob * SCORING_RULES.get("fastest_lap", 5)
            dnf_penalty = SCORING_RULES.get("dnf_penalty", -10)

            # Expected total = (1-dnf) * (quali + finish + gained + FL) + dnf * (quali + penalty)
            expected_if_finish = quali_pts + finish_pts + gained_pts + fl_expected
            expected_if_dnf = quali_pts + dnf_penalty
            expected_total = (1 - dnf_prob) * expected_if_finish + dnf_prob * expected_if_dnf

            p["pred_finish_position"] = pred_finish
            p["breakdown"] = {
                "qualifying": round(quali_pts, 2),
                "finish": round((1 - dnf_prob) * finish_pts, 2),
                "positions_gained": round((1 - dnf_prob) * gained_pts, 2),
                "fastest_lap": round(fl_expected, 2),
                "dnf_risk": round(dnf_prob * dnf_penalty, 2),
            }
            p["expected_points"] = round(expected_total, 2)

        predictions.sort(key=lambda x: x["expected_points"], reverse=True)
        return predictions

    async def _fallback_fantasy_prediction(self, session_key: int | None = None) -> list[dict]:
        """Fallback when fantasy models aren't trained: use race model + lookup."""
        if session_key is None:
            session = await openf1.get_latest_session()
            if not session:
                return []
            session_key = session["session_key"]

        race_preds = await self.predict_race(session_key)
        finish_pts_table = SCORING_RULES["finish_position"]
        quali_pts_table = SCORING_RULES["qualifying_position"]

        results = []
        for p in race_preds:
            pos = p["predicted_position"]
            grid = p.get("grid_position", pos)
            finish_pts = finish_pts_table.get(pos, 0)
            quali_pts = quali_pts_table.get(grid, 0)
            gained = grid - pos
            if gained > 0:
                gained_pts = gained * SCORING_RULES.get("positions_gained", 2)
            elif gained < 0:
                gained_pts = abs(gained) * SCORING_RULES.get("positions_lost", -1)
            else:
                gained_pts = 0

            total = quali_pts + finish_pts + gained_pts
            results.append({
                "driver_number": p["driver_number"],
                "name_acronym": p.get("name_acronym", ""),
                "team_name": p.get("team_name", ""),
                "grid_position": grid,
                "pred_finish_position": pos,
                "pred_quali_position": grid,
                "pred_position_delta": grid - pos,
                "fl_prob": 0.05,
                "dnf_prob": 0.05,
                "breakdown": {
                    "qualifying": quali_pts,
                    "finish": finish_pts,
                    "positions_gained": gained_pts,
                    "fastest_lap": 0.25,
                    "dnf_risk": -0.5,
                },
                "expected_points": round(total - 0.25, 2),
            })
        results.sort(key=lambda x: x["expected_points"], reverse=True)
        return results

    def _fallback_race_prediction(self, drivers: list[dict], positions: dict[int, int]) -> list[dict]:
        """When no model is available, predict based on grid/current position."""
        predictions = []
        for d in drivers:
            num = d.get("driver_number")
            if not num:
                continue
            pos = positions.get(num, 20)
            predictions.append({
                "driver_number": num,
                "name_acronym": d.get("name_acronym", ""),
                "team_name": d.get("team_name", ""),
                "predicted_position": pos,
                "confidence": 0.3,
                "grid_position": pos,
            })
        predictions.sort(key=lambda p: p["predicted_position"])
        for i, p in enumerate(predictions, 1):
            p["predicted_position"] = i
        return predictions


prediction_engine = PredictionEngine()
