from __future__ import annotations

from itertools import combinations

from app.fantasy.scoring import DRIVER_PRICES, TEAM_BUDGET, MAX_DRIVERS_PER_TEAM, MAX_DRIVERS_SAME_CONSTRUCTOR
from app.utils.f1_constants import DRIVERS_2025


def optimize_team(predicted_points: dict[int, float]) -> dict:
    """Find the team of 5 drivers that maximizes expected points within budget.

    With 20 drivers and choose-5, there are C(20,5) = 15,504 combinations.
    Trivially fast to brute-force.
    """
    best_team: tuple[int, ...] | None = None
    best_points = -1.0

    driver_numbers = list(DRIVER_PRICES.keys())

    for combo in combinations(driver_numbers, MAX_DRIVERS_PER_TEAM):
        total_price = sum(DRIVER_PRICES[d] for d in combo)
        if total_price > TEAM_BUDGET:
            continue

        # Check constructor constraint
        teams = [DRIVERS_2025[d]["team"] for d in combo if d in DRIVERS_2025]
        if any(teams.count(t) > MAX_DRIVERS_SAME_CONSTRUCTOR for t in set(teams)):
            continue

        total_points = sum(predicted_points.get(d, 0) for d in combo)
        if total_points > best_points:
            best_points = total_points
            best_team = combo

    if best_team is None:
        return {
            "drivers": [],
            "total_price": 0,
            "expected_points": 0,
            "budget_remaining": TEAM_BUDGET,
        }

    return {
        "drivers": list(best_team),
        "total_price": round(sum(DRIVER_PRICES[d] for d in best_team), 1),
        "expected_points": round(best_points, 1),
        "budget_remaining": round(TEAM_BUDGET - sum(DRIVER_PRICES[d] for d in best_team), 1),
    }
