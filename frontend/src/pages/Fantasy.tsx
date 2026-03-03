import { useState, useCallback, useEffect } from 'react';
import { useFantasy } from '../hooks/useFantasy';
import type { OptimizedTeam } from '../hooks/useFantasy';
import { DriverSelectionGrid } from '../components/fantasy/DriverSelectionGrid';
import { ConstructorSelectionGrid } from '../components/fantasy/ConstructorSelectionGrid';
import { BudgetTracker } from '../components/fantasy/BudgetTracker';
import { TeamActions } from '../components/fantasy/TeamActions';
import { OptimizationSuggestion } from '../components/fantasy/OptimizationSuggestion';
import { ScoreHistory } from '../components/fantasy/ScoreHistory';
import type { FantasyScore } from '../components/fantasy/ScoreHistory';
import { useAuth } from '../hooks/useAuth';
import { LoadingTelemetry } from '../components/common/LoadingTelemetry';

const MAX_DRIVERS = 5;
const MAX_CONSTRUCTORS = 2;
const BUDGET = 100;

export function Fantasy() {
  const { user, token } = useAuth();
  const { drivers, constructors, savedTeam, savedConstructors, isLoading } = useFantasy();

  const [selectedDrivers, setSelectedDrivers] = useState<number[]>([]);
  const [selectedConstructors, setSelectedConstructors] = useState<string[]>([]);
  const [optimized, setOptimized] = useState<OptimizedTeam | null>(null);
  const [saving, setSaving] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [scores, setScores] = useState<FantasyScore[]>([]);
  const [initialized, setInitialized] = useState(false);

  // Initialize selection from saved team once loaded
  if (savedTeam && !initialized) {
    setSelectedDrivers(savedTeam);
    if (savedConstructors) {
      setSelectedConstructors(savedConstructors);
    }
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

  const toggleConstructor = useCallback((constructorId: string) => {
    setSelectedConstructors(prev => {
      if (prev.includes(constructorId)) {
        return prev.filter(c => c !== constructorId);
      }
      if (prev.length >= MAX_CONSTRUCTORS) return prev;
      return [...prev, constructorId];
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
        body: JSON.stringify({ drivers: selectedDrivers, constructors: selectedConstructors }),
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
  }, [token, selectedDrivers, selectedConstructors]);

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

  const handleApplyOptimized = useCallback((driverNumbers: number[], constructorIds: string[]) => {
    setSelectedDrivers(driverNumbers);
    setSelectedConstructors(constructorIds);
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
  const constructorMap = new Map(constructors.map(c => [c.constructor_id, c]));
  const driverSpent = selectedDrivers.reduce((sum, num) => sum + (driverMap.get(num)?.price || 0), 0);
  const constructorSpent = selectedConstructors.reduce((sum, id) => sum + (constructorMap.get(id)?.price || 0), 0);
  const totalSpent = driverSpent + constructorSpent;
  const canSave = selectedDrivers.length === MAX_DRIVERS && selectedConstructors.length === MAX_CONSTRUCTORS && totalSpent <= BUDGET;

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
        {/* Left: Selection Grids (2/3) */}
        <div className="lg:col-span-2 space-y-4">
          <DriverSelectionGrid
            drivers={drivers}
            selectedDrivers={selectedDrivers}
            onToggleDriver={toggleDriver}
            maxDrivers={MAX_DRIVERS}
          />
          <ConstructorSelectionGrid
            constructors={constructors}
            selectedConstructors={selectedConstructors}
            onToggleConstructor={toggleConstructor}
            maxConstructors={MAX_CONSTRUCTORS}
          />
        </div>

        {/* Right: Budget + Actions (1/3) */}
        <div className="space-y-4">
          <BudgetTracker
            selectedDrivers={selectedDrivers}
            drivers={drivers}
            selectedConstructors={selectedConstructors}
            constructors={constructors}
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
              constructors={constructors}
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
