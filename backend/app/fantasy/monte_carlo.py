from __future__ import annotations

import random
from typing import Any

from app.fantasy.scoring import SCORING_RULES, DRIVER_PRICES, CONSTRUCTOR_PRICES, CONSTRUCTOR_EXPECTED_POINTS
from app.utils.f1_constants import CONSTRUCTORS_2026


class MonteCarloSimulator:
    """Monte Carlo simulation for Fantasy F1 expected points."""

    def simulate(
        self,
        driver_predictions: dict[int, float],
        n_simulations: int = 10000,
    ) -> list[dict]:
        """Run Monte Carlo simulation for all drivers (legacy path).

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

        return self._summarize(results)

    def simulate_fantasy(
        self,
        fantasy_predictions: list[dict],
        residual_std: float = 3.0,
        n_simulations: int = 10000,
    ) -> list[dict]:
        """Run Monte Carlo using learned per-component distributions.

        Args:
            fantasy_predictions: output from predict_fantasy_points()
            residual_std: position delta noise from PositionDeltaPredictor
            n_simulations: number of simulations

        Returns:
            Same format as simulate() but with learned per-driver variance.
        """
        finish_points = SCORING_RULES["finish_position"]
        quali_points = SCORING_RULES["qualifying_position"]
        fl_bonus = SCORING_RULES.get("fastest_lap", 5)
        gained_mult = SCORING_RULES.get("positions_gained", 2)
        lost_mult = SCORING_RULES.get("positions_lost", -1)
        dnf_penalty = SCORING_RULES.get("dnf_penalty", -10)

        results: dict[int, list[float]] = {
            p["driver_number"]: [] for p in fantasy_predictions
        }

        field_size = len(fantasy_predictions)

        for _ in range(n_simulations):
            # Sample qualifying positions with small noise, resolve conflicts
            quali_samples: list[tuple[int, float]] = []
            for p in fantasy_predictions:
                noise = random.gauss(0, 1.5)
                sampled_quali = max(1, min(field_size, round(p["pred_quali_position"] + noise)))
                quali_samples.append((p["driver_number"], sampled_quali))

            # Resolve duplicate qualifying positions
            quali_samples.sort(key=lambda x: x[1])
            quali_assigned: dict[int, int] = {}
            used_positions: set[int] = set()
            for num, qpos in quali_samples:
                pos = int(qpos)
                while pos in used_positions:
                    pos += 1
                quali_assigned[num] = min(pos, field_size)
                used_positions.add(quali_assigned[num])

            # Sample FL driver from probability distribution
            fl_probs = [(p["driver_number"], p.get("fl_prob", 0.05)) for p in fantasy_predictions]
            fl_cumulative = []
            cumsum = 0.0
            for num, prob in fl_probs:
                cumsum += prob
                fl_cumulative.append((num, cumsum))
            fl_roll = random.random() * cumsum
            fl_winner = fl_cumulative[-1][0]
            for num, cum in fl_cumulative:
                if fl_roll <= cum:
                    fl_winner = num
                    break

            # Per-driver: sample DNF, delta, compute points
            finish_samples: list[tuple[int, float]] = []
            dnf_drivers: set[int] = set()

            for p in fantasy_predictions:
                num = p["driver_number"]
                dnf_prob = p.get("dnf_prob", 0.05)

                if random.random() < dnf_prob:
                    dnf_drivers.add(num)
                    continue

                delta_noise = random.gauss(0, residual_std)
                sampled_delta = p["pred_position_delta"] + delta_noise
                grid = p["grid_position"]
                sampled_finish = max(1, min(field_size, round(grid - sampled_delta)))
                finish_samples.append((num, sampled_finish))

            # Resolve duplicate finish positions
            finish_samples.sort(key=lambda x: x[1])
            finish_assigned: dict[int, int] = {}
            used_finish: set[int] = set()
            for num, fpos in finish_samples:
                pos = int(fpos)
                while pos in used_finish:
                    pos += 1
                finish_assigned[num] = min(pos, field_size)
                used_finish.add(finish_assigned[num])

            # Score each driver
            for p in fantasy_predictions:
                num = p["driver_number"]
                grid = p["grid_position"]
                quali_pos = quali_assigned.get(num, p["pred_quali_position"])

                points = float(quali_points.get(quali_pos, 0))

                if num in dnf_drivers:
                    points += dnf_penalty
                else:
                    finish_pos = finish_assigned.get(num, grid)
                    points += finish_points.get(finish_pos, 0)

                    gained = grid - finish_pos
                    if gained > 0:
                        points += gained * gained_mult
                    elif gained < 0:
                        points += abs(gained) * lost_mult

                    if num == fl_winner:
                        points += fl_bonus

                results[num].append(points)

        return self._summarize(results)

    def simulate_constructors(
        self,
        n_simulations: int = 10000,
    ) -> list[dict]:
        """Run Monte Carlo simulation for constructors.

        Heuristic per-constructor scoring:
        - Pit stop quality tier -> expected points bucket
        - Both-cars-Q3 probability based on team strength
        - Small DQ risk

        Returns:
            List of dicts: {constructor_id, mean_points, p10, p90, std_dev, price, value}
        """
        results: dict[str, list[float]] = {cid: [] for cid in CONSTRUCTOR_PRICES}

        for _ in range(n_simulations):
            for cid, base_pts in CONSTRUCTOR_EXPECTED_POINTS.items():
                # Sample around expected with some variance
                sigma = base_pts * 0.3
                sampled = random.gauss(base_pts, sigma)

                # DQ risk (~1%)
                if random.random() < 0.01:
                    sampled = max(sampled - 15, 0)

                results[cid].append(max(0, sampled))

        return self._summarize_constructors(results)

    @staticmethod
    def _summarize(results: dict[int, list[float]]) -> list[dict]:
        output = []
        for num, point_list in results.items():
            if not point_list:
                output.append({
                    "driver_number": num,
                    "mean_points": 0, "median_points": 0,
                    "p10": 0, "p90": 0, "std_dev": 0,
                    "price": DRIVER_PRICES.get(num, 10.0), "value": 0,
                })
                continue

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

    @staticmethod
    def _summarize_constructors(results: dict[str, list[float]]) -> list[dict]:
        output = []
        for cid, point_list in results.items():
            if not point_list:
                output.append({
                    "constructor_id": cid,
                    "mean_points": 0, "median_points": 0,
                    "p10": 0, "p90": 0, "std_dev": 0,
                    "price": CONSTRUCTOR_PRICES.get(cid, 10.0), "value": 0,
                })
                continue

            point_list.sort()
            n = len(point_list)
            mean = sum(point_list) / n
            median = point_list[n // 2]
            p10 = point_list[int(n * 0.1)]
            p90 = point_list[int(n * 0.9)]
            variance = sum((p - mean) ** 2 for p in point_list) / n
            std_dev = variance ** 0.5

            info = CONSTRUCTORS_2026.get(cid, {})
            output.append({
                "constructor_id": cid,
                "name": info.get("name", cid),
                "full_name": info.get("full_name", cid),
                "color": info.get("color", "#888"),
                "engine": info.get("engine", ""),
                "drivers": info.get("drivers", []),
                "mean_points": round(mean, 2),
                "median_points": round(median, 2),
                "p10": round(p10, 2),
                "p90": round(p90, 2),
                "std_dev": round(std_dev, 2),
                "price": CONSTRUCTOR_PRICES.get(cid, 10.0),
                "value": round(mean / max(CONSTRUCTOR_PRICES.get(cid, 10.0), 1), 2),
            })

        output.sort(key=lambda x: x["mean_points"], reverse=True)
        return output


monte_carlo = MonteCarloSimulator()
