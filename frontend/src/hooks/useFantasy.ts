import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';

export interface FantasyDriver {
  driver_number: number;
  name_acronym: string;
  full_name: string;
  team_name: string;
  price: number;
  predicted_points: number;
  form_score: number;
}

export interface OptimizedTeam {
  drivers: number[];
  total_price: number;
  expected_points: number;
  budget_remaining: number;
}

export function useFantasy() {
  const { token } = useAuth();
  const [drivers, setDrivers] = useState<FantasyDriver[]>([]);
  const [savedTeam, setSavedTeam] = useState<number[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

  // Fetch available drivers (public)
  useEffect(() => {
    fetch('/api/fantasy/drivers')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setDrivers(data);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  // Fetch user's saved team (requires auth)
  useEffect(() => {
    if (!token) return;
    authFetch('/api/fantasy/team')
      .then(r => r.json())
      .then(data => {
        if (data.team?.drivers) {
          setSavedTeam(data.team.drivers);
        }
      })
      .catch(() => {});
  }, [token, authFetch]);

  const saveTeam = useCallback(async (driverNumbers: number[]) => {
    const res = await authFetch('/api/fantasy/team', {
      method: 'POST',
      body: JSON.stringify({ drivers: driverNumbers }),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.detail || 'Failed to save team');
    }
    setSavedTeam(driverNumbers);
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

  return { drivers, savedTeam, isLoading, saveTeam, fetchOptimized };
}
