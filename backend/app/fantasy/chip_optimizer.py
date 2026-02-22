from __future__ import annotations


class ChipOptimizer:
    """Recommends optimal chip usage timing across the season."""

    def recommend_chips(
        self,
        remaining_rounds: list[int],
        chip_inventory: dict[str, bool],
        round_variance: dict[int, float] | None = None,
    ) -> list[dict]:
        """Generate chip usage recommendations.

        Args:
            remaining_rounds: list of upcoming round numbers
            chip_inventory: {chip_name: available}
            round_variance: optional {round: variance_score} for targeting

        Returns:
            List of recommendations with round, chip, reason
        """
        recommendations = []
        variance = round_variance or {}

        if not remaining_rounds:
            return recommendations

        # DRS Boost: use on highest-variance round
        if chip_inventory.get("drsBoost", True):
            if variance:
                best_round = max(remaining_rounds, key=lambda r: variance.get(r, 0))
            else:
                best_round = remaining_rounds[0]
            recommendations.append({
                "chip": "drsBoost",
                "recommended_round": best_round,
                "reason": "Apply to driver with highest upside potential",
                "expected_gain": 8.5,
            })

        # Wildcard: use before mid-season price changes
        if chip_inventory.get("wildcard", True) and len(remaining_rounds) > 4:
            mid = remaining_rounds[len(remaining_rounds) // 3]
            recommendations.append({
                "chip": "wildcard",
                "recommended_round": mid,
                "reason": "Rebuild team before mid-season price adjustments",
                "expected_gain": 15.0,
            })

        # Limitless: use on most expensive optimal lineup round
        if chip_inventory.get("limitless", True) and len(remaining_rounds) > 2:
            target = remaining_rounds[len(remaining_rounds) // 2]
            recommendations.append({
                "chip": "limitless",
                "recommended_round": target,
                "reason": "Pick the most expensive drivers without budget constraint",
                "expected_gain": 20.0,
            })

        # Extra DRS: save for championship-deciding rounds
        if chip_inventory.get("extraDrs", True) and len(remaining_rounds) > 1:
            late = remaining_rounds[-2] if len(remaining_rounds) > 2 else remaining_rounds[-1]
            recommendations.append({
                "chip": "extraDrs",
                "recommended_round": late,
                "reason": "Maximum multiplier impact in late-season round",
                "expected_gain": 25.0,
            })

        return recommendations


chip_optimizer = ChipOptimizer()
