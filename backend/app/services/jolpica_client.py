from __future__ import annotations

import logging
from typing import Any

import httpx

logger = logging.getLogger(__name__)

JOLPICA_BASE_URL = "https://api.jolpi.ca/ergast/f1"


class JolpicaClient:
    """Async client for the Jolpica (Ergast replacement) API."""

    def __init__(self):
        self.base_url = JOLPICA_BASE_URL
        self.timeout = 30.0

    def _get_client(self) -> httpx.AsyncClient:
        return httpx.AsyncClient(timeout=self.timeout)

    def _unwrap(self, data: dict, *keys: str) -> Any:
        """Unwrap nested MRData JSON structure."""
        result = data.get("MRData", data)
        for key in keys:
            result = result.get(key, {})
        return result

    async def _request(self, path: str) -> dict:
        url = f"{self.base_url}/{path}"
        for attempt in range(2):
            try:
                async with self._get_client() as client:
                    response = await client.get(url)
                    response.raise_for_status()
                    return response.json()
            except (httpx.HTTPStatusError, httpx.TimeoutException, httpx.ConnectError) as e:
                if attempt == 0:
                    logger.warning(f"Jolpica request failed, retrying: {e}")
                    continue
                logger.error(f"Jolpica request failed: {e}")
                raise

    async def get_drivers(self, season: int = 2026) -> list[dict]:
        data = await self._request(f"{season}/drivers.json?limit=50")
        raw = self._unwrap(data, "DriverTable", "Drivers")
        if not isinstance(raw, list):
            return []
        return [
            {
                "id": d.get("driverId", ""),
                "name": f"{d.get('givenName', '')} {d.get('familyName', '')}".strip(),
                "abbreviation": d.get("code", ""),
                "number": int(d.get("permanentNumber", 0)),
                "country": d.get("nationality", ""),
                "dateOfBirth": d.get("dateOfBirth", ""),
            }
            for d in raw
        ]

    async def get_constructors(self, season: int = 2026) -> list[dict]:
        data = await self._request(f"{season}/constructors.json?limit=20")
        raw = self._unwrap(data, "ConstructorTable", "Constructors")
        if not isinstance(raw, list):
            return []
        return [
            {
                "id": c.get("constructorId", ""),
                "name": c.get("name", ""),
                "country": c.get("nationality", ""),
            }
            for c in raw
        ]

    async def get_schedule(self, season: int = 2026) -> list[dict]:
        data = await self._request(f"{season}.json?limit=30")
        raw = self._unwrap(data, "RaceTable", "Races")
        if not isinstance(raw, list):
            return []
        return [
            {
                "round": int(r.get("round", 0)),
                "name": r.get("raceName", ""),
                "circuit": r.get("Circuit", {}).get("circuitName", ""),
                "city": r.get("Circuit", {}).get("Location", {}).get("locality", ""),
                "country": r.get("Circuit", {}).get("Location", {}).get("country", ""),
                "date": r.get("date", ""),
                "time": r.get("time", ""),
                "sprint": "Sprint" in str(r.get("Sprint", "")),
            }
            for r in raw
        ]

    async def get_driver_standings(self, season: int = 2026) -> list[dict]:
        data = await self._request(f"{season}/driverStandings.json")
        lists = self._unwrap(data, "StandingsTable", "StandingsLists")
        if not isinstance(lists, list) or not lists:
            return []
        standings = lists[0].get("DriverStandings", [])
        return [
            {
                "position": int(s.get("position", 0)),
                "points": float(s.get("points", 0)),
                "wins": int(s.get("wins", 0)),
                "driver_id": s.get("Driver", {}).get("driverId", ""),
                "driver_name": f"{s['Driver'].get('givenName', '')} {s['Driver'].get('familyName', '')}".strip(),
                "driver_code": s.get("Driver", {}).get("code", ""),
                "constructor_id": s["Constructors"][0].get("constructorId", "") if s.get("Constructors") else "",
                "constructor_name": s["Constructors"][0].get("name", "") if s.get("Constructors") else "",
            }
            for s in standings
        ]

    async def get_constructor_standings(self, season: int = 2026) -> list[dict]:
        data = await self._request(f"{season}/constructorStandings.json")
        lists = self._unwrap(data, "StandingsTable", "StandingsLists")
        if not isinstance(lists, list) or not lists:
            return []
        standings = lists[0].get("ConstructorStandings", [])
        return [
            {
                "position": int(s.get("position", 0)),
                "points": float(s.get("points", 0)),
                "wins": int(s.get("wins", 0)),
                "constructor_id": s.get("Constructor", {}).get("constructorId", ""),
                "constructor_name": s.get("Constructor", {}).get("name", ""),
            }
            for s in standings
        ]

    async def get_race_results(self, season: int, round_num: int) -> list[dict]:
        data = await self._request(f"{season}/{round_num}/results.json")
        raw = self._unwrap(data, "RaceTable", "Races")
        if not isinstance(raw, list) or not raw:
            return []
        results = raw[0].get("Results", [])
        return [
            {
                "position": int(r.get("position", 0)),
                "driver_id": r.get("Driver", {}).get("driverId", ""),
                "driver_name": f"{r['Driver'].get('givenName', '')} {r['Driver'].get('familyName', '')}".strip(),
                "driver_code": r.get("Driver", {}).get("code", ""),
                "constructor_name": r.get("Constructor", {}).get("name", ""),
                "grid": int(r.get("grid", 0)),
                "laps": int(r.get("laps", 0)),
                "status": r.get("status", ""),
                "points": float(r.get("points", 0)),
                "time": r.get("Time", {}).get("time", "") if r.get("Time") else "",
            }
            for r in results
        ]


jolpica = JolpicaClient()
