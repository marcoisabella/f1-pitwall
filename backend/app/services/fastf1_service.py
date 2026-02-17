from __future__ import annotations

import asyncio
import logging
from pathlib import Path

import fastf1
import pandas as pd

logger = logging.getLogger(__name__)

CACHE_DIR = Path("/app/fastf1_cache") if Path("/app/fastf1_cache").exists() else Path("./fastf1_cache")
CACHE_DIR.mkdir(exist_ok=True)
fastf1.Cache.enable_cache(str(CACHE_DIR))


class FastF1Service:
    """Historical data analysis using FastF1 library."""

    async def get_race_results(self, year: int, round_number: int) -> pd.DataFrame:
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, self._load_race_results, year, round_number)

    def _load_race_results(self, year: int, round_number: int) -> pd.DataFrame:
        session = fastf1.get_session(year, round_number, "R")
        session.load(telemetry=False, weather=False)
        return session.results

    async def get_qualifying_results(self, year: int, round_number: int) -> pd.DataFrame:
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, self._load_qualifying, year, round_number)

    def _load_qualifying(self, year: int, round_number: int) -> pd.DataFrame:
        session = fastf1.get_session(year, round_number, "Q")
        session.load(telemetry=False, weather=False)
        return session.results

    async def get_laps(self, year: int, round_number: int, session_type: str = "R") -> pd.DataFrame:
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, self._load_laps, year, round_number, session_type)

    def _load_laps(self, year: int, round_number: int, session_type: str) -> pd.DataFrame:
        session = fastf1.get_session(year, round_number, session_type)
        session.load(telemetry=False, weather=True)
        return session.laps

    async def get_weather_data(self, year: int, round_number: int, session_type: str = "R") -> pd.DataFrame:
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, self._load_weather, year, round_number, session_type)

    def _load_weather(self, year: int, round_number: int, session_type: str) -> pd.DataFrame:
        session = fastf1.get_session(year, round_number, session_type)
        session.load(telemetry=False, weather=True)
        return session.weather_data

    async def get_event_schedule(self, year: int) -> pd.DataFrame:
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, fastf1.get_event_schedule, year)


fastf1_service = FastF1Service()
