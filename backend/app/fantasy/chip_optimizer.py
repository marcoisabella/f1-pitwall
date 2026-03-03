from __future__ import annotations


class ChipOptimizer:
    """Recommends optimal chip usage timing across the season."""

    def recommend_chips(
        self,
        remaining_rounds: list[int],
        chip_inventory: dict[str, bool],
        round_variance: dict[int, float] | None = None,
    ) -> list[dict]:
        recommendations = []
        variance = round_variance or {}

        if not remaining_rounds:
            return recommendations

        # Autopilot: use early when uncertain about DRS choice
        if chip_inventory.get("autopilot", False):
            target = remaining_rounds[min(1, len(remaining_rounds) - 1)]
            recommendations.append({
                "chip": "autopilot",
                "recommended_round": target,
                "reason": "Auto-select best DRS Boost driver based on actual results",
                "expected_gain": 6.0,
            })

        # DRS Boost (Extra DRS): use on highest-variance round
        if chip_inventory.get("extra_drs", False):
            if variance:
                best_round = max(remaining_rounds, key=lambda r: variance.get(r, 0))
            else:
                best_round = remaining_rounds[0]
            recommendations.append({
                "chip": "extra_drs",
                "recommended_round": best_round,
                "reason": "Apply 2x to a second driver for maximum multiplier impact",
                "expected_gain": 12.0,
            })

        # No Negative: use on unpredictable races (rain, street circuits)
        if chip_inventory.get("no_negative", False):
            target = remaining_rounds[min(2, len(remaining_rounds) - 1)]
            recommendations.append({
                "chip": "no_negative",
                "recommended_round": target,
                "reason": "Shield against DNFs and penalties in high-risk rounds",
                "expected_gain": 10.0,
            })

        # Wildcard: use before mid-season price changes
        if chip_inventory.get("wildcard", False) and len(remaining_rounds) > 4:
            mid = remaining_rounds[len(remaining_rounds) // 3]
            recommendations.append({
                "chip": "wildcard",
                "recommended_round": mid,
                "reason": "Rebuild team before mid-season price adjustments",
                "expected_gain": 15.0,
            })

        # Limitless: use on most expensive optimal lineup round
        if chip_inventory.get("limitless", False) and len(remaining_rounds) > 2:
            target = remaining_rounds[len(remaining_rounds) // 2]
            recommendations.append({
                "chip": "limitless",
                "recommended_round": target,
                "reason": "Pick any drivers regardless of budget for one round",
                "expected_gain": 20.0,
            })

        # Final Fix: save for late-season qualifying surprises
        if chip_inventory.get("final_fix", False) and len(remaining_rounds) > 1:
            late = remaining_rounds[-2] if len(remaining_rounds) > 2 else remaining_rounds[-1]
            recommendations.append({
                "chip": "final_fix",
                "recommended_round": late,
                "reason": "Make a free transfer after qualifying for late-season advantage",
                "expected_gain": 8.0,
            })

        return recommendations


chip_optimizer = ChipOptimizer()
