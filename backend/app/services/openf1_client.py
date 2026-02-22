from __future__ import annotations

import asyncio
import logging
import time
from typing import Any

import httpx

from app.config import settings

logger = logging.getLogger(__name__)

_cache: dict[str, tuple[float, Any]] = {}
CACHE_TTL = 300  # 5 minutes for non-live data
LIVE_CACHE_TTL = 15  # 15 seconds for live data (avoids rate limits)


class OpenF1Client:
    def __init__(self):
        self.base_url = settings.openf1_base_url
        self.timeout = 10.0
        self.max_retries = 3

    def _get_client(self) -> httpx.AsyncClient:
        return httpx.AsyncClient(
            base_url=self.base_url,
            timeout=self.timeout,
        )

    def _cache_key(self, endpoint: str, params: dict) -> str:
        sorted_params = sorted(params.items())
        return f"{endpoint}?{'&'.join(f'{k}={v}' for k, v in sorted_params)}"

    def _get_cached(self, key: str, ttl: float) -> Any | None:
        if key in _cache:
            cached_time, data = _cache[key]
            if time.time() - cached_time < ttl:
                return data
            del _cache[key]
        return None

    def _set_cache(self, key: str, data: Any):
        _cache[key] = (time.time(), data)

    async def _request(self, endpoint: str, params: dict | None = None, live: bool = False) -> list[dict]:
        params = {k: v for k, v in (params or {}).items() if v is not None}
        cache_key = self._cache_key(endpoint, params)
        ttl = LIVE_CACHE_TTL if live else CACHE_TTL

        cached = self._get_cached(cache_key, ttl)
        if cached is not None:
            return cached

        for attempt in range(self.max_retries):
            try:
                async with self._get_client() as client:
                    response = await client.get(endpoint, params=params)
                    response.raise_for_status()
                    data = response.json()
                    self._set_cache(cache_key, data)
                    return data
            except httpx.HTTPStatusError as e:
                status = e.response.status_code
                if status == 429 and attempt < self.max_retries - 1:
                    wait = 5 * (attempt + 1)  # 5s, 10s backoff on rate limit
                    logger.warning(f"OpenF1 rate limited, backing off {wait}s")
                    await asyncio.sleep(wait)
                    continue
                if status >= 500 and attempt < self.max_retries - 1:
                    wait = 2 ** attempt
                    logger.warning(f"OpenF1 5xx error, retrying in {wait}s: {e}")
                    await asyncio.sleep(wait)
                    continue
                if status == 429:
                    logger.warning(f"OpenF1 rate limited on {endpoint}, returning cached/empty")
                    # Return stale cache if available
                    if cache_key in _cache:
                        return _cache[cache_key][1]
                    return []
                logger.error(f"OpenF1 HTTP error: {e}")
                return []
            except (httpx.TimeoutException, httpx.ConnectError) as e:
                if attempt < self.max_retries - 1:
                    wait = 2 ** attempt
                    logger.warning(f"OpenF1 connection error, retrying in {wait}s: {e}")
                    await asyncio.sleep(wait)
                    continue
                logger.error(f"OpenF1 connection failed: {e}")
                return []
        return []

    async def get_sessions(self, year: int = 2025, circuit_key: int | None = None) -> list[dict]:
        params = {"year": year}
        if circuit_key:
            params["circuit_key"] = circuit_key
        return await self._request("/sessions", params)

    async def get_latest_session(self) -> dict | None:
        sessions = await self._request("/sessions", {"year": 2025})
        if not sessions:
            return None
        # Return the most recent session
        return sessions[-1]

    async def get_drivers(self, session_key: int) -> list[dict]:
        return await self._request("/drivers", {"session_key": session_key})

    async def get_positions(self, session_key: int, driver_number: int | None = None) -> list[dict]:
        return await self._request(
            "/position",
            {"session_key": session_key, "driver_number": driver_number},
            live=True,
        )

    async def get_intervals(self, session_key: int) -> list[dict]:
        return await self._request("/intervals", {"session_key": session_key}, live=True)

    async def get_laps(
        self, session_key: int, driver_number: int | None = None, lap_number: int | None = None
    ) -> list[dict]:
        return await self._request(
            "/laps",
            {"session_key": session_key, "driver_number": driver_number, "lap_number": lap_number},
            live=True,
        )

    async def get_car_data(self, session_key: int, driver_number: int | None = None) -> list[dict]:
        return await self._request(
            "/car_data",
            {"session_key": session_key, "driver_number": driver_number},
            live=True,
        )

    async def get_stints(self, session_key: int, driver_number: int | None = None) -> list[dict]:
        return await self._request(
            "/stints",
            {"session_key": session_key, "driver_number": driver_number},
            live=True,
        )

    async def get_pit_stops(self, session_key: int, driver_number: int | None = None) -> list[dict]:
        return await self._request(
            "/pit",
            {"session_key": session_key, "driver_number": driver_number},
            live=True,
        )

    async def get_weather(self, session_key: int) -> list[dict]:
        return await self._request("/weather", {"session_key": session_key}, live=True)

    async def get_race_control(self, session_key: int) -> list[dict]:
        return await self._request("/race_control", {"session_key": session_key}, live=True)

    async def get_team_radio(self, session_key: int, driver_number: int | None = None) -> list[dict]:
        return await self._request(
            "/team_radio",
            {"session_key": session_key, "driver_number": driver_number},
        )

    async def get_location(self, session_key: int, driver_number: int | None = None) -> list[dict]:
        return await self._request(
            "/location",
            {"session_key": session_key, "driver_number": driver_number},
            live=True,
        )


openf1 = OpenF1Client()
