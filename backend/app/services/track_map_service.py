from __future__ import annotations

import json
import logging
from datetime import datetime

import httpx
from sqlalchemy import select

from app.models.database import SeasonCache, async_session

logger = logging.getLogger(__name__)

MULTIVIEWER_API = "https://api.multiviewer.app/api/v1/circuits"


class TrackMapService:
    """Fetches circuit SVG paths from Multiviewer API, caches in SQLite."""

    def __init__(self):
        self.timeout = 15.0

    async def get_circuit_svg(self, circuit_key: int, year: int = 2026) -> dict | None:
        cache_key = f"track_svg_{circuit_key}_{year}"

        # Check cache
        async with async_session() as session:
            result = await session.execute(
                select(SeasonCache).where(SeasonCache.cache_key == cache_key)
            )
            cached = result.scalar_one_or_none()
            if cached:
                return json.loads(cached.data_json)

        # Fetch from Multiviewer
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(f"{MULTIVIEWER_API}/{circuit_key}/{year}")
                response.raise_for_status()
                data = response.json()

            # Cache it
            async with async_session() as session:
                entry = SeasonCache(
                    cache_key=cache_key,
                    season=year,
                    data_json=json.dumps(data),
                    source="multiviewer",
                    fetched_at=datetime.utcnow(),
                )
                session.add(entry)
                await session.commit()

            return data
        except Exception as e:
            logger.warning(f"Failed to fetch track SVG for circuit {circuit_key}: {e}")
            return None


track_map_service = TrackMapService()
