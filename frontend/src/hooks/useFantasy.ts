import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import type { F1Player } from '../types/f1';

export interface FantasyDriver {
  driver_number: number;
  name_acronym: string;
  full_name: string;
  team_name: string;
  price: number;
  predicted_points: number;
  form_score: number;
  tier: 'A' | 'B';
}

export interface FantasyConstructor {
  constructor_id: string;
  name: string;
  full_name: string;
  color: string;
  engine: string;
  drivers: number[];
  driver_abbreviations: string[];
  price: number;
  expected_points: number;
  tier: 'A' | 'B';
}

export interface OptimizedTeam {
  drivers: number[];
  constructors: string[];
  total_price: number;
  expected_points: number;
  budget_remaining: number;
}

export interface SavedTeam {
  team_number: number;
  name: string | null;
  drivers: number[];
  constructors: string[];
  total_price: number;
  drs_boost_driver: number | null;
  active_chip: string | null;
}

export interface FantasySettings {
  active_team_number: number;
  transfers_used: number;
  free_transfers_remaining: number;
  chips_used: Record<string, number>;
  season: number;
}

export function useFantasy() {
  const { token } = useAuth();
  const [drivers, setDrivers] = useState<FantasyDriver[]>([]);
  const [constructors, setConstructors] = useState<FantasyConstructor[]>([]);
  const [savedTeams, setSavedTeams] = useState<SavedTeam[]>([]);
  const [settings, setSettings] = useState<FantasySettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Legacy compat getters
  const savedTeam = savedTeams.length > 0 ? savedTeams[0]?.drivers ?? null : null;
  const savedConstructors = savedTeams.length > 0 ? savedTeams[0]?.constructors ?? null : null;

  const authFetch = useCallback(async (url: string, options?: RequestInit) => {
    return fetch(url, {
      ...options,
      headers: {
        ...options?.headers,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        'Content-Type': 'application/json',
      },
    });
  }, [token]);

  // Fetch available drivers + constructors (public)
  useEffect(() => {
    Promise.all([
      fetch('/api/fantasy/drivers').then(r => r.json()),
      fetch('/api/fantasy/constructors').then(r => r.json()),
    ])
      .then(([driverData, constructorData]) => {
        if (Array.isArray(driverData)) setDrivers(driverData);
        if (Array.isArray(constructorData)) setConstructors(constructorData);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  // Fetch user's saved teams + settings (requires auth)
  useEffect(() => {
    if (!token) return;
    Promise.all([
      authFetch('/api/fantasy/teams').then(r => r.json()),
      authFetch('/api/fantasy/settings').then(r => r.json()),
    ])
      .then(([teamsData, settingsData]) => {
        if (Array.isArray(teamsData.teams)) {
          setSavedTeams(teamsData.teams.map((t: Record<string, unknown>) => ({
            team_number: t.team_number ?? 1,
            name: t.name ?? null,
            drivers: (t.drivers as number[]) ?? [],
            constructors: (t.constructors as string[]) ?? [],
            total_price: t.total_price ?? 0,
            drs_boost_driver: t.drs_boost_driver ?? null,
            active_chip: t.active_chip ?? null,
          })));
        }
        if (settingsData && typeof settingsData === 'object') {
          setSettings(settingsData as FantasySettings);
        }
      })
      .catch(() => {});
  }, [token, authFetch]);

  const saveTeam = useCallback(async (
    driverNumbers: number[],
    constructorIds: string[] = [],
    teamNumber: number = 1,
    name?: string,
    drsBoostDriver?: number,
    activeChip?: string,
  ) => {
    const res = await authFetch('/api/fantasy/team', {
      method: 'POST',
      body: JSON.stringify({
        drivers: driverNumbers,
        constructors: constructorIds,
        team_number: teamNumber,
        name: name ?? null,
        drs_boost_driver: drsBoostDriver ?? null,
        active_chip: activeChip ?? null,
      }),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.detail || 'Failed to save team');
    }
    // Refresh teams
    const teamsRes = await authFetch('/api/fantasy/teams');
    const teamsData = await teamsRes.json();
    if (Array.isArray(teamsData.teams)) {
      setSavedTeams(teamsData.teams.map((t: Record<string, unknown>) => ({
        team_number: t.team_number ?? 1,
        name: t.name ?? null,
        drivers: (t.drivers as number[]) ?? [],
        constructors: (t.constructors as string[]) ?? [],
        total_price: t.total_price ?? 0,
        drs_boost_driver: t.drs_boost_driver ?? null,
        active_chip: t.active_chip ?? null,
      })));
    }
  }, [authFetch]);

  const updateSettings = useCallback(async (activeTeamNumber: number) => {
    const res = await authFetch('/api/fantasy/settings', {
      method: 'PUT',
      body: JSON.stringify({ active_team_number: activeTeamNumber }),
    });
    if (res.ok) {
      const data = await res.json();
      setSettings(data as FantasySettings);
    }
  }, [authFetch]);

  const activateChip = useCallback(async (chip: string, roundNumber: number) => {
    const res = await authFetch('/api/fantasy/chips/activate', {
      method: 'POST',
      body: JSON.stringify({ chip, round_number: roundNumber }),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.detail || 'Failed to activate chip');
    }
    const data = await res.json();
    setSettings(data as FantasySettings);
  }, [authFetch]);

  const setDrsBoost = useCallback(async (teamNumber: number, driverNumber: number) => {
    const res = await authFetch('/api/fantasy/drs/apply', {
      method: 'POST',
      body: JSON.stringify({ team_number: teamNumber, driver_number: driverNumber }),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.detail || 'Failed to apply DRS boost');
    }
    // Refresh teams
    const teamsRes = await authFetch('/api/fantasy/teams');
    const teamsData = await teamsRes.json();
    if (Array.isArray(teamsData.teams)) {
      setSavedTeams(teamsData.teams.map((t: Record<string, unknown>) => ({
        team_number: t.team_number ?? 1,
        name: t.name ?? null,
        drivers: (t.drivers as number[]) ?? [],
        constructors: (t.constructors as string[]) ?? [],
        total_price: t.total_price ?? 0,
        drs_boost_driver: t.drs_boost_driver ?? null,
        active_chip: t.active_chip ?? null,
      })));
    }
  }, [authFetch]);

  const makeTransfer = useCallback(async (
    teamNumber: number,
    driversIn: number[],
    driversOut: number[],
    constructorsIn?: string[],
    constructorsOut?: string[],
  ) => {
    const res = await authFetch('/api/fantasy/transfer', {
      method: 'POST',
      body: JSON.stringify({
        team_number: teamNumber,
        drivers_in: driversIn,
        drivers_out: driversOut,
        constructors_in: constructorsIn ?? [],
        constructors_out: constructorsOut ?? [],
      }),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.detail || 'Failed to make transfer');
    }
    return await res.json();
  }, [authFetch]);

  const fetchOptimized = useCallback(async (): Promise<OptimizedTeam | null> => {
    try {
      const res = await authFetch('/api/fantasy/optimize');
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }, [authFetch]);

  return {
    drivers,
    constructors,
    savedTeams,
    savedTeam,
    savedConstructors,
    settings,
    isLoading,
    saveTeam,
    updateSettings,
    activateChip,
    setDrsBoost,
    makeTransfer,
    fetchOptimized,
  };
}

export function useF1Players() {
  const [drivers, setDrivers] = useState<F1Player[]>([]);
  const [constructors, setConstructors] = useState<F1Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPlayers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/fantasy/f1-players');
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const data = await res.json();
      setDrivers(data.drivers || []);
      setConstructors(data.constructors || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch players');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPlayers(); }, [fetchPlayers]);

  return { drivers, constructors, loading, error, refetch: fetchPlayers };
}
