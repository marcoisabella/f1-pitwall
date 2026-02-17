from __future__ import annotations

from fastapi import APIRouter, Query
from typing import Optional

from app.services.openf1_client import openf1
from app.services.prediction_engine import prediction_engine

router = APIRouter()


@router.get("/race")
async def predict_race(session_key: Optional[int] = Query(None)):
    """Get predicted finishing order for a race session."""
    if session_key is None:
        session = await openf1.get_latest_session()
        if not session:
            return {"error": "No active session", "predictions": []}
        session_key = session["session_key"]

    predictions = await prediction_engine.predict_race(session_key)
    return {"session_key": session_key, "predictions": predictions}


@router.get("/strategy/{driver_number}")
async def predict_strategy(driver_number: int, session_key: Optional[int] = Query(None)):
    """Get pit stop strategy recommendation for a driver."""
    if session_key is None:
        session = await openf1.get_latest_session()
        if not session:
            return {"error": "No active session"}
        session_key = session["session_key"]

    strategy = await prediction_engine.predict_strategy(session_key, driver_number)
    return {"session_key": session_key, "strategy": strategy}
