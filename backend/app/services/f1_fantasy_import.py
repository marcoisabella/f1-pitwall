from __future__ import annotations

import base64
import json
import logging
import re
import urllib.parse

import httpx

from app.fantasy.scoring import DRIVER_PRICES, CONSTRUCTOR_PRICES
from app.utils.f1_constants import DRIVERS_2026, CONSTRUCTORS_2026

logger = logging.getLogger(__name__)

# ── 2026 Fantasy API (Sportz Interactive "Mix" platform) ─────────────
# All endpoints live on the same domain. Public feeds need no auth.
# Authenticated /services/ endpoints require the user's full cookie string
# plus the custom `entity` header.

BASE_URL = "https://fantasy.formula1.com"
ENTITY_HEADER = 'Wh@t$|_||>'
TOUR_ID = 4

# Public (no auth) ────────────────────────────────────────────────────
PLAYERS_URL = BASE_URL + "/feeds/drivers/{gameday_id}_{lang}.json"
CONSTRAINTS_URL = BASE_URL + "/feeds/limits/constraints.json"
BOOSTERS_URL = BASE_URL + "/feeds/booster/boosters.json"
SCHEDULE_URL = BASE_URL + "/feeds/schedule/raceday_{lang}.json"
STATISTICS_URL = BASE_URL + "/feeds/statistics/{kind}_{tour_id}.json"

# Authenticated (/services/) ──────────────────────────────────────────
GETTEAM_URL = BASE_URL + "/services/user/gameplay/{guid}/getteam/{gameday_id}/{phase_id}/{team_no}/{opt_type}"
LEAGUE_LANDING_URL = BASE_URL + "/userfeeds/{guid}/leaguelanding"
HOMESTATS_URL = BASE_URL + "/userfeeds/{guid}/homestats"
WHEREAMI_URL = BASE_URL + "/whereami"

BASE_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
    ),
    "Accept": "application/json",
    "Origin": BASE_URL,
    "Referer": BASE_URL + "/",
    "entity": ENTITY_HEADER,
}

# ── ID Mapping ───────────────────────────────────────────────────────
# Map F1 Fantasy API TLA → our driver number
TLA_TO_NUMBER: dict[str, int] = {
    info["abbreviation"]: num for num, info in DRIVERS_2026.items()
}

# Map F1 Fantasy API TeamName (lowercased) → our constructor id
TEAM_NAME_TO_CID: dict[str, str] = {}
for cid, cinfo in CONSTRUCTORS_2026.items():
    TEAM_NAME_TO_CID[cinfo["name"].lower()] = cid
    TEAM_NAME_TO_CID[cinfo["full_name"].lower()] = cid
# Extra aliases for API response variations
TEAM_NAME_TO_CID.update({
    "red bull racing": "red_bull", "red bull": "red_bull",
    "aston martin": "aston_martin", "kick sauber": "audi",
    "sauber": "audi", "rb": "racing_bulls", "vcarb": "racing_bulls",
    "alphatauri": "racing_bulls", "andretti": "cadillac",
})


class F1FantasyImporter:
    """Import teams from the 2026 F1 Fantasy game (Sportz Interactive API)."""

    def __init__(self):
        self._players: list[dict] = []
        self._player_by_id: dict[str, dict] = {}
        self._constraints: dict | None = None

    # ── HTTP helpers ──────────────────────────────────────────────────

    async def _get(
        self,
        url: str,
        cookie: str | None = None,
        params: dict | None = None,
    ) -> dict | list | None:
        headers = dict(BASE_HEADERS)
        if cookie:
            headers["Cookie"] = cookie

        async with httpx.AsyncClient(timeout=20.0, follow_redirects=True) as client:
            try:
                resp = await client.get(url, headers=headers, params=params)
                logger.info("F1 Fantasy %s → %s", url[:80], resp.status_code)
                if resp.status_code == 200:
                    return resp.json()
                logger.warning("F1 Fantasy %s returned %s", url[:80], resp.status_code)
            except Exception as e:
                logger.warning("F1 Fantasy %s error: %s", url[:80], e)
        return None

    # ── Public feeds (cached) ─────────────────────────────────────────

    async def get_constraints(self) -> dict:
        if self._constraints:
            return self._constraints
        data = await self._get(CONSTRAINTS_URL)
        if data and isinstance(data, dict):
            # Unwrap: {"Data": {"Value": {...}}}
            inner = data.get("Data", data)
            if isinstance(inner, dict):
                inner = inner.get("Value", inner)
            self._constraints = inner if isinstance(inner, dict) else data
            # Add normalised keys alongside raw API keys for convenience
            val = self._constraints
            val.setdefault("gameday_id", val.get("GamedayId", 1))
            val.setdefault("phase_id", val.get("PhaseId", 1))
            val.setdefault("max_team_value", val.get("MaxTeamValue", 100))
            val.setdefault("deadline", val.get("DeadlineDate"))
            return self._constraints
        return {"GamedayId": 1, "PhaseId": 1, "MaxTeamValue": 100.0,
                "gameday_id": 1, "phase_id": 1, "max_team_value": 100, "deadline": None}

    async def get_driver_statistics(self) -> list[dict] | None:
        """Fetch round-by-round driver statistics from F1 Fantasy API."""
        url = STATISTICS_URL.format(kind="drivers", tour_id=TOUR_ID)
        data = await self._get(url)
        if data and isinstance(data, dict) and data.get("Data", {}).get("Value"):
            return data["Data"]["Value"]
        return None

    async def get_constructor_statistics(self) -> list[dict] | None:
        """Fetch round-by-round constructor statistics from F1 Fantasy API."""
        url = STATISTICS_URL.format(kind="constructors", tour_id=TOUR_ID)
        data = await self._get(url)
        if data and isinstance(data, dict) and data.get("Data", {}).get("Value"):
            return data["Data"]["Value"]
        return None

    async def get_players(self, gameday_id: int = 1) -> list[dict]:
        if self._players:
            return self._players
        url = PLAYERS_URL.format(gameday_id=gameday_id, lang="en")
        data = await self._get(url)
        if data is None:
            return []
        players = data.get("Data", data) if isinstance(data, dict) else data
        if isinstance(players, dict):
            players = players.get("Value", [])
        if not isinstance(players, list):
            return []
        self._players = players
        self._player_by_id = {str(p.get("PlayerId", "")): p for p in players}
        return players

    # ── Cookie → GUID extraction ─────────────────────────────────────

    @staticmethod
    def _extract_guid_from_cookie(cookie: str) -> str | None:
        """Try to extract the user's GUID from their F1 session cookies."""
        for cookie_name in ["F1_FANTASY_007", "login-session"]:
            match = re.search(rf"{re.escape(cookie_name)}=([^;]+)", cookie)
            if not match:
                continue
            raw = urllib.parse.unquote(match.group(1))

            token = raw
            if cookie_name == "login-session":
                try:
                    obj = json.loads(raw)
                    token = obj.get("data", {}).get("subscriptionToken", "")
                except (json.JSONDecodeError, AttributeError):
                    continue

            parts = token.split(".")
            if len(parts) < 2:
                continue

            payload_b64 = parts[1]
            payload_b64 += "=" * (4 - len(payload_b64) % 4)
            try:
                payload = json.loads(base64.urlsafe_b64decode(payload_b64))
            except Exception:
                continue

            for field in [
                "GUID", "guid", "SocialId", "socialId",
                "sub", "SubscriberId", "Id", "id",
                "userId", "user_id", "Subscriber_Id",
            ]:
                val = payload.get(field)
                if val:
                    return str(val)

            logger.info("JWT payload keys: %s", list(payload.keys()))

        return None

    async def _get_guid(self, cookie: str) -> str | None:
        """Get user GUID: try JWT decode first, then /whereami endpoint."""
        guid = self._extract_guid_from_cookie(cookie)
        if guid:
            logger.info("Extracted GUID from cookie JWT: %s", guid[:8] + "...")
            return guid

        # Fallback: try the /whereami endpoint
        data = await self._get(WHEREAMI_URL, cookie=cookie)
        if data and isinstance(data, dict):
            for field in ["GUID", "guid", "SocialId", "socialId", "Id", "id", "UserId"]:
                val = data.get(field)
                if val:
                    logger.info("Got GUID from /whereami: %s", str(val)[:8] + "...")
                    return str(val)

        return None

    # ── Map API players to our IDs ────────────────────────────────────

    def _map_player(self, player: dict) -> dict | None:
        """Map a single F1 Fantasy API player to our internal representation."""
        skill = player.get("Skill")
        tla = player.get("DriverTLA", "")
        team_name = (player.get("TeamName") or "").lower().strip()
        full_name = player.get("FUllName") or player.get("FullName") or ""
        player_id = str(player.get("PlayerId", ""))
        value = player.get("Value", 0)

        if skill == 2:
            # Constructor
            cid = TEAM_NAME_TO_CID.get(team_name)
            if not cid:
                cid = TEAM_NAME_TO_CID.get(full_name.lower().strip())
            if not cid and tla:
                for c, info in CONSTRUCTORS_2026.items():
                    if info["name"][:3].upper() == tla.upper():
                        cid = c
                        break
            if cid and cid in CONSTRUCTORS_2026:
                return {
                    "type": "constructor",
                    "fantasy_id": player_id,
                    "mapped_to": cid,
                    "name": full_name,
                    "tla": tla,
                    "price": value,
                    "our_price": CONSTRUCTOR_PRICES.get(cid, 0),
                }
        else:
            # Driver
            num = TLA_TO_NUMBER.get(tla.upper())
            if not num:
                last = full_name.split()[-1].lower() if full_name else ""
                for n, info in DRIVERS_2026.items():
                    if info["name"].split()[-1].lower() == last:
                        num = n
                        break
            if num and num in DRIVERS_2026:
                return {
                    "type": "driver",
                    "fantasy_id": player_id,
                    "mapped_to": num,
                    "name": full_name,
                    "tla": tla,
                    "abbreviation": DRIVERS_2026[num]["abbreviation"],
                    "team": DRIVERS_2026[num]["team"],
                    "price": value,
                    "our_price": DRIVER_PRICES.get(num, 0),
                }
        return None

    # ── Validate cookie ───────────────────────────────────────────────

    async def validate_cookie(self, cookie: str) -> dict:
        """Check if the cookie is valid by trying an authenticated endpoint."""
        guid = await self._get_guid(cookie)
        if not guid:
            return {
                "valid": False,
                "error": "Could not extract user identity from cookie. Make sure you copied the full cookie string.",
            }

        # Try to hit an auth-required endpoint
        url = HOMESTATS_URL.format(guid=guid)
        data = await self._get(url, cookie=cookie)
        if data is not None:
            return {"valid": True, "guid": guid}

        # Fallback: try league landing
        url = LEAGUE_LANDING_URL.format(guid=guid)
        data = await self._get(url, cookie=cookie)
        if data is not None:
            return {"valid": True, "guid": guid}

        # Fallback: if we got a GUID from JWT, assume it's valid
        # (the feeds might just not have data yet pre-season)
        return {"valid": True, "guid": guid}

    # ── Fetch team ────────────────────────────────────────────────────

    async def fetch_my_teams(self, cookie: str) -> dict:
        """
        Fetch all teams for the authenticated user.
        Returns up to 3 team slots.
        """
        guid = await self._get_guid(cookie)
        if not guid:
            return {"error": "Could not extract user identity from cookie."}

        constraints = await self.get_constraints()
        gameday_id = constraints.get("GamedayId", 1)
        phase_id = constraints.get("PhaseId", 1)

        # Load player roster for mapping
        await self.get_players(gameday_id)

        teams = []
        for team_no in range(1, 4):
            for opt_type in [2, 1]:
                url = GETTEAM_URL.format(
                    guid=guid,
                    gameday_id=gameday_id,
                    phase_id=phase_id,
                    team_no=team_no,
                    opt_type=opt_type,
                )
                data = await self._get(url, cookie=cookie)
                if data is None:
                    continue

                team_data = data.get("Data", data) if isinstance(data, dict) else data
                if isinstance(team_data, dict):
                    team_data = team_data.get("Value", team_data)

                if not team_data:
                    continue

                parsed = self._parse_team_response(team_data, team_no)
                if parsed and parsed.get("drivers"):
                    teams.append(parsed)
                    break

        if not teams:
            return {
                "error": "No teams found. Make sure you have created a team on fantasy.formula1.com.",
                "guid": guid,
            }

        return {"teams": teams, "guid": guid, "gameday_id": gameday_id}

    def _parse_team_response(self, data: dict | list, team_no: int) -> dict | None:
        """Parse the getteam API response into our format."""
        if isinstance(data, list):
            return None

        # The response might have Players/players array
        players_raw = (
            data.get("Players")
            or data.get("players")
            or data.get("PickedPlayers")
            or data.get("picked_players")
            or []
        )

        if not players_raw:
            return None

        drivers: list[int] = []
        constructors: list[str] = []
        mapped_details: list[dict] = []
        unmapped: list[dict] = []
        drs_driver = None

        for p in players_raw:
            player_id = str(p.get("PlayerId") or p.get("player_id") or p.get("id") or "")
            is_captain = p.get("IsCaptain", False) or p.get("is_captain", False)
            is_mega = p.get("IsMegaDriver", False) or p.get("is_turbo", False)

            # Look up in our player cache
            player_info = self._player_by_id.get(player_id, {})
            if not player_info:
                unmapped.append({"fantasy_id": player_id, "raw": p})
                continue

            mapped = self._map_player(player_info)
            if not mapped:
                unmapped.append({
                    "fantasy_id": player_id,
                    "name": player_info.get("FUllName", "Unknown"),
                })
                continue

            mapped["is_captain"] = is_captain
            mapped["is_mega"] = is_mega

            if mapped["type"] == "driver":
                drivers.append(mapped["mapped_to"])
                if is_captain:
                    drs_driver = mapped["mapped_to"]
            else:
                constructors.append(mapped["mapped_to"])

            mapped_details.append(mapped)

        total_price = (
            sum(DRIVER_PRICES.get(d, 0) for d in drivers)
            + sum(CONSTRUCTOR_PRICES.get(c, 0) for c in constructors)
        )

        return {
            "team_no": team_no,
            "drivers": drivers,
            "constructors": constructors,
            "drs_boost_driver": drs_driver,
            "total_price": round(total_price, 1),
            "mapped_details": mapped_details,
            "unmapped": unmapped,
        }

    # ── League discovery ──────────────────────────────────────────────

    async def get_my_leagues(self, cookie: str) -> list[dict]:
        """Get all leagues the authenticated user belongs to."""
        guid = await self._get_guid(cookie)
        if not guid:
            return []

        url = LEAGUE_LANDING_URL.format(guid=guid)
        data = await self._get(url, cookie=cookie)
        if not data:
            return []

        leagues = []
        # Response might be {"Data": {"Value": [...]}} or similar
        raw = data
        if isinstance(raw, dict):
            raw = raw.get("Data", raw)
            if isinstance(raw, dict):
                raw = raw.get("Value", raw)

        if isinstance(raw, dict):
            # Might have different league type keys
            for key in ["PrivateLeagues", "PublicLeagues", "Leagues", "leagues", "private", "public"]:
                league_list = raw.get(key, [])
                if isinstance(league_list, list):
                    for lg in league_list:
                        lid = lg.get("LeagueId") or lg.get("Id") or lg.get("id")
                        lname = lg.get("LeagueName") or lg.get("Name") or lg.get("name", "")
                        if lid:
                            leagues.append({"id": lid, "name": lname})
        elif isinstance(raw, list):
            for lg in raw:
                lid = lg.get("LeagueId") or lg.get("Id") or lg.get("id")
                lname = lg.get("LeagueName") or lg.get("Name") or lg.get("name", "")
                if lid:
                    leagues.append({"id": lid, "name": lname})

        return leagues

    # ── Convenience: full import flow ─────────────────────────────────

    async def import_team(self, cookie: str, team_no: int = 1) -> dict:
        """
        One-shot import: validate cookie, fetch team, return mapped result.
        """
        result = await self.fetch_my_teams(cookie)
        if "error" in result:
            return result

        teams = result.get("teams", [])
        if not teams:
            return {"error": "No teams found."}

        # Find the requested team_no
        target = None
        for t in teams:
            if t.get("team_no") == team_no:
                target = t
                break
        if not target:
            target = teams[0]

        target["guid"] = result.get("guid")
        target["all_teams_count"] = len(teams)
        return target


f1_fantasy_importer = F1FantasyImporter()
