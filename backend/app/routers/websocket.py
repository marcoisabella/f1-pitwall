from __future__ import annotations

import asyncio
import json
import logging

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.services.openf1_client import openf1

logger = logging.getLogger(__name__)
router = APIRouter()

connected_clients: set[WebSocket] = set()
_polling_task: asyncio.Task | None = None
_last_state: dict | None = None


async def fetch_live_state() -> dict:
    session = await openf1.get_latest_session()
    if not session:
        return {"type": "full_state", "data": {"session": None, "drivers": []}}

    session_key = session["session_key"]

    positions, intervals, laps, stints, race_control, drivers, weather = await asyncio.gather(
        openf1.get_positions(session_key),
        openf1.get_intervals(session_key),
        openf1.get_laps(session_key),
        openf1.get_stints(session_key),
        openf1.get_race_control(session_key),
        openf1.get_drivers(session_key),
        openf1.get_weather(session_key),
    )

    driver_map: dict[int, dict] = {}
    for d in drivers:
        num = d.get("driver_number")
        if num:
            driver_map[num] = {
                "driver_number": num,
                "name_acronym": d.get("name_acronym", ""),
                "full_name": d.get("full_name", ""),
                "team_name": d.get("team_name", ""),
                "team_colour": d.get("team_colour", ""),
                "position": None,
                "gap_to_leader": None,
                "interval": None,
                "last_lap_time": None,
                "sector_1_time": None,
                "sector_2_time": None,
                "sector_3_time": None,
                "compound": None,
                "tire_age": None,
                "pit_stops": 0,
            }

    for p in positions:
        num = p.get("driver_number")
        if num in driver_map and p.get("position"):
            driver_map[num]["position"] = p["position"]

    for i in intervals:
        num = i.get("driver_number")
        if num in driver_map:
            driver_map[num]["gap_to_leader"] = i.get("gap_to_leader")
            driver_map[num]["interval"] = i.get("interval")

    driver_laps: dict[int, dict] = {}
    for lap in laps:
        num = lap.get("driver_number")
        if num:
            driver_laps[num] = lap
    for num, lap in driver_laps.items():
        if num in driver_map:
            driver_map[num]["last_lap_time"] = lap.get("lap_duration")
            driver_map[num]["sector_1_time"] = lap.get("duration_sector_1")
            driver_map[num]["sector_2_time"] = lap.get("duration_sector_2")
            driver_map[num]["sector_3_time"] = lap.get("duration_sector_3")

    driver_stints: dict[int, dict] = {}
    for stint in stints:
        num = stint.get("driver_number")
        if num:
            driver_stints[num] = stint
    for num, stint in driver_stints.items():
        if num in driver_map:
            driver_map[num]["compound"] = stint.get("compound")
            tire_age = stint.get("tyre_age_at_pit_out")
            lap_start = stint.get("lap_start")
            lap_end = stint.get("lap_end")
            if tire_age is not None and lap_end is not None and lap_start is not None:
                driver_map[num]["tire_age"] = tire_age + (lap_end - lap_start)
            elif tire_age is not None:
                driver_map[num]["tire_age"] = tire_age

    pit_data = {}
    for stint in stints:
        num = stint.get("driver_number")
        if num:
            stint_num = stint.get("stint_number", 1)
            current = pit_data.get(num, 0)
            pit_data[num] = max(current, stint_num - 1)
    for num, count in pit_data.items():
        if num in driver_map:
            driver_map[num]["pit_stops"] = count

    sorted_drivers = sorted(
        driver_map.values(),
        key=lambda d: d["position"] if d["position"] is not None else 999,
    )

    return {
        "type": "full_state",
        "data": {
            "session": session,
            "drivers": sorted_drivers,
            "race_control": race_control[-10:] if race_control else [],
            "weather": weather[-1] if weather else None,
        },
    }


async def broadcast(message: dict):
    payload = json.dumps(message)
    disconnected = set()
    for client in connected_clients:
        try:
            await client.send_text(payload)
        except Exception:
            disconnected.add(client)
    connected_clients.difference_update(disconnected)


async def poll_and_broadcast():
    global _last_state
    backoff = 15  # seconds between polls
    while connected_clients:
        try:
            state = await fetch_live_state()
            await broadcast(state)
            _last_state = state
            backoff = 15  # reset on success
        except Exception as e:
            logger.error(f"Polling error: {e}")
            backoff = min(backoff * 2, 60)  # back off on errors
        await asyncio.sleep(backoff)


@router.websocket("/ws/timing")
async def websocket_timing(websocket: WebSocket):
    global _polling_task

    await websocket.accept()
    connected_clients.add(websocket)
    logger.info(f"WebSocket client connected. Total: {len(connected_clients)}")

    # Send cached state immediately if available (no extra API call)
    if _last_state:
        await websocket.send_text(json.dumps(_last_state))

    # Start polling if not already running
    if _polling_task is None or _polling_task.done():
        _polling_task = asyncio.create_task(poll_and_broadcast())

    try:
        while True:
            # Keep connection alive, listen for client messages
            await websocket.receive_text()
    except WebSocketDisconnect:
        connected_clients.discard(websocket)
        logger.info(f"WebSocket client disconnected. Total: {len(connected_clients)}")
