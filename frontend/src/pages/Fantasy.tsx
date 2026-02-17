import { useState, useCallback, useEffect } from 'react';
import { useFantasy } from '../hooks/useFantasy';
import type { OptimizedTeam } from '../hooks/useFantasy';
import { DriverSelectionGrid } from '../components/fantasy/DriverSelectionGrid';
import { BudgetTracker } from '../components/fantasy/BudgetTracker';
import { TeamActions } from '../components/fantasy/TeamActions';
import { OptimizationSuggestion } from '../components/fantasy/OptimizationSuggestion';
import { ScoreHistory } from '../components/fantasy/ScoreHistory';
import type { FantasyScore } from '../components/fantasy/ScoreHistory';
import { useAuth } from '../hooks/useAuth';
import { LoadingTelemetry } from '../components/common/LoadingTelemetry';

const MAX_DRIVERS = 5;
const BUDGET = 100;

export function Fantasy() {
  const { user, token } = useAuth();
  const { drivers, savedTeam, isLoading } = useFantasy();

  const [selectedDrivers, setSelectedDrivers] = useState<number[]>([]);
  const [optimized, setOptimized] = useState<OptimizedTeam | null>(null);
  const [saving, setSaving] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [scores, setScores] = useState<FantasyScore[]>([]);
  const [initialized, setInitialized] = useState(false);

  // Initialize selection from saved team once loaded
  if (savedTeam && !initialized) {
    setSelectedDrivers(savedTeam);
    setInitialized(true);
  }

  // Fetch scores on mount (auth required)
  useEffect(() => {
    if (!token) return;
    fetch('/api/fantasy/scores', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data.scores)) setScores(data.scores);
      })
      .catch(() => {});
  }, [token]);

  const toggleDriver = useCallback((driverNumber: number) => {
    setSelectedDrivers(prev => {
      if (prev.includes(driverNumber)) {
        return prev.filter(n => n !== driverNumber);
      }
      if (prev.length >= MAX_DRIVERS) return prev;
      return [...prev, driverNumber];
    });
  }, []);

  const handleSave = useCallback(async () => {
    if (!token) return;
    setSaving(true);
    try {
      const res = await fetch('/api/fantasy/team', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ drivers: selectedDrivers }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.detail || 'Failed to save team');
      }
    } catch {
      alert('Network error saving team');
    } finally {
      setSaving(false);
    }
  }, [token, selectedDrivers]);

  const handleOptimize = useCallback(async () => {
    if (!token) return;
    setOptimizing(true);
    try {
      const res = await fetch('/api/fantasy/optimize', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setOptimized(data);
      }
    } catch {
      // ignore
    } finally {
      setOptimizing(false);
    }
  }, [token]);

  const handleApplyOptimized = useCallback((driverNumbers: number[]) => {
    setSelectedDrivers(driverNumbers);
    setOptimized(null);
  }, []);

  if (isLoading) {
    return <LoadingTelemetry />;
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64 text-f1-text-muted">
        <div className="text-center">
          <div className="text-lg font-[var(--font-display)] mb-2">Sign in to play Fantasy F1</div>
          <div className="text-sm">Create a team, optimize with AI, and compete.</div>
        </div>
      </div>
    );
  }

  const driverMap = new Map(drivers.map(d => [d.driver_number, d]));
  const spent = selectedDrivers.reduce((sum, num) => sum + (driverMap.get(num)?.price || 0), 0);
  const canSave = selectedDrivers.length === MAX_DRIVERS && spent <= BUDGET;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-f1-text uppercase tracking-wider font-[var(--font-display)]">
          Fantasy F1 Team Builder
        </h2>
        <span className="font-timing text-xs text-f1-text-muted">
          {user.username}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: Driver Selection (2/3) */}
        <div className="lg:col-span-2">
          <DriverSelectionGrid
            drivers={drivers}
            selectedDrivers={selectedDrivers}
            onToggleDriver={toggleDriver}
            maxDrivers={MAX_DRIVERS}
          />
        </div>

        {/* Right: Budget + Actions (1/3) */}
        <div className="space-y-4">
          <BudgetTracker
            selectedDrivers={selectedDrivers}
            drivers={drivers}
            budget={BUDGET}
          />

          <TeamActions
            onSave={handleSave}
            onOptimize={handleOptimize}
            canSave={canSave}
            saving={saving}
            optimizing={optimizing}
          />

          {optimized && (
            <OptimizationSuggestion
              team={optimized}
              drivers={drivers}
              onApply={handleApplyOptimized}
            />
          )}
        </div>
      </div>

      {/* Bottom: Score History */}
      <ScoreHistory scores={scores} />
    </div>
  );
}
