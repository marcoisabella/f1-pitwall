import { useState, useEffect, useCallback } from 'react';

interface SeasonMeta {
  source: string;
  fetched_at: string;
  stale: boolean;
}

interface UseSeasonDataReturn<T> {
  data: T | null;
  meta: SeasonMeta | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useSeasonData<T>(endpoint: string): UseSeasonDataReturn<T> {
  const [data, setData] = useState<T | null>(null);
  const [meta, setMeta] = useState<SeasonMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    fetch(`/api/season/${endpoint}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((json) => {
        if (cancelled) return;
        setData(json.data);
        setMeta(json.meta);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [endpoint, refreshKey]);

  return { data, meta, isLoading, error, refresh };
}

// Convenience hooks
export function useDrivers() {
  return useSeasonData<DriverAPI[]>('drivers');
}

export function useConstructors() {
  return useSeasonData<ConstructorAPI[]>('constructors');
}

export function useSchedule() {
  return useSeasonData<RaceAPI[]>('schedule');
}

export function useDriverStandings() {
  return useSeasonData<DriverStandingAPI[]>('standings/drivers');
}

export function useConstructorStandings() {
  return useSeasonData<ConstructorStandingAPI[]>('standings/constructors');
}

// API response types
export interface DriverAPI {
  id: string;
  name: string;
  abbreviation: string;
  number: number;
  country: string;
  countryName?: string;
  dateOfBirth: string;
  teamId?: string;
  teamName?: string;
  teamColor?: string;
  role?: string;
  note?: string;
}

export interface ConstructorAPI {
  id: string;
  name: string;
  fullName?: string;
  engine?: string;
  color?: string;
  secondaryColor?: string;
  base?: string;
  teamPrincipal?: string;
  chassis?: string;
  country?: string;
}

export interface RaceAPI {
  round: number;
  name: string;
  circuit: string;
  city: string;
  country?: string;
  countryName?: string;
  countryCode?: string;
  dateStart?: string;
  dateEnd?: string;
  raceDay?: string;
  date?: string;
  sprint: boolean;
  note?: string;
}

export interface DriverStandingAPI {
  position: number;
  points: number;
  wins: number;
  driver_id: string;
  driver_name: string;
  driver_code: string;
  constructor_id: string;
  constructor_name: string;
}

export interface ConstructorStandingAPI {
  position: number;
  points: number;
  wins: number;
  constructor_id: string;
  constructor_name: string;
}
