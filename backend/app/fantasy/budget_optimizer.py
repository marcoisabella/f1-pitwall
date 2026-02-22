from __future__ import annotations

from itertools import combinations

from app.fantasy.scoring import DRIVER_PRICES, TEAM_BUDGET, MAX_DRIVERS_PER_TEAM, MAX_DRIVERS_SAME_CONSTRUCTOR
from app.utils.f1_constants import DRIVERS_2025


def optimize_team_monte_carlo(
    expected_points: dict[int, dict],
    mode: str = "value",
) -> dict:
    """Enhanced team optimizer using Monte Carlo expected points.

    Args:
        expected_points: {driver_number: {"mean_points": float, "p90": float, ...}}
        mode: "value" (max mean points per million) or "ceiling" (max p90)

    Returns:
        Optimized team dict
    """
    best_team: tuple[int, ...] | None = None
    best_score = -1.0

    driver_numbers = list(DRIVER_PRICES.keys())

    for combo in combinations(driver_numbers, MAX_DRIVERS_PER_TEAM):
        total_price = sum(DRIVER_PRICES[d] for d in combo)
        if total_price > TEAM_BUDGET:
            continue

        teams = [DRIVERS_2025[d]["team"] for d in combo if d in DRIVERS_2025]
        if any(teams.count(t) > MAX_DRIVERS_SAME_CONSTRUCTOR for t in set(teams)):
            continue

        if mode == "ceiling":
            score = sum(expected_points.get(d, {}).get("p90", 0) for d in combo)
        else:
            score = sum(expected_points.get(d, {}).get("mean_points", 0) for d in combo)

        if score > best_score:
            best_score = score
            best_team = combo

    if best_team is None:
        return {"drivers": [], "total_price": 0, "expected_points": 0, "budget_remaining": TEAM_BUDGET, "mode": mode}

    team_price = sum(DRIVER_PRICES[d] for d in best_team)
    return {
        "drivers": [
            {
                "driver_number": d,
                "price": DRIVER_PRICES[d],
                **(expected_points.get(d, {})),
            }
            for d in best_team
        ],
        "total_price": round(team_price, 1),
        "expected_points": round(best_score, 1),
        "budget_remaining": round(TEAM_BUDGET - team_price, 1),
        "mode": mode,
    }
