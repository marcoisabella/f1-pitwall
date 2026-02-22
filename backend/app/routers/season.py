from __future__ import annotations

from fastapi import APIRouter

from app.services.season_service import season_service

router = APIRouter()


def _response(result: dict) -> dict:
    return {
        "data": result["data"],
        "meta": {
            "source": result["source"],
            "fetched_at": result["fetched_at"],
            "stale": result.get("stale", False),
        },
    }


@router.get("/drivers")
async def get_drivers():
    return _response(await season_service.get_drivers())


@router.get("/constructors")
async def get_constructors():
    return _response(await season_service.get_constructors())


@router.get("/schedule")
async def get_schedule():
    return _response(await season_service.get_schedule())


@router.get("/standings/drivers")
async def get_driver_standings():
    return _response(await season_service.get_standings_drivers())


@router.get("/standings/constructors")
async def get_constructor_standings():
    return _response(await season_service.get_standings_constructors())


@router.get("/race/{round_num}/results")
async def get_race_results(round_num: int):
    return _response(await season_service.get_race_result(round_num))
