from __future__ import annotations

import json
import logging
import pickle
from pathlib import Path

import fastf1
import numpy as np
import pandas as pd

logger = logging.getLogger(__name__)

CACHE_DIR = Path("./fastf1_cache")
CACHE_DIR.mkdir(exist_ok=True)
fastf1.Cache.enable_cache(str(CACHE_DIR))

COMPOUND_MAP = {"SOFT": 0, "MEDIUM": 1, "HARD": 2, "INTERMEDIATE": 3, "WET": 4}

SAVED_MODELS_DIR = Path(__file__).parent.parent / "saved_models"
SAVED_MODELS_DIR.mkdir(exist_ok=True)


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


def build_unified_fantasy_dataset(
    years: list[int] | None = None,
    use_cache: bool = True,
) -> pd.DataFrame:
    """Build unified training dataset for all 4 fantasy scoring models.

    Loads both Qualifying and Race sessions, extracting features and targets
    for qualifying position, position delta, fastest lap, and DNF prediction.

    Caches to saved_models/unified_fantasy_dataset.pkl. Also exports final
    rolling stats to saved_models/driver_rolling_stats.json for inference.
    """
    if years is None:
        years = [2022, 2023, 2024]

    cache_path = SAVED_MODELS_DIR / "unified_fantasy_dataset.pkl"
    if use_cache and cache_path.exists():
        logger.info(f"Loading cached unified dataset from {cache_path}")
        return pd.read_pickle(cache_path)

    all_rows: list[dict] = []

    # Rolling state dictionaries
    driver_finishes: dict[str, list[float]] = {}
    team_finishes: dict[str, list[float]] = {}
    driver_qualifying: dict[str, list[float]] = {}
    team_qualifying: dict[str, list[float]] = {}
    driver_position_delta: dict[str, list[float]] = {}
    driver_fastest_laps: dict[str, list[int]] = {}
    driver_dnfs: dict[str, list[bool]] = {}
    team_dnfs: dict[str, list[bool]] = {}
    circuit_dnf_rates: dict[str, list[bool]] = {}
    circuit_driver_finishes: dict[tuple[str, str], list[float]] = {}
    circuit_driver_qualifying: dict[tuple[str, str], list[float]] = {}

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
            circuit_name = str(event.get("EventName", "Unknown"))

            # --- Load Race session ---
            try:
                race = fastf1.get_session(year, round_num, "R")
                race.load(telemetry=False, weather=True)
            except Exception as e:
                logger.warning(f"Skipping {year} R{round_num}: {e}")
                continue

            results = race.results
            if results is None or results.empty:
                continue

            # --- Load Qualifying session (fallback to grid from race) ---
            quali_positions: dict[str, float] = {}
            is_wet_qualifying = False
            try:
                quali = fastf1.get_session(year, round_num, "Q")
                quali.load(telemetry=False, weather=True)
                if quali.results is not None and not quali.results.empty:
                    for _, qr in quali.results.iterrows():
                        abbr = str(qr.get("Abbreviation", "UNK"))
                        qpos = qr.get("Position", np.nan)
                        if not pd.isna(qpos):
                            quali_positions[abbr] = float(qpos)
                # Qualifying weather
                qw = quali.weather_data
                if qw is not None and not qw.empty:
                    rainfall = qw.get("Rainfall", pd.Series([False]))
                    is_wet_qualifying = bool(rainfall.any()) if hasattr(rainfall, "any") else False
            except Exception:
                # Sprint weekends or missing Q — fall back to GridPosition
                pass

            # --- Race weather ---
            weather = race.weather_data
            is_wet_race = False
            air_temp = 25.0
            track_temp = 35.0
            if weather is not None and not weather.empty:
                rainfall = weather.get("Rainfall", pd.Series([False]))
                is_wet_race = bool(rainfall.any()) if hasattr(rainfall, "any") else False
                air_temp = float(weather["AirTemp"].mean()) if "AirTemp" in weather.columns else 25.0
                track_temp = float(weather["TrackTemp"].mean()) if "TrackTemp" in weather.columns else 35.0

            # --- Determine fastest lap driver ---
            laps = race.laps
            fastest_lap_driver = None
            if laps is not None and not laps.empty and "LapTime" in laps.columns:
                valid_laps = laps[laps["LapTime"].notna()]
                if not valid_laps.empty:
                    fastest_idx = valid_laps["LapTime"].idxmin()
                    fastest_lap_driver = str(valid_laps.loc[fastest_idx, "Driver"])

            field_size = len(results)

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

                # Qualifying position: prefer Q session, fall back to grid
                quali_pos = quali_positions.get(driver, grid)

                # Targets
                position_delta = grid - finish  # positive = gained positions
                has_fastest_lap = 1 if driver == fastest_lap_driver else 0

                # Rolling features (computed BEFORE update)
                avg_quali_5 = np.mean(driver_qualifying.get(driver, [quali_pos])[-5:])
                team_avg_quali_5 = np.mean(team_qualifying.get(team, [quali_pos])[-5:])
                circuit_quali_key = (circuit_name, driver)
                circuit_driver_avg_quali = np.mean(
                    circuit_driver_qualifying.get(circuit_quali_key, [quali_pos])
                )

                avg_finish_5 = np.mean(driver_finishes.get(driver, [finish])[-5:])
                team_avg_finish_5 = np.mean(team_finishes.get(team, [finish])[-5:])
                driver_delta_avg = np.mean(driver_position_delta.get(driver, [0.0])[-5:])
                circuit_finish_key = (circuit_name, driver)
                circuit_driver_avg_finish = np.mean(
                    circuit_driver_finishes.get(circuit_finish_key, [finish])
                )

                dnf_history = driver_dnfs.get(driver, [])
                dnf_rate = sum(dnf_history) / max(len(dnf_history), 1)
                team_dnf_history = team_dnfs.get(team, [])
                team_dnf_rate = sum(team_dnf_history) / max(len(team_dnf_history), 1)
                circuit_dnf_history = circuit_dnf_rates.get(circuit_name, [])
                circuit_dnf_rate = sum(circuit_dnf_history) / max(len(circuit_dnf_history), 1)

                fl_history = driver_fastest_laps.get(driver, [])
                fl_rate = sum(fl_history) / max(len(fl_history), 1)

                all_rows.append({
                    # Features
                    "grid_position": grid,
                    "driver_avg_quali_last_5": avg_quali_5,
                    "team_avg_quali_last_5": team_avg_quali_5,
                    "circuit_driver_avg_quali": circuit_driver_avg_quali,
                    "driver_avg_finish_last_5": avg_finish_5,
                    "team_avg_finish_last_5": team_avg_finish_5,
                    "driver_position_delta_avg": driver_delta_avg,
                    "circuit_driver_avg_finish": circuit_driver_avg_finish,
                    "driver_dnf_rate": dnf_rate,
                    "team_dnf_rate": team_dnf_rate,
                    "circuit_dnf_rate": circuit_dnf_rate,
                    "driver_fastest_lap_rate": fl_rate,
                    "is_wet_race": int(is_wet_race),
                    "is_wet_qualifying": int(is_wet_qualifying),
                    "air_temperature": air_temp,
                    "track_temperature": track_temp,
                    "field_size": field_size,
                    # Targets
                    "target_quali_position": quali_pos,
                    "target_position_delta": position_delta,
                    "target_fastest_lap": has_fastest_lap,
                    "target_dnf": int(is_dnf),
                })

                # Update rolling stats
                driver_qualifying.setdefault(driver, []).append(quali_pos)
                team_qualifying.setdefault(team, []).append(quali_pos)
                driver_finishes.setdefault(driver, []).append(finish)
                team_finishes.setdefault(team, []).append(finish)
                driver_position_delta.setdefault(driver, []).append(position_delta)
                driver_fastest_laps.setdefault(driver, []).append(has_fastest_lap)
                driver_dnfs.setdefault(driver, []).append(is_dnf)
                team_dnfs.setdefault(team, []).append(is_dnf)
                circuit_dnf_rates.setdefault(circuit_name, []).append(is_dnf)
                circuit_driver_finishes.setdefault(circuit_finish_key, []).append(finish)
                circuit_driver_qualifying.setdefault(circuit_quali_key, []).append(quali_pos)

    df = pd.DataFrame(all_rows)
    logger.info(f"Built unified fantasy dataset: {len(df)} samples from {years}")

    # Cache dataset
    df.to_pickle(cache_path)
    logger.info(f"Cached dataset to {cache_path}")

    # Export final rolling stats for inference
    _export_rolling_stats(
        driver_qualifying, team_qualifying, driver_finishes, team_finishes,
        driver_position_delta, driver_fastest_laps, driver_dnfs, team_dnfs,
    )

    return df


def _export_rolling_stats(
    driver_qualifying: dict[str, list[float]],
    team_qualifying: dict[str, list[float]],
    driver_finishes: dict[str, list[float]],
    team_finishes: dict[str, list[float]],
    driver_position_delta: dict[str, list[float]],
    driver_fastest_laps: dict[str, list[int]],
    driver_dnfs: dict[str, list[bool]],
    team_dnfs: dict[str, list[bool]],
) -> None:
    """Serialize final rolling stats to JSON for inference-time lookup."""
    stats: dict = {"drivers": {}, "teams": {}}

    for driver, qualis in driver_qualifying.items():
        finishes = driver_finishes.get(driver, [])
        deltas = driver_position_delta.get(driver, [])
        fl = driver_fastest_laps.get(driver, [])
        dnfs = driver_dnfs.get(driver, [])
        stats["drivers"][driver] = {
            "avg_quali_last_5": float(np.mean(qualis[-5:])),
            "avg_finish_last_5": float(np.mean(finishes[-5:])) if finishes else 10.0,
            "position_delta_avg": float(np.mean(deltas[-5:])) if deltas else 0.0,
            "fastest_lap_rate": float(sum(fl) / max(len(fl), 1)),
            "dnf_rate": float(sum(dnfs) / max(len(dnfs), 1)),
        }

    for team, qualis in team_qualifying.items():
        finishes = team_finishes.get(team, [])
        dnfs = team_dnfs.get(team, [])
        stats["teams"][team] = {
            "avg_quali_last_5": float(np.mean(qualis[-5:])),
            "avg_finish_last_5": float(np.mean(finishes[-5:])) if finishes else 10.0,
            "dnf_rate": float(sum(dnfs) / max(len(dnfs), 1)),
        }

    out_path = SAVED_MODELS_DIR / "driver_rolling_stats.json"
    with open(out_path, "w") as f:
        json.dump(stats, f, indent=2)
    logger.info(f"Exported rolling stats to {out_path}")


# ── Wrapper functions for per-component datasets ──

QUALIFYING_FEATURES = [
    "driver_avg_quali_last_5", "team_avg_quali_last_5", "circuit_driver_avg_quali",
    "is_wet_qualifying", "air_temperature", "field_size",
]

POSITION_DELTA_FEATURES = [
    "grid_position", "driver_avg_finish_last_5", "team_avg_finish_last_5",
    "driver_position_delta_avg", "circuit_driver_avg_finish",
    "is_wet_race", "air_temperature", "track_temperature",
]

FASTEST_LAP_FEATURES = [
    "grid_position", "driver_avg_finish_last_5", "team_avg_finish_last_5",
    "driver_fastest_lap_rate", "is_wet_race", "air_temperature", "track_temperature",
]

DNF_FEATURES = [
    "grid_position", "driver_dnf_rate", "team_dnf_rate", "circuit_dnf_rate",
    "is_wet_race", "air_temperature", "track_temperature", "field_size",
]


def build_qualifying_dataset(years: list[int] | None = None, use_cache: bool = True) -> pd.DataFrame:
    """Dataset for qualifying position prediction."""
    df = build_unified_fantasy_dataset(years, use_cache=use_cache)
    return df[QUALIFYING_FEATURES + ["target_quali_position"]].copy()


def build_position_delta_dataset(years: list[int] | None = None, use_cache: bool = True) -> pd.DataFrame:
    """Dataset for position delta prediction (excludes DNF rows)."""
    df = build_unified_fantasy_dataset(years, use_cache=use_cache)
    df = df[df["target_dnf"] == 0]
    return df[POSITION_DELTA_FEATURES + ["target_position_delta"]].copy()


def build_fastest_lap_dataset(years: list[int] | None = None, use_cache: bool = True) -> pd.DataFrame:
    """Dataset for fastest lap prediction (excludes DNF rows)."""
    df = build_unified_fantasy_dataset(years, use_cache=use_cache)
    df = df[df["target_dnf"] == 0]
    return df[FASTEST_LAP_FEATURES + ["target_fastest_lap"]].copy()


def build_dnf_dataset(years: list[int] | None = None, use_cache: bool = True) -> pd.DataFrame:
    """Dataset for DNF prediction."""
    df = build_unified_fantasy_dataset(years, use_cache=use_cache)
    return df[DNF_FEATURES + ["target_dnf"]].copy()
