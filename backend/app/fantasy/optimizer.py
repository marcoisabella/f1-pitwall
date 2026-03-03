from __future__ import annotations

from itertools import combinations

from app.fantasy.scoring import (
    DRIVER_PRICES, TEAM_BUDGET, MAX_DRIVERS_PER_TEAM,
    MAX_DRIVERS_SAME_CONSTRUCTOR, CONSTRUCTOR_PRICES, MAX_CONSTRUCTORS_PER_TEAM,
)
from app.utils.f1_constants import DRIVERS_2026


def optimize_team(
    predicted_points: dict[int, float],
    constructor_points: dict[str, float] | None = None,
) -> dict:
    """Find the team of 5 drivers (+ optional 2 constructors) that maximizes expected points within budget.

    With 20 drivers and choose-5, there are C(20,5) = 15,504 combinations.
    With constructors: C(20,5) x C(11,2) = ~855K combos. Still trivially fast.
    """
    best_team: tuple[int, ...] | None = None
    best_constructors: tuple[str, ...] | None = None
    best_points = -1.0

    driver_numbers = list(DRIVER_PRICES.keys())
    constructor_ids = list(CONSTRUCTOR_PRICES.keys()) if constructor_points else []

    constructor_combos: list[tuple[str, ...]] = []
    if constructor_points and constructor_ids:
        constructor_combos = list(combinations(constructor_ids, MAX_CONSTRUCTORS_PER_TEAM))
    else:
        constructor_combos = [()]

    for driver_combo in combinations(driver_numbers, MAX_DRIVERS_PER_TEAM):
        driver_price = sum(DRIVER_PRICES[d] for d in driver_combo)

        # Check constructor constraint
        teams = [DRIVERS_2026[d]["team"] for d in driver_combo if d in DRIVERS_2026]
        if any(teams.count(t) > MAX_DRIVERS_SAME_CONSTRUCTOR for t in set(teams)):
            continue

        driver_pts = sum(predicted_points.get(d, 0) for d in driver_combo)

        for con_combo in constructor_combos:
            con_price = sum(CONSTRUCTOR_PRICES[c] for c in con_combo) if con_combo else 0
            total_price = driver_price + con_price
            if total_price > TEAM_BUDGET:
                continue

            con_pts = sum(constructor_points.get(c, 0) for c in con_combo) if constructor_points and con_combo else 0
            total_points = driver_pts + con_pts

            if total_points > best_points:
                best_points = total_points
                best_team = driver_combo
                best_constructors = con_combo if con_combo else None

    if best_team is None:
        result: dict = {
            "drivers": [],
            "total_price": 0,
            "expected_points": 0,
            "budget_remaining": TEAM_BUDGET,
        }
        if constructor_points:
            result["constructors"] = []
        return result

    total_price = sum(DRIVER_PRICES[d] for d in best_team)
    if best_constructors:
        total_price += sum(CONSTRUCTOR_PRICES[c] for c in best_constructors)

    result = {
        "drivers": list(best_team),
        "total_price": round(total_price, 1),
        "expected_points": round(best_points, 1),
        "budget_remaining": round(TEAM_BUDGET - total_price, 1),
    }
    if constructor_points:
        result["constructors"] = list(best_constructors) if best_constructors else []
    return result
