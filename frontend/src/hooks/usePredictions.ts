import { useState, useEffect, useCallback } from 'react';

export interface RacePrediction {
  driver_number: number;
  name_acronym: string;
  team_name: string;
  predicted_position: number;
  confidence: number;
  grid_position: number;
}

export interface PitWindow {
  lap_start: number;
  lap_end: number;
  compound_from: string;
  compound_to: string;
  probability: number;
}

export interface TireDegradationPoint {
  lap: number;
  degradation_percent: number;
  compound: string;
  predicted_lap_time: number;
}

export interface StrategyPrediction {
  driver_number: number;
  name_acronym: string;
  recommended_stops: number;
  pit_windows: PitWindow[];
  tire_degradation: TireDegradationPoint[];
}

export function usePredictions() {
  const [racePredictions, setRacePredictions] = useState<RacePrediction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPredictions = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/predictions/race');
      const data = await response.json();
      setRacePredictions(data.predictions || []);
      setError(null);
    } catch {
      setError('Failed to load predictions');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPredictions();
  }, [fetchPredictions]);

  const fetchStrategy = useCallback(async (driverNumber: number): Promise<StrategyPrediction | null> => {
    try {
      const response = await fetch(`/api/predictions/strategy/${driverNumber}`);
      const data = await response.json();
      return data.strategy || null;
    } catch {
      return null;
    }
  }, []);

  return { racePredictions, isLoading, error, fetchStrategy, refresh: fetchPredictions };
}
