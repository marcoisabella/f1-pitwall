from __future__ import annotations

SCORING_RULES = {
    "qualifying_position": {1: 10, 2: 9, 3: 8, 4: 7, 5: 6, 6: 5, 7: 4, 8: 3, 9: 2, 10: 1},
    "qualifying_no_time": -5,
    "qualifying_dsq_driver": 0,
    "qualifying_dsq_constructor": -5,
    "finish_position": {
        1: 25, 2: 18, 3: 15, 4: 12, 5: 10,
        6: 8, 7: 6, 8: 4, 9: 2, 10: 1,
    },
    "sprint_position": {1: 8, 2: 7, 3: 6, 4: 5, 5: 4, 6: 3, 7: 2, 8: 1},
    "position_gained": 1,
    "position_lost": -1,
    "overtake_bonus": 1,
    "fastest_lap": 10,
    "dotd": 10,
    "dnf_penalty": -20,
    "sprint_dnf_penalty": -10,
    "not_classified_qualifying": -5,
    "not_classified_race": -20,
    "dsq_constructor_race": -20,
    "dsq_constructor_qualifying": -5,
    "constructor_qualifying_bonus": {
        "neither_q2": -1, "one_q2": 1, "both_q2": 3, "one_q3": 5, "both_q3": 10,
    },
    "constructor_pitstop": {
        "under_2s": 20, "2_0_to_2_19": 10, "2_2_to_2_49": 5, "2_5_to_2_99": 2,
        "fastest_stop": 5, "record_stop": 15,
    },
}

# 2026 driver numbers — official opening prices from fantasy.formula1.com
DRIVER_PRICES = {
    33: 27.7,   # VER
    63: 27.4,   # RUS
    1: 27.2,    # NOR
    81: 25.5,   # PIA
    12: 23.2,   # ANT
    16: 22.8,   # LEC
    44: 22.5,   # HAM
    6: 15.1,    # HAD
    10: 12.0,   # GAS
    55: 11.8,   # SAI
    23: 11.6,   # ALB
    14: 10.0,   # ALO
    18: 8.0,    # STR
    87: 7.4,    # BEA
    31: 7.3,    # OCO
    27: 6.8,    # HUL
    30: 6.5,    # LAW
    5: 6.4,     # BOR
    43: 6.2,    # COL
    2: 6.2,     # LIN
    11: 6.0,    # PER
    77: 5.9,    # BOT
}

CONSTRUCTOR_PRICES = {
    "mercedes": 29.3, "mclaren": 28.9, "red_bull": 28.2, "ferrari": 23.3,
    "alpine": 12.5, "williams": 12.0, "aston_martin": 10.3,
    "haas": 7.4, "audi": 6.6, "racing_bulls": 6.3, "cadillac": 6.0,
}

# Expected constructor points per round (based on pre-season pace estimates)
CONSTRUCTOR_EXPECTED_POINTS = {
    "mercedes": 38.0, "mclaren": 36.0, "red_bull": 35.0, "ferrari": 30.0,
    "alpine": 16.0, "williams": 15.0, "aston_martin": 13.0,
    "haas": 9.0, "audi": 7.0, "racing_bulls": 7.0, "cadillac": 5.0,
}

TEAM_BUDGET = 100.0
MAX_DRIVERS_PER_TEAM = 5
MAX_CONSTRUCTORS_PER_TEAM = 2
MAX_DRIVERS_SAME_CONSTRUCTOR = 2

# Chips — DRS Boost (2x) is applied weekly, NOT a chip
CHIPS = {
    "autopilot": {
        "name": "Autopilot",
        "description": "Automatically applies your 2x Boost to the highest-scoring driver.",
        "max_uses": 1,
    },
    "extra_drs": {
        "name": "3x Boost",
        "description": "Triples one driver's weekend score. Cannot be same driver as 2x Boost.",
        "max_uses": 1,
    },
    "no_negative": {
        "name": "No Negative",
        "description": "Any driver or constructor scoring negative is set to zero.",
        "max_uses": 1,
    },
    "wildcard": {
        "name": "Wildcard",
        "description": "Unlimited transfers within the $100M budget cap.",
        "max_uses": 1,
    },
    "limitless": {
        "name": "Limitless",
        "description": "Unlimited transfers with no budget cap for one round.",
        "max_uses": 1,
    },
    "final_fix": {
        "name": "Final Fix",
        "description": "One free transfer after qualifying, before race start.",
        "max_uses": 1,
    },
}

# Transfer rules — 2026: 3 free per race, 1 carryover max
FREE_TRANSFERS_PER_RACE = 3
MAX_TRANSFER_CARRYOVER = 1
TRANSFER_PENALTY = -10
MIN_PRICE = 3.0

# Tier thresholds (price-based)
TIER_A_THRESHOLD = 20.0


def get_driver_tier(driver_number: int) -> str:
    price = DRIVER_PRICES.get(driver_number, 0)
    return "A" if price >= TIER_A_THRESHOLD else "B"


def get_constructor_tier(constructor_id: str) -> str:
    price = CONSTRUCTOR_PRICES.get(constructor_id, 0)
    return "A" if price >= TIER_A_THRESHOLD else "B"
