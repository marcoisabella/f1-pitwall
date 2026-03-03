import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from './useAuth';
import { useLiveTiming } from './useLiveTiming';
import type { ConnectionStatus, Driver, FantasyScoreBreakdown, Session } from '../types/f1';

const RACE_POINTS: Record<number, number> = {
  1: 25, 2: 18, 3: 15, 4: 12, 5: 10,
  6: 8, 7: 6, 8: 4, 9: 2, 10: 1,
};

const QUALIFYING_POINTS: Record<number, number> = {
  1: 10, 2: 9, 3: 8, 4: 7, 5: 6,
  6: 5, 7: 4, 8: 3, 9: 2, 10: 1,
};

const POSITIONS_GAINED_PTS = 1;
const POSITIONS_LOST_PTS = -1;
const FASTEST_LAP_BONUS = 10;
// DOTD (+10) and overtakes (+1 each) not available from live timing data
const DNF_PENALTY = -20;

export interface ScoredDriver extends Driver {
  breakdown: FantasyScoreBreakdown;
  isMyTeam: boolean;
}

interface UseLiveFantasyScoringReturn {
  scoredDrivers: ScoredDriver[];
  myTeamDrivers: ScoredDriver[];
  myTeamTotal: number;
  myTeamConstructors: string[];
  hasTeam: boolean;
  isLoggedIn: boolean;
  sessionInfo: Session | null;
  connectionStatus: ConnectionStatus;
}

function computeBreakdown(driver: Driver): FantasyScoreBreakdown {
  const pos = driver.position ?? 99;
  const gridPos = driver.grid_position ?? null;

  const racePoints = RACE_POINTS[pos] ?? 0;
  const qualifyingPoints = gridPos != null ? (QUALIFYING_POINTS[gridPos] ?? 0) : 0;

  let positionDelta = 0;
  let positionsGainedLost = 0;
  if (gridPos != null && driver.position != null) {
    positionDelta = gridPos - driver.position; // positive = gained positions
    if (positionDelta > 0) {
      positionsGainedLost = positionDelta * POSITIONS_GAINED_PTS;
    } else if (positionDelta < 0) {
      positionsGainedLost = positionDelta * Math.abs(POSITIONS_LOST_PTS);
    }
  }

  const fastestLapBonus = driver.has_fastest_lap ? FASTEST_LAP_BONUS : 0;
  const dnfPenalty = driver.is_dnf ? DNF_PENALTY : 0;
  // DOTD and overtakes not available from live timing — set to 0
  const dotdBonus = 0;
  const overtakePoints = 0;
  const sprintPoints = 0;

  return {
    driver_number: driver.driver_number,
    racePoints,
    qualifyingPoints,
    positionsGainedLost,
    positionDelta,
    fastestLapBonus,
    dotdBonus,
    overtakePoints,
    sprintPoints,
    dnfPenalty,
    total: racePoints + qualifyingPoints + positionsGainedLost + fastestLapBonus + dotdBonus + overtakePoints + sprintPoints + dnfPenalty,
  };
}

export function useLiveFantasyScoring(): UseLiveFantasyScoringReturn {
  const { drivers, sessionInfo, connectionStatus } = useLiveTiming();
  const { token } = useAuth();
  const [savedTeamNumbers, setSavedTeamNumbers] = useState<number[]>([]);
  const [savedConstructors, setSavedConstructors] = useState<string[]>([]);

  const isLoggedIn = !!token;

  const fetchTeam = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/fantasy/team', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data.team?.drivers) {
        setSavedTeamNumbers(data.team.drivers);
      }
      if (data.team?.constructors) {
        setSavedConstructors(data.team.constructors);
      }
    } catch { /* ignore */ }
  }, [token]);

  useEffect(() => {
    fetchTeam();
  }, [fetchTeam]);

  const teamSet = useMemo(() => new Set(savedTeamNumbers), [savedTeamNumbers]);

  const scoredDrivers = useMemo(() => {
    return drivers
      .filter(d => d.position != null)
      .sort((a, b) => (a.position ?? 99) - (b.position ?? 99))
      .map(d => ({
        ...d,
        breakdown: computeBreakdown(d),
        isMyTeam: teamSet.has(d.driver_number),
      }));
  }, [drivers, teamSet]);

  const myTeamDrivers = useMemo(
    () => scoredDrivers.filter(d => d.isMyTeam),
    [scoredDrivers],
  );

  const myTeamTotal = useMemo(
    () => myTeamDrivers.reduce((sum, d) => sum + d.breakdown.total, 0),
    [myTeamDrivers],
  );

  return {
    scoredDrivers,
    myTeamDrivers,
    myTeamTotal,
    myTeamConstructors: savedConstructors,
    hasTeam: savedTeamNumbers.length > 0,
    isLoggedIn,
    sessionInfo,
    connectionStatus,
  };
}
