from __future__ import annotations

import json
import logging
from datetime import datetime, timedelta
from typing import Any

from sqlalchemy import select

from app.models.database import SeasonCache, async_session

logger = logging.getLogger(__name__)

SEASON = 2026

# Seed data matching frontend teams2026.ts / calendar2026.ts
SEED_DRIVERS = [
    {"id": "norris", "name": "Lando Norris", "abbreviation": "NOR", "number": 1, "country": "GB", "countryName": "United Kingdom", "dateOfBirth": "1999-11-13", "teamId": "mclaren", "teamName": "McLaren", "teamColor": "#FF8000"},
    {"id": "piastri", "name": "Oscar Piastri", "abbreviation": "PIA", "number": 81, "country": "AU", "countryName": "Australia", "dateOfBirth": "2001-04-06", "teamId": "mclaren", "teamName": "McLaren", "teamColor": "#FF8000"},
    {"id": "leclerc", "name": "Charles Leclerc", "abbreviation": "LEC", "number": 16, "country": "MC", "countryName": "Monaco", "dateOfBirth": "1997-10-16", "teamId": "ferrari", "teamName": "Ferrari", "teamColor": "#E8002D"},
    {"id": "hamilton", "name": "Lewis Hamilton", "abbreviation": "HAM", "number": 44, "country": "GB", "countryName": "United Kingdom", "dateOfBirth": "1985-01-07", "teamId": "ferrari", "teamName": "Ferrari", "teamColor": "#E8002D"},
    {"id": "verstappen", "name": "Max Verstappen", "abbreviation": "VER", "number": 33, "country": "NL", "countryName": "Netherlands", "dateOfBirth": "1997-09-30", "teamId": "red_bull", "teamName": "Red Bull Racing", "teamColor": "#3671C6"},
    {"id": "hadjar", "name": "Isack Hadjar", "abbreviation": "HAD", "number": 6, "country": "FR", "countryName": "France", "dateOfBirth": "2004-09-28", "teamId": "red_bull", "teamName": "Red Bull Racing", "teamColor": "#3671C6"},
    {"id": "russell", "name": "George Russell", "abbreviation": "RUS", "number": 63, "country": "GB", "countryName": "United Kingdom", "dateOfBirth": "1998-02-15", "teamId": "mercedes", "teamName": "Mercedes", "teamColor": "#27F4D2"},
    {"id": "antonelli", "name": "Kimi Antonelli", "abbreviation": "ANT", "number": 12, "country": "IT", "countryName": "Italy", "dateOfBirth": "2006-08-25", "teamId": "mercedes", "teamName": "Mercedes", "teamColor": "#27F4D2"},
    {"id": "alonso", "name": "Fernando Alonso", "abbreviation": "ALO", "number": 14, "country": "ES", "countryName": "Spain", "dateOfBirth": "1981-07-29", "teamId": "aston_martin", "teamName": "Aston Martin", "teamColor": "#229971"},
    {"id": "stroll", "name": "Lance Stroll", "abbreviation": "STR", "number": 18, "country": "CA", "countryName": "Canada", "dateOfBirth": "1998-10-29", "teamId": "aston_martin", "teamName": "Aston Martin", "teamColor": "#229971"},
    {"id": "gasly", "name": "Pierre Gasly", "abbreviation": "GAS", "number": 10, "country": "FR", "countryName": "France", "dateOfBirth": "1996-02-07", "teamId": "alpine", "teamName": "Alpine", "teamColor": "#0093CC"},
    {"id": "colapinto", "name": "Franco Colapinto", "abbreviation": "COL", "number": 43, "country": "AR", "countryName": "Argentina", "dateOfBirth": "2003-05-27", "teamId": "alpine", "teamName": "Alpine", "teamColor": "#0093CC"},
    {"id": "albon", "name": "Alex Albon", "abbreviation": "ALB", "number": 23, "country": "TH", "countryName": "Thailand", "dateOfBirth": "1996-03-23", "teamId": "williams", "teamName": "Williams", "teamColor": "#64C4FF"},
    {"id": "sainz", "name": "Carlos Sainz", "abbreviation": "SAI", "number": 55, "country": "ES", "countryName": "Spain", "dateOfBirth": "1994-09-01", "teamId": "williams", "teamName": "Williams", "teamColor": "#64C4FF"},
    {"id": "lawson", "name": "Liam Lawson", "abbreviation": "LAW", "number": 30, "country": "NZ", "countryName": "New Zealand", "dateOfBirth": "2002-02-11", "teamId": "racing_bulls", "teamName": "Racing Bulls", "teamColor": "#6692FF"},
    {"id": "lindblad", "name": "Arvid Lindblad", "abbreviation": "LIN", "number": 2, "country": "GB", "countryName": "United Kingdom", "dateOfBirth": "2006-10-11", "teamId": "racing_bulls", "teamName": "Racing Bulls", "teamColor": "#6692FF"},
    {"id": "ocon", "name": "Esteban Ocon", "abbreviation": "OCO", "number": 31, "country": "FR", "countryName": "France", "dateOfBirth": "1996-09-17", "teamId": "haas", "teamName": "Haas", "teamColor": "#B6BABD"},
    {"id": "bearman", "name": "Oliver Bearman", "abbreviation": "BEA", "number": 87, "country": "GB", "countryName": "United Kingdom", "dateOfBirth": "2005-05-08", "teamId": "haas", "teamName": "Haas", "teamColor": "#B6BABD"},
    {"id": "hulkenberg", "name": "Nico Hulkenberg", "abbreviation": "HUL", "number": 27, "country": "DE", "countryName": "Germany", "dateOfBirth": "1987-08-19", "teamId": "audi", "teamName": "Audi", "teamColor": "#00594F"},
    {"id": "bortoleto", "name": "Gabriel Bortoleto", "abbreviation": "BOR", "number": 5, "country": "BR", "countryName": "Brazil", "dateOfBirth": "2004-10-14", "teamId": "audi", "teamName": "Audi", "teamColor": "#00594F"},
    {"id": "bottas", "name": "Valtteri Bottas", "abbreviation": "BOT", "number": 77, "country": "FI", "countryName": "Finland", "dateOfBirth": "1989-08-28", "teamId": "cadillac", "teamName": "Cadillac", "teamColor": "#1E1E1E"},
    {"id": "perez", "name": "Sergio Perez", "abbreviation": "PER", "number": 11, "country": "MX", "countryName": "Mexico", "dateOfBirth": "1990-01-26", "teamId": "cadillac", "teamName": "Cadillac", "teamColor": "#1E1E1E"},
]

SEED_CONSTRUCTORS = [
    {"id": "mclaren", "name": "McLaren", "fullName": "McLaren-Mercedes", "engine": "Mercedes", "color": "#FF8000", "secondaryColor": "#47C7FC", "base": "Woking, United Kingdom", "teamPrincipal": "Andrea Stella", "chassis": "MCL60"},
    {"id": "ferrari", "name": "Ferrari", "fullName": "Scuderia Ferrari", "engine": "Ferrari", "color": "#E8002D", "secondaryColor": "#FFEB3B", "base": "Maranello, Italy", "teamPrincipal": "Frederic Vasseur", "chassis": "SF-26"},
    {"id": "red_bull", "name": "Red Bull Racing", "fullName": "Red Bull Racing-Ford", "engine": "Red Bull Powertrains/Ford", "color": "#3671C6", "secondaryColor": "#FFD700", "base": "Milton Keynes, United Kingdom", "teamPrincipal": "Christian Horner", "chassis": "RB22"},
    {"id": "mercedes", "name": "Mercedes", "fullName": "Mercedes-AMG Petronas", "engine": "Mercedes", "color": "#27F4D2", "secondaryColor": "#000000", "base": "Brackley, United Kingdom", "teamPrincipal": "Toto Wolff", "chassis": "W17"},
    {"id": "aston_martin", "name": "Aston Martin", "fullName": "Aston Martin Aramco-Honda", "engine": "Honda", "color": "#229971", "secondaryColor": "#FFFFFF", "base": "Silverstone, United Kingdom", "teamPrincipal": "Adrian Newey", "chassis": "AMR26"},
    {"id": "alpine", "name": "Alpine", "fullName": "Alpine-Mercedes", "engine": "Mercedes", "color": "#0093CC", "secondaryColor": "#FF69B4", "base": "Enstone, United Kingdom", "teamPrincipal": "Flavio Briatore (Managing)", "chassis": "A526"},
    {"id": "williams", "name": "Williams", "fullName": "Williams-Mercedes", "engine": "Mercedes", "color": "#64C4FF", "secondaryColor": "#041E42", "base": "Grove, United Kingdom", "teamPrincipal": "James Vowles", "chassis": "FW48"},
    {"id": "racing_bulls", "name": "Racing Bulls", "fullName": "Racing Bulls-Red Bull Ford", "engine": "Red Bull Powertrains/Ford", "color": "#6692FF", "secondaryColor": "#1E41FF", "base": "Faenza, Italy", "teamPrincipal": "Laurent Mekies", "chassis": "VCARB 02"},
    {"id": "haas", "name": "Haas", "fullName": "Haas-Ferrari", "engine": "Ferrari", "color": "#B6BABD", "secondaryColor": "#E60012", "base": "Kannapolis, USA", "teamPrincipal": "Ayao Komatsu", "chassis": "VF-26"},
    {"id": "audi", "name": "Audi", "fullName": "Audi F1 Team", "engine": "Audi", "color": "#00594F", "secondaryColor": "#C0C0C0", "base": "Hinwil, Switzerland", "teamPrincipal": "Mattia Binotto (COO)", "chassis": "AUD26"},
    {"id": "cadillac", "name": "Cadillac", "fullName": "Cadillac F1 Team", "engine": "Ferrari", "color": "#1E1E1E", "secondaryColor": "#D4A96A", "base": "Silverstone, UK", "teamPrincipal": "Graeme Lowdon", "chassis": "CAD26"},
]

SEED_SCHEDULE = [
    {"round": 1, "name": "Australian Grand Prix", "circuit": "Albert Park Circuit", "city": "Melbourne", "country": "Australia", "countryCode": "AU", "dateStart": "2026-03-06", "dateEnd": "2026-03-08", "raceDay": "2026-03-08", "sprint": False},
    {"round": 2, "name": "Chinese Grand Prix", "circuit": "Shanghai International Circuit", "city": "Shanghai", "country": "China", "countryCode": "CN", "dateStart": "2026-03-13", "dateEnd": "2026-03-15", "raceDay": "2026-03-15", "sprint": True},
    {"round": 3, "name": "Japanese Grand Prix", "circuit": "Suzuka International Racing Course", "city": "Suzuka", "country": "Japan", "countryCode": "JP", "dateStart": "2026-03-27", "dateEnd": "2026-03-29", "raceDay": "2026-03-29", "sprint": False},
    {"round": 4, "name": "Bahrain Grand Prix", "circuit": "Bahrain International Circuit", "city": "Sakhir", "country": "Bahrain", "countryCode": "BH", "dateStart": "2026-04-10", "dateEnd": "2026-04-12", "raceDay": "2026-04-12", "sprint": False},
    {"round": 5, "name": "Saudi Arabian Grand Prix", "circuit": "Jeddah Corniche Circuit", "city": "Jeddah", "country": "Saudi Arabia", "countryCode": "SA", "dateStart": "2026-04-17", "dateEnd": "2026-04-19", "raceDay": "2026-04-19", "sprint": False},
    {"round": 6, "name": "Miami Grand Prix", "circuit": "Miami International Autodrome", "city": "Miami", "country": "United States", "countryCode": "US", "dateStart": "2026-05-01", "dateEnd": "2026-05-03", "raceDay": "2026-05-03", "sprint": True},
    {"round": 7, "name": "Canadian Grand Prix", "circuit": "Circuit Gilles Villeneuve", "city": "Montreal", "country": "Canada", "countryCode": "CA", "dateStart": "2026-05-22", "dateEnd": "2026-05-24", "raceDay": "2026-05-24", "sprint": True},
    {"round": 8, "name": "Monaco Grand Prix", "circuit": "Circuit de Monaco", "city": "Monte Carlo", "country": "Monaco", "countryCode": "MC", "dateStart": "2026-06-05", "dateEnd": "2026-06-07", "raceDay": "2026-06-07", "sprint": False},
    {"round": 9, "name": "Spanish Grand Prix", "circuit": "Circuit de Barcelona-Catalunya", "city": "Montmelo", "country": "Spain", "countryCode": "ES", "dateStart": "2026-06-12", "dateEnd": "2026-06-14", "raceDay": "2026-06-14", "sprint": False},
    {"round": 10, "name": "Austrian Grand Prix", "circuit": "Red Bull Ring", "city": "Spielberg", "country": "Austria", "countryCode": "AT", "dateStart": "2026-06-26", "dateEnd": "2026-06-28", "raceDay": "2026-06-28", "sprint": False},
    {"round": 11, "name": "British Grand Prix", "circuit": "Silverstone Circuit", "city": "Silverstone", "country": "United Kingdom", "countryCode": "GB", "dateStart": "2026-07-03", "dateEnd": "2026-07-05", "raceDay": "2026-07-05", "sprint": True},
    {"round": 12, "name": "Belgian Grand Prix", "circuit": "Circuit de Spa-Francorchamps", "city": "Stavelot", "country": "Belgium", "countryCode": "BE", "dateStart": "2026-07-17", "dateEnd": "2026-07-19", "raceDay": "2026-07-19", "sprint": False},
    {"round": 13, "name": "Hungarian Grand Prix", "circuit": "Hungaroring", "city": "Budapest", "country": "Hungary", "countryCode": "HU", "dateStart": "2026-07-24", "dateEnd": "2026-07-26", "raceDay": "2026-07-26", "sprint": False},
    {"round": 14, "name": "Dutch Grand Prix", "circuit": "Circuit Zandvoort", "city": "Zandvoort", "country": "Netherlands", "countryCode": "NL", "dateStart": "2026-08-21", "dateEnd": "2026-08-23", "raceDay": "2026-08-23", "sprint": True},
    {"round": 15, "name": "Italian Grand Prix", "circuit": "Autodromo Nazionale Monza", "city": "Monza", "country": "Italy", "countryCode": "IT", "dateStart": "2026-09-04", "dateEnd": "2026-09-06", "raceDay": "2026-09-06", "sprint": False},
    {"round": 16, "name": "Madrid Grand Prix", "circuit": "Madrid Street Circuit", "city": "Madrid", "country": "Spain", "countryCode": "ES", "dateStart": "2026-09-12", "dateEnd": "2026-09-14", "raceDay": "2026-09-14", "sprint": False},
    {"round": 17, "name": "Azerbaijan Grand Prix", "circuit": "Baku City Circuit", "city": "Baku", "country": "Azerbaijan", "countryCode": "AZ", "dateStart": "2026-09-24", "dateEnd": "2026-09-26", "raceDay": "2026-09-26", "sprint": False},
    {"round": 18, "name": "Singapore Grand Prix", "circuit": "Marina Bay Street Circuit", "city": "Singapore", "country": "Singapore", "countryCode": "SG", "dateStart": "2026-10-09", "dateEnd": "2026-10-11", "raceDay": "2026-10-11", "sprint": True},
    {"round": 19, "name": "United States Grand Prix", "circuit": "Circuit of the Americas", "city": "Austin", "country": "United States", "countryCode": "US", "dateStart": "2026-10-23", "dateEnd": "2026-10-25", "raceDay": "2026-10-25", "sprint": False},
    {"round": 20, "name": "Mexico City Grand Prix", "circuit": "Autodromo Hermanos Rodriguez", "city": "Mexico City", "country": "Mexico", "countryCode": "MX", "dateStart": "2026-10-30", "dateEnd": "2026-11-01", "raceDay": "2026-11-01", "sprint": False},
    {"round": 21, "name": "Sao Paulo Grand Prix", "circuit": "Interlagos", "city": "Sao Paulo", "country": "Brazil", "countryCode": "BR", "dateStart": "2026-11-06", "dateEnd": "2026-11-08", "raceDay": "2026-11-08", "sprint": False},
    {"round": 22, "name": "Las Vegas Grand Prix", "circuit": "Las Vegas Strip Circuit", "city": "Las Vegas", "country": "United States", "countryCode": "US", "dateStart": "2026-11-20", "dateEnd": "2026-11-22", "raceDay": "2026-11-21", "sprint": False},
    {"round": 23, "name": "Qatar Grand Prix", "circuit": "Lusail International Circuit", "city": "Lusail", "country": "Qatar", "countryCode": "QA", "dateStart": "2026-11-27", "dateEnd": "2026-11-29", "raceDay": "2026-11-29", "sprint": False},
    {"round": 24, "name": "Abu Dhabi Grand Prix", "circuit": "Yas Marina Circuit", "city": "Abu Dhabi", "country": "United Arab Emirates", "countryCode": "AE", "dateStart": "2026-12-04", "dateEnd": "2026-12-06", "raceDay": "2026-12-06", "sprint": False},
]


def _is_race_weekend() -> bool:
    """Check if any race dateStart is within +/- 2 days of now."""
    now = datetime.utcnow()
    for race in SEED_SCHEDULE:
        race_start = datetime.fromisoformat(race["dateStart"])
        if abs((now - race_start).days) <= 2:
            return True
    return False


def _get_ttl() -> timedelta:
    """24h normally, 1h during race weekends."""
    return timedelta(hours=1) if _is_race_weekend() else timedelta(hours=24)


class SeasonService:
    """Orchestrator: Jolpica -> OpenF1 -> seed data, with SQLite cache."""

    async def _get_cached(self, key: str) -> dict | None:
        async with async_session() as session:
            result = await session.execute(
                select(SeasonCache).where(SeasonCache.cache_key == key)
            )
            cached = result.scalar_one_or_none()
            if not cached:
                return None
            ttl = _get_ttl()
            age = datetime.utcnow() - cached.fetched_at
            stale = age > ttl
            return {
                "data": json.loads(cached.data_json),
                "source": "cache",
                "original_source": cached.source,
                "fetched_at": cached.fetched_at.isoformat(),
                "stale": stale,
            }

    async def _set_cache(self, key: str, data: Any, source: str):
        async with async_session() as session:
            result = await session.execute(
                select(SeasonCache).where(SeasonCache.cache_key == key)
            )
            existing = result.scalar_one_or_none()
            now = datetime.utcnow()
            data_str = json.dumps(data)
            if existing:
                existing.data_json = data_str
                existing.source = source
                existing.fetched_at = now
            else:
                entry = SeasonCache(
                    cache_key=key,
                    season=SEASON,
                    data_json=data_str,
                    source=source,
                    fetched_at=now,
                )
                session.add(entry)
            await session.commit()

    async def _fetch_with_fallback(self, key: str, jolpica_fn, seed_data: Any) -> dict:
        # Check cache first
        cached = await self._get_cached(key)
        if cached and not cached["stale"]:
            return {
                "data": cached["data"],
                "source": cached["original_source"],
                "fetched_at": cached["fetched_at"],
                "stale": False,
            }

        # Try Jolpica
        try:
            from app.services.jolpica_client import jolpica
            data = await jolpica_fn(jolpica)
            if data:
                await self._set_cache(key, data, "jolpica")
                return {
                    "data": data,
                    "source": "jolpica",
                    "fetched_at": datetime.utcnow().isoformat(),
                    "stale": False,
                }
        except Exception as e:
            logger.warning(f"Jolpica failed for {key}: {e}")

        # Return stale cache if available
        if cached:
            return {
                "data": cached["data"],
                "source": cached["original_source"],
                "fetched_at": cached["fetched_at"],
                "stale": True,
            }

        # Fall back to seed data
        await self._set_cache(key, seed_data, "seed")
        return {
            "data": seed_data,
            "source": "seed",
            "fetched_at": datetime.utcnow().isoformat(),
            "stale": False,
        }

    async def get_drivers(self) -> dict:
        return await self._fetch_with_fallback(
            f"drivers_{SEASON}",
            lambda c: c.get_drivers(SEASON),
            SEED_DRIVERS,
        )

    async def get_constructors(self) -> dict:
        return await self._fetch_with_fallback(
            f"constructors_{SEASON}",
            lambda c: c.get_constructors(SEASON),
            SEED_CONSTRUCTORS,
        )

    async def get_schedule(self) -> dict:
        return await self._fetch_with_fallback(
            f"schedule_{SEASON}",
            lambda c: c.get_schedule(SEASON),
            SEED_SCHEDULE,
        )

    async def get_standings_drivers(self) -> dict:
        return await self._fetch_with_fallback(
            f"standings_drivers_{SEASON}",
            lambda c: c.get_driver_standings(SEASON),
            [],
        )

    async def get_standings_constructors(self) -> dict:
        return await self._fetch_with_fallback(
            f"standings_constructors_{SEASON}",
            lambda c: c.get_constructor_standings(SEASON),
            [],
        )

    async def get_race_result(self, round_num: int) -> dict:
        return await self._fetch_with_fallback(
            f"race_result_{SEASON}_{round_num}",
            lambda c: c.get_race_results(SEASON, round_num),
            [],
        )


season_service = SeasonService()
