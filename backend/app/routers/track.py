from __future__ import annotations

from fastapi import APIRouter

from app.services.track_map_service import track_map_service

router = APIRouter()


@router.get("/{circuit_key}")
async def get_track_svg(circuit_key: int):
    data = await track_map_service.get_circuit_svg(circuit_key)
    if data is None:
        return {"data": None}
    return {"data": data}
