from __future__ import annotations

import logging
from pathlib import Path

import fastf1
import numpy as np
import pandas as pd

logger = logging.getLogger(__name__)

CACHE_DIR = Path("./fastf1_cache")
CACHE_DIR.mkdir(exist_ok=True)
fastf1.Cache.enable_cache(str(CACHE_DIR))

COMPOUND_MAP = {"SOFT": 0, "MEDIUM": 1, "HARD": 2, "INTERMEDIATE": 3, "WET": 4}


def build_race_prediction_dataset(years: list[int] | None = None) -> pd.DataFrame:
    """Build training dataset for race finish position prediction.

    Features per driver per race:
      grid_position, qualifying_position, driver_avg_finish_last_5,
      team_avg_finish_last_5, driver_dnf_rate, circuit_driver_avg,
      is_wet, air_temperature, track_temperature
    Target: finish_position
    """
    if years is None:
        years = [2022, 2023, 2024]

    all_rows: list[dict] = []
    # Accumulate rolling stats
    driver_finishes: dict[str, list[float]] = {}
    team_finishes: dict[str, list[float]] = {}
    driver_dnfs: dict[str, list[bool]] = {}
    circuit_driver_finishes: dict[tuple[str, str], list[float]] = {}

    for year in years:
        try:
            schedule = fastf1.get_event_schedule(year)
        except Exception as e:
            logger.warning(f"Failed to get schedule for {year}: {e}")
            continue

        for _, event in schedule.iterrows():
            round_num = event.get("RoundNumber", 0)
            if round_num == 0:
                continue
            circuit_name = event.get("EventName", "Unknown")

            try:
                race = fastf1.get_session(year, round_num, "R")
                race.load(telemetry=False, weather=True)
            except Exception as e:
                logger.warning(f"Skipping {year} R{round_num}: {e}")
                continue

            results = race.results
            if results is None or results.empty:
                continue

            # Get weather
            weather = race.weather_data
            is_wet = False
            air_temp = 25.0
            track_temp = 35.0
            if weather is not None and not weather.empty:
                rainfall = weather.get("Rainfall", pd.Series([False]))
                is_wet = bool(rainfall.any()) if hasattr(rainfall, "any") else False
                air_temp = float(weather["AirTemp"].mean()) if "AirTemp" in weather.columns else 25.0
                track_temp = float(weather["TrackTemp"].mean()) if "TrackTemp" in weather.columns else 35.0

            for _, row in results.iterrows():
                driver = str(row.get("Abbreviation", "UNK"))
                team = str(row.get("TeamName", "Unknown"))
                grid = row.get("GridPosition", np.nan)
                finish = row.get("Position", np.nan)
                status = str(row.get("Status", ""))

                if pd.isna(grid) or pd.isna(finish):
                    continue

                grid = float(grid)
                finish = float(finish)
                is_dnf = "Finished" not in status and "+" not in status

                # Compute rolling features
                avg_finish_5 = np.mean(driver_finishes.get(driver, [finish])[-5:])
                team_avg_5 = np.mean(team_finishes.get(team, [finish])[-5:])
                dnf_history = driver_dnfs.get(driver, [])
                dnf_rate = sum(dnf_history) / max(len(dnf_history), 1)
                circuit_key = (circuit_name, driver)
                circuit_avg = np.mean(circuit_driver_finishes.get(circuit_key, [finish]))

                all_rows.append({
                    "grid_position": grid,
                    "qualifying_position": grid,  # approximate
                    "driver_avg_finish_last_5": avg_finish_5,
                    "team_avg_finish_last_5": team_avg_5,
                    "driver_dnf_rate": dnf_rate,
                    "circuit_driver_avg": circuit_avg,
                    "is_wet": int(is_wet),
                    "air_temperature": air_temp,
                    "track_temperature": track_temp,
                    "finish_position": finish,
                })

                # Update rolling stats
                driver_finishes.setdefault(driver, []).append(finish)
                team_finishes.setdefault(team, []).append(finish)
                driver_dnfs.setdefault(driver, []).append(is_dnf)
                circuit_driver_finishes.setdefault(circuit_key, []).append(finish)

    df = pd.DataFrame(all_rows)
    logger.info(f"Built race prediction dataset: {len(df)} samples from {years}")
    return df


def build_pit_stop_dataset(years: list[int] | None = None) -> pd.DataFrame:
    """Build training dataset for pit stop window prediction.

    Features per lap: tire_compound, stint_length, lap_time_degradation,
                      track_temperature, race_lap_fraction, position
    Target: pit_in_next_3 (binary)
    """
    if years is None:
        years = [2023, 2024]

    all_rows: list[dict] = []

    for year in years:
        try:
            schedule = fastf1.get_event_schedule(year)
        except Exception as e:
            logger.warning(f"Failed to get schedule for {year}: {e}")
            continue

        for _, event in schedule.iterrows():
            round_num = event.get("RoundNumber", 0)
            if round_num == 0:
                continue

            try:
                race = fastf1.get_session(year, round_num, "R")
                race.load(telemetry=False, weather=True)
            except Exception as e:
                logger.warning(f"Skipping {year} R{round_num}: {e}")
                continue

            laps = race.laps
            if laps is None or laps.empty:
                continue

            total_laps = int(laps["LapNumber"].max()) if "LapNumber" in laps.columns else 60

            # Weather
            weather = race.weather_data
            track_temp = 35.0
            if weather is not None and not weather.empty and "TrackTemp" in weather.columns:
                track_temp = float(weather["TrackTemp"].mean())

            # Process each driver
            for driver in laps["Driver"].unique():
                driver_laps = laps[laps["Driver"] == driver].sort_values("LapNumber")
                if driver_laps.empty:
                    continue

                # Identify pit laps
                pit_laps = set()
                if "PitInTime" in driver_laps.columns:
                    pit_in = driver_laps[driver_laps["PitInTime"].notna()]
                    pit_laps = set(pit_in["LapNumber"].values)

                stint_start_lap = 1
                current_compound = "MEDIUM"

                for _, lap in driver_laps.iterrows():
                    lap_num = int(lap.get("LapNumber", 0))
                    if lap_num == 0:
                        continue

                    compound = str(lap.get("Compound", current_compound))
                    if compound != current_compound:
                        stint_start_lap = lap_num
                        current_compound = compound

                    stint_length = lap_num - stint_start_lap + 1
                    lap_time = lap.get("LapTime")
                    if pd.notna(lap_time):
                        lap_seconds = lap_time.total_seconds() if hasattr(lap_time, "total_seconds") else float(lap_time)
                    else:
                        lap_seconds = np.nan

                    position = lap.get("Position", 10)
                    if pd.isna(position):
                        position = 10

                    # Target: will pit in next 3 laps?
                    pit_in_next_3 = any(
                        l in pit_laps for l in range(lap_num, min(lap_num + 3, total_laps + 1))
                    )

                    if not pd.isna(lap_seconds) and lap_seconds > 0:
                        all_rows.append({
                            "tire_compound": COMPOUND_MAP.get(compound.upper(), 1),
                            "stint_length": stint_length,
                            "lap_time": lap_seconds,
                            "track_temperature": track_temp,
                            "race_lap_fraction": lap_num / max(total_laps, 1),
                            "position": float(position),
                            "total_laps": total_laps,
                            "pit_in_next_3": int(pit_in_next_3),
                        })

    df = pd.DataFrame(all_rows)
    logger.info(f"Built pit stop dataset: {len(df)} samples from {years}")
    return df
