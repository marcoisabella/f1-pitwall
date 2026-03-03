from __future__ import annotations

# Price change amounts per category
DRIVER_PRICE_CHANGES = {
    "big_rise": 0.3,
    "small_rise": 0.1,
    "small_drop": -0.1,
    "big_drop": -0.3,
}

CONSTRUCTOR_PRICE_CHANGES = {
    "big_rise": 0.6,
    "small_rise": 0.2,
    "small_drop": -0.2,
    "big_drop": -0.6,
}

# Points thresholds per driver/constructor
# Calibrated to 2026 opening prices from fantasy.formula1.com
# Higher-priced entities need more points to trigger a price rise
# Format: points >= big_rise → +0.3M, >= small_rise → +0.1M,
#          >= small_drop → no change, <= big_drop → -0.3M,
#          between small_drop and big_drop → -0.1M
PRICE_THRESHOLDS: dict[str, dict] = {
    "drivers": {
        33: {"big_rise": 35, "small_rise": 26, "small_drop": 18, "big_drop": 17},   # VER  $27.7M
        63: {"big_rise": 34, "small_rise": 26, "small_drop": 18, "big_drop": 17},   # RUS  $27.4M
        1:  {"big_rise": 34, "small_rise": 26, "small_drop": 17, "big_drop": 16},   # NOR  $27.2M
        81: {"big_rise": 33, "small_rise": 25, "small_drop": 16, "big_drop": 15},   # PIA  $25.5M
        12: {"big_rise": 31, "small_rise": 23, "small_drop": 15, "big_drop": 14},   # ANT  $23.2M
        16: {"big_rise": 30, "small_rise": 23, "small_drop": 15, "big_drop": 14},   # LEC  $22.8M
        44: {"big_rise": 30, "small_rise": 22, "small_drop": 14, "big_drop": 13},   # HAM  $22.5M
        6:  {"big_rise": 25, "small_rise": 18, "small_drop": 11, "big_drop": 10},   # HAD  $15.1M
        10: {"big_rise": 23, "small_rise": 16, "small_drop": 10, "big_drop": 9},    # GAS  $12.0M
        55: {"big_rise": 22, "small_rise": 16, "small_drop": 10, "big_drop": 9},    # SAI  $11.8M
        23: {"big_rise": 22, "small_rise": 15, "small_drop": 9, "big_drop": 8},     # ALB  $11.6M
        14: {"big_rise": 21, "small_rise": 14, "small_drop": 8, "big_drop": 7},     # ALO  $10.0M
        18: {"big_rise": 19, "small_rise": 12, "small_drop": 6, "big_drop": 5},     # STR  $8.0M
        87: {"big_rise": 18, "small_rise": 11, "small_drop": 6, "big_drop": 5},     # BEA  $7.4M
        31: {"big_rise": 18, "small_rise": 11, "small_drop": 6, "big_drop": 5},     # OCO  $7.3M
        27: {"big_rise": 17, "small_rise": 11, "small_drop": 5, "big_drop": 4},     # HUL  $6.8M
        30: {"big_rise": 17, "small_rise": 10, "small_drop": 5, "big_drop": 4},     # LAW  $6.5M
        5:  {"big_rise": 17, "small_rise": 10, "small_drop": 5, "big_drop": 4},     # BOR  $6.4M
        43: {"big_rise": 16, "small_rise": 10, "small_drop": 4, "big_drop": 3},     # COL  $6.2M
        2:  {"big_rise": 16, "small_rise": 10, "small_drop": 4, "big_drop": 3},     # LIN  $6.2M
        11: {"big_rise": 16, "small_rise": 9, "small_drop": 4, "big_drop": 3},      # PER  $6.0M
        77: {"big_rise": 16, "small_rise": 9, "small_drop": 4, "big_drop": 3},      # BOT  $5.9M
    },
    "constructors": {
        "mercedes":       {"big_rise": 37, "small_rise": 28, "small_drop": 19, "big_drop": 18},   # $29.3M
        "mclaren":        {"big_rise": 36, "small_rise": 27, "small_drop": 18, "big_drop": 17},   # $28.9M
        "red_bull":       {"big_rise": 35, "small_rise": 27, "small_drop": 18, "big_drop": 17},   # $28.2M
        "ferrari":        {"big_rise": 31, "small_rise": 23, "small_drop": 15, "big_drop": 14},   # $23.3M
        "alpine":         {"big_rise": 23, "small_rise": 16, "small_drop": 10, "big_drop": 9},    # $12.5M
        "williams":       {"big_rise": 22, "small_rise": 15, "small_drop": 9, "big_drop": 8},     # $12.0M
        "aston_martin":   {"big_rise": 21, "small_rise": 14, "small_drop": 8, "big_drop": 7},     # $10.3M
        "haas":           {"big_rise": 18, "small_rise": 11, "small_drop": 6, "big_drop": 5},     # $7.4M
        "audi":           {"big_rise": 17, "small_rise": 11, "small_drop": 5, "big_drop": 4},     # $6.6M
        "racing_bulls":   {"big_rise": 17, "small_rise": 10, "small_drop": 5, "big_drop": 4},     # $6.3M
        "cadillac":       {"big_rise": 16, "small_rise": 9, "small_drop": 4, "big_drop": 3},      # $6.0M
    },
}

MIN_PRICE = 3.0


def predict_price_change(
    entity_id: int | str,
    points_scored: float,
    entity_type: str = "driver",
) -> dict:
    """Predict price change for a driver or constructor based on points scored.

    Returns dict with keys: change (float), category (str), thresholds (dict).
    """
    thresholds_key = "drivers" if entity_type == "driver" else "constructors"
    changes = DRIVER_PRICE_CHANGES if entity_type == "driver" else CONSTRUCTOR_PRICE_CHANGES

    thresholds = PRICE_THRESHOLDS[thresholds_key].get(entity_id)
    if thresholds is None:
        return {"change": 0.0, "category": "unknown", "thresholds": None}

    if points_scored >= thresholds["big_rise"]:
        category = "big_rise"
    elif points_scored >= thresholds["small_rise"]:
        category = "small_rise"
    elif points_scored >= thresholds["small_drop"]:
        category = "no_change"
    elif points_scored <= thresholds["big_drop"]:
        category = "big_drop"
    else:
        category = "small_drop"

    change = changes.get(category, 0.0)

    return {
        "change": change,
        "category": category,
        "thresholds": thresholds,
    }


def predict_all_changes(round_scores: dict) -> list[dict]:
    """Predict price changes for all entities given round scores.

    Args:
        round_scores: {"drivers": {driver_num: points, ...}, "constructors": {cid: points, ...}}

    Returns list of dicts with entity_id, entity_type, points, change, category.
    """
    results = []

    for driver_num, points in round_scores.get("drivers", {}).items():
        pred = predict_price_change(driver_num, points, entity_type="driver")
        results.append({
            "entity_id": driver_num,
            "entity_type": "driver",
            "points": points,
            **pred,
        })

    for cid, points in round_scores.get("constructors", {}).items():
        pred = predict_price_change(cid, points, entity_type="constructor")
        results.append({
            "entity_id": cid,
            "entity_type": "constructor",
            "points": points,
            **pred,
        })

    return results


def get_thresholds() -> dict:
    """Return full threshold data for display."""
    return {
        "drivers": {
            driver_num: {
                **thresholds,
                "price_changes": DRIVER_PRICE_CHANGES,
            }
            for driver_num, thresholds in PRICE_THRESHOLDS["drivers"].items()
        },
        "constructors": {
            cid: {
                **thresholds,
                "price_changes": CONSTRUCTOR_PRICE_CHANGES,
            }
            for cid, thresholds in PRICE_THRESHOLDS["constructors"].items()
        },
    }
