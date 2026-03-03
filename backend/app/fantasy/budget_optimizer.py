from __future__ import annotations

from itertools import combinations

from app.fantasy.scoring import (
    DRIVER_PRICES, TEAM_BUDGET, MAX_DRIVERS_PER_TEAM,
    MAX_DRIVERS_SAME_CONSTRUCTOR, CONSTRUCTOR_PRICES, MAX_CONSTRUCTORS_PER_TEAM,
)
from app.utils.f1_constants import DRIVERS_2026


def optimize_team_monte_carlo(
    expected_points: dict[int, dict],
    mode: str = "value",
    constructor_expected: dict[str, dict] | None = None,
) -> dict:
    """Enhanced team optimizer using Monte Carlo expected points.

    Args:
        expected_points: {driver_number: {"mean_points": float, "p90": float, ...}}
        mode: "value" (max mean points per million) or "ceiling" (max p90)
        constructor_expected: {constructor_id: {"mean_points": float, "p90": float, ...}}

    Returns:
        Optimized team dict
    """
    best_team: tuple[int, ...] | None = None
    best_constructors: tuple[str, ...] | None = None
    best_score = -1.0

    driver_numbers = list(DRIVER_PRICES.keys())
    constructor_ids = list(CONSTRUCTOR_PRICES.keys()) if constructor_expected else []

    constructor_combos: list[tuple[str, ...]] = []
    if constructor_expected and constructor_ids:
        constructor_combos = list(combinations(constructor_ids, MAX_CONSTRUCTORS_PER_TEAM))
    else:
        constructor_combos = [()]

    key = "p90" if mode == "ceiling" else "mean_points"

    for driver_combo in combinations(driver_numbers, MAX_DRIVERS_PER_TEAM):
        driver_price = sum(DRIVER_PRICES[d] for d in driver_combo)

        teams = [DRIVERS_2026[d]["team"] for d in driver_combo if d in DRIVERS_2026]
        if any(teams.count(t) > MAX_DRIVERS_SAME_CONSTRUCTOR for t in set(teams)):
            continue

        driver_score = sum(expected_points.get(d, {}).get(key, 0) for d in driver_combo)

        for con_combo in constructor_combos:
            con_price = sum(CONSTRUCTOR_PRICES[c] for c in con_combo) if con_combo else 0
            total_price = driver_price + con_price
            if total_price > TEAM_BUDGET:
                continue

            con_score = sum(constructor_expected.get(c, {}).get(key, 0) for c in con_combo) if constructor_expected and con_combo else 0
            total_score = driver_score + con_score

            if total_score > best_score:
                best_score = total_score
                best_team = driver_combo
                best_constructors = con_combo if con_combo else None

    if best_team is None:
        result: dict = {
            "drivers": [], "total_price": 0, "total_expected": 0,
            "budget_remaining": TEAM_BUDGET, "mode": mode,
        }
        if constructor_expected:
            result["constructors"] = []
        return result

    team_price = sum(DRIVER_PRICES[d] for d in best_team)
    if best_constructors:
        team_price += sum(CONSTRUCTOR_PRICES[c] for c in best_constructors)

    driver_details = []
    for d in best_team:
        detail = {
            "driver_number": d,
            "price": DRIVER_PRICES[d],
            **(expected_points.get(d, {})),
        }
        driver_details.append(detail)

    result = {
        "drivers": driver_details,
        "total_price": round(team_price, 1),
        "total_expected": round(best_score, 1),
        "budget_remaining": round(TEAM_BUDGET - team_price, 1),
        "mode": mode,
    }

    if constructor_expected and best_constructors:
        result["constructors"] = [
            {
                "constructor_id": c,
                "price": CONSTRUCTOR_PRICES[c],
                **(constructor_expected.get(c, {})),
            }
            for c in best_constructors
        ]
    elif constructor_expected:
        result["constructors"] = []

    return result
