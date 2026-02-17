// f1-pitwall/frontend/src/data/fantasyRules.ts
// F1 Fantasy Scoring Rules — 2025 confirmed rules (update when 2026 rules published)
// The optimizer engine must work with ANY rules config without code changes.

export interface FantasyRules {
  season: string;
  budgetCap: number;
  teamSize: { drivers: number; constructors: number };
  scoring: {
    race: Record<string, number>;
    qualifying: Record<string, number>;
    sprint: Record<string, number>;
    constructor: Record<string, number>;
    streakBonuses: Record<string, number>;
  };
  chips: Record<string, { multiplier?: number; usage: string }>;
  transfers: { perRaceweek: number; rolloverMax: number; extraTransferPenalty: number };
}

export const FANTASY_RULES_2025: FantasyRules = {
  season: "2025",
  budgetCap: 100.0,
  teamSize: { drivers: 5, constructors: 2 },
  scoring: {
    race: {
      P1: 25, P2: 18, P3: 15, P4: 12, P5: 10,
      P6: 8, P7: 6, P8: 4, P9: 2, P10: 1,
      positionsGainedPerPosition: 2,
      positionsLostPerPosition: -2,
      overtakeBonusPerOvertake: 1,
      notClassified: -10,
      disqualifiedConstructorOnly: -20,
      driverOfTheDay: 10,
    },
    qualifying: {
      Q1BeatTeammate: 2,
      Q2Reached: 2,
      Q3Reached: 3,
      polePosition: 10,
    },
    sprint: {
      P1: 8, P2: 7, P3: 6, P4: 5, P5: 4,
      P6: 3, P7: 2, P8: 1,
      positionsGainedPerPosition: 2,
      positionsLostPerPosition: -2,
      overtakeBonusPerOvertake: 1,
    },
    constructor: {
      fastestPitStopOfRace: 5,
      pitStopUnder200s: 20,
      pitStop200to219s: 10,
      pitStop220to249s: 5,
      pitStop250to299s: 2,
      pitStopWorldRecordBonus: 15,
      bothCarsQ3: 5,
      qualifyingDisqualification: -5,
      raceDisqualification: -20,
    },
    streakBonuses: {
      consecutivePoints3Races: 5,
      consecutivePoints5Races: 10,
    },
  },
  chips: {
    drsBoost: { multiplier: 2.0, usage: "Weekly — apply to one driver each raceweek" },
    extraDrs: { multiplier: 3.0, usage: "One-time chip — one driver at 3x, plus regular DRS boost 2x on another" },
    wildcard: { usage: "Unlimited transfers for one raceweek — resets your entire team if needed" },
    limitless: { usage: "Unlimited budget for one raceweek only — pick the most expensive team possible" },
    autopilot: { usage: "AI picks your team for one raceweek — let the algorithm decide" },
  },
  transfers: {
    perRaceweek: 2,
    rolloverMax: 1,
    extraTransferPenalty: -10,
  },
};

// Use this as the active rules — swap to rules_2026 when available
export const ACTIVE_RULES = FANTASY_RULES_2025;

// Key 2025 rule changes vs 2024 (display these in the rules reference page):
export const RULE_CHANGES_2025 = [
  "Constructor pit stop scoring completely overhauled — now tiered by pit time with bonuses up to 20pts for sub-2.00s stops",
  "Disqualification penalties now apply to constructors only, not drivers",
  "DSQ penalties reduced: Qualifying -15 → -5, Race -25 → -20",
  "Inactive or replaced drivers receive 'Not Classified' penalty for all sessions",
  "If a driver runs the sprint but is replaced before qualifying, you get a transfer suggestion (still costs a transfer)",
];
