from __future__ import annotations

import logging
from pathlib import Path
from typing import Optional

import numpy as np

from app.services.openf1_client import openf1
from app.utils.f1_constants import DRIVERS_2025, TIRE_COMPOUNDS

logger = logging.getLogger(__name__)

MODEL_DIR = Path(__file__).parent.parent / "ml" / "saved_models"


class PredictionEngine:
    """ML-based race outcome predictions."""

    def __init__(self):
        self.race_model: Optional[RacePositionPredictor] = None
        self.pit_model: Optional[PitStopWindowPredictor] = None
        self._load_models()

    def _load_models(self):
        race_path = MODEL_DIR / "race_position_model.joblib"
        pit_path = MODEL_DIR / "pit_stop_model.joblib"

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

        driver_info = DRIVERS_2025.get(driver_number, {})
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
