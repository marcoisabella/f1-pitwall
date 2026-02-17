from fastapi import APIRouter

from app.services.openf1_client import openf1

router = APIRouter()


@router.get("/current")
async def get_current_weather():
    session = await openf1.get_latest_session()
    if not session:
        return {"error": "No active session"}
    weather = await openf1.get_weather(session["session_key"])
    if not weather:
        return {"error": "No weather data"}
    return weather[-1]


@router.get("/{session_key}")
async def get_session_weather(session_key: int):
    return await openf1.get_weather(session_key)
