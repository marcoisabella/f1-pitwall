from __future__ import annotations

import random
from typing import Any

from app.fantasy.scoring import SCORING_RULES, DRIVER_PRICES


class MonteCarloSimulator:
    """Monte Carlo simulation for Fantasy F1 expected points."""

    def simulate(
        self,
        driver_predictions: dict[int, float],
        n_simulations: int = 10000,
    ) -> list[dict]:
        """Run Monte Carlo simulation for all drivers.

        Args:
            driver_predictions: {driver_number: predicted_position}
            n_simulations: number of simulations to run

        Returns:
            List of dicts with driver_number, mean/median/p10/p90/std_dev points
        """
        results: dict[int, list[float]] = {num: [] for num in driver_predictions}
        finish_points = SCORING_RULES["finish_position"]

        for _ in range(n_simulations):
            for num, pred_pos in driver_predictions.items():
                # Sample finishing position from normal distribution
                sigma = 3.0
                sampled_pos = max(1, min(22, round(random.gauss(pred_pos, sigma))))
                points = finish_points.get(sampled_pos, 0)

                # Add positions-gained bonus
                grid_pos = round(pred_pos)
                gained = grid_pos - sampled_pos
                if gained > 0:
                    points += gained * SCORING_RULES.get("positions_gained", 2)
                elif gained < 0:
                    points += abs(gained) * SCORING_RULES.get("positions_lost", -1)

                # DNF chance (~5%)
                if random.random() < 0.05:
                    points = SCORING_RULES.get("dnf_penalty", -10)

                results[num].append(points)

        output = []
        for num, point_list in results.items():
            point_list.sort()
            n = len(point_list)
            mean = sum(point_list) / n
            median = point_list[n // 2]
            p10 = point_list[int(n * 0.1)]
            p90 = point_list[int(n * 0.9)]
            variance = sum((p - mean) ** 2 for p in point_list) / n
            std_dev = variance ** 0.5

            output.append({
                "driver_number": num,
                "mean_points": round(mean, 2),
                "median_points": round(median, 2),
                "p10": round(p10, 2),
                "p90": round(p90, 2),
                "std_dev": round(std_dev, 2),
                "price": DRIVER_PRICES.get(num, 10.0),
                "value": round(mean / max(DRIVER_PRICES.get(num, 10.0), 1), 2),
            })

        output.sort(key=lambda x: x["mean_points"], reverse=True)
        return output


monte_carlo = MonteCarloSimulator()
