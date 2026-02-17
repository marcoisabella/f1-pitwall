SCORING_RULES = {
    "finish_position": {
        1: 25, 2: 18, 3: 15, 4: 12, 5: 10,
        6: 8, 7: 6, 8: 4, 9: 2, 10: 1,
    },
    "qualifying_position": {
        1: 10, 2: 8, 3: 6, 4: 5, 5: 4,
        6: 3, 7: 2, 8: 1,
    },
    "fastest_lap": 5,
    "positions_gained": 2,
    "positions_lost": -1,
    "dnf_penalty": -10,
}

DRIVER_PRICES = {
    1: 30.0,    # VER
    4: 28.0,    # NOR
    16: 27.0,   # LEC
    44: 26.0,   # HAM
    81: 25.0,   # PIA
    63: 24.0,   # RUS
    55: 15.0,   # SAI
    14: 14.0,   # ALO
    23: 13.0,   # ALB
    22: 12.0,   # TSU
    10: 11.0,   # GAS
    30: 11.0,   # LAW
    31: 10.0,   # OCO
    27: 10.0,   # HUL
    18: 9.0,    # STR
    38: 8.0,    # BEA
    87: 7.0,    # DRU
    6: 7.0,     # HAD
    12: 6.0,    # BOR
    43: 8.0,    # ANT
}

TEAM_BUDGET = 100.0
MAX_DRIVERS_PER_TEAM = 5
MAX_DRIVERS_SAME_CONSTRUCTOR = 2
