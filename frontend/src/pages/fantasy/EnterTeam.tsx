import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useF1Players, useFantasy } from '../../hooks/useFantasy';
import { PageHeader } from '../../components/fantasy/PageHeader';
import { TeamSlotTabs } from '../../components/fantasy/TeamSlotTabs';
import { SearchBar } from '../../components/fantasy/SearchBar';
import { DriverPill } from '../../components/fantasy/DriverPill';
import { ConstructorPill } from '../../components/fantasy/ConstructorPill';
import type { F1Player } from '../../types/f1';

const BUDGET_CAP = 100.0;
const MAX_DRIVERS = 5;
const MAX_CONSTRUCTORS = 2;
const MAX_SAME_TEAM = 2;

export function EnterTeam() {
  const { user } = useAuth();
  const { drivers, constructors, loading, error: fetchError } = useF1Players();
  const { saveTeam } = useFantasy();

  const [selectedDrivers, setSelectedDrivers] = useState<F1Player[]>([]);
  const [selectedConstructors, setSelectedConstructors] = useState<F1Player[]>([]);
  const [activeSlot, setActiveSlot] = useState<1 | 2 | 3>(1);
  const [searchDriver, setSearchDriver] = useState('');
  const [searchConstructor, setSearchConstructor] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Budget calculations
  const totalPrice = useMemo(() => {
    const driverCost = selectedDrivers.reduce((sum, d) => sum + d.price, 0);
    const constructorCost = selectedConstructors.reduce((sum, c) => sum + c.price, 0);
    return driverCost + constructorCost;
  }, [selectedDrivers, selectedConstructors]);

  const budgetRemaining = BUDGET_CAP - totalPrice;
  const overBudget = budgetRemaining < 0;
  const teamComplete =
    selectedDrivers.length === MAX_DRIVERS &&
    selectedConstructors.length === MAX_CONSTRUCTORS &&
    !overBudget;

  // Count drivers per team for the 2-per-constructor rule
  const teamDriverCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const d of selectedDrivers) {
      counts[d.team_name] = (counts[d.team_name] || 0) + 1;
    }
    return counts;
  }, [selectedDrivers]);

  // Sort drivers by price descending
  const sortedDrivers = useMemo(() => {
    return [...drivers].sort((a, b) => b.price - a.price);
  }, [drivers]);

  // Sort constructors by price descending
  const sortedConstructors = useMemo(() => {
    return [...constructors].sort((a, b) => b.price - a.price);
  }, [constructors]);

  // Filter drivers by search (supports "VER+NOR" style multi-search)
  const filteredDrivers = useMemo(() => {
    if (!searchDriver.trim()) return sortedDrivers;
    const terms = searchDriver
      .toUpperCase()
      .split('+')
      .map((t) => t.trim())
      .filter(Boolean);
    if (terms.length === 0) return sortedDrivers;
    return sortedDrivers.filter((d) =>
      terms.some(
        (term) =>
          d.tla.toUpperCase().includes(term) ||
          d.name.toUpperCase().includes(term) ||
          d.team_name.toUpperCase().includes(term)
      )
    );
  }, [sortedDrivers, searchDriver]);

  // Filter constructors by search
  const filteredConstructors = useMemo(() => {
    if (!searchConstructor.trim()) return sortedConstructors;
    const term = searchConstructor.toUpperCase().trim();
    return sortedConstructors.filter(
      (c) =>
        c.tla.toUpperCase().includes(term) ||
        c.name.toUpperCase().includes(term) ||
        c.team_name.toUpperCase().includes(term)
    );
  }, [sortedConstructors, searchConstructor]);

  // Check if a driver is selected
  const isDriverSelected = (d: F1Player) =>
    selectedDrivers.some((s) => s.driver_number === d.driver_number);

  // Check if a constructor is selected
  const isConstructorSelected = (c: F1Player) =>
    selectedConstructors.some((s) => s.constructor_id === c.constructor_id);

  // Check if a driver should be disabled
  const isDriverDisabled = (d: F1Player) => {
    if (isDriverSelected(d)) return false;
    if (selectedDrivers.length >= MAX_DRIVERS) return true;
    // Max 2 from same constructor
    if ((teamDriverCounts[d.team_name] || 0) >= MAX_SAME_TEAM) return true;
    return false;
  };

  // Toggle driver selection
  const toggleDriver = (d: F1Player) => {
    setError(null);
    setSaved(false);
    if (isDriverSelected(d)) {
      setSelectedDrivers((prev) =>
        prev.filter((s) => s.driver_number !== d.driver_number)
      );
    } else {
      if (isDriverDisabled(d)) return;
      setSelectedDrivers((prev) => [...prev, d]);
    }
  };

  // Toggle constructor selection
  const toggleConstructor = (c: F1Player) => {
    setError(null);
    setSaved(false);
    if (isConstructorSelected(c)) {
      setSelectedConstructors((prev) =>
        prev.filter((s) => s.constructor_id !== c.constructor_id)
      );
    } else {
      if (selectedConstructors.length >= MAX_CONSTRUCTORS) return;
      setSelectedConstructors((prev) => [...prev, c]);
    }
  };

  // Save team
  const handleSave = async () => {
    if (!teamComplete) return;
    if (overBudget) {
      setError('Team exceeds $100M budget');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const driverNumbers = selectedDrivers
        .map((d) => d.driver_number)
        .filter((n): n is number => n !== undefined);
      const constructorIds = selectedConstructors
        .map((c) => c.constructor_id)
        .filter((id): id is string => id !== undefined);
      await saveTeam(driverNumbers, constructorIds, activeSlot);
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save team');
    } finally {
      setSaving(false);
    }
  };

  // Not logged in
  if (!user) {
    return (
      <div className="flex items-center justify-center h-64 text-f1-text-muted">
        <div className="text-center">
          <div className="text-lg font-[var(--font-display)] mb-2">
            Sign in to save your team
          </div>
          <Link to="/login" className="text-f1-cyan hover:underline text-sm">
            Log in
          </Link>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Enter Team"
          subtitle="Loading player data..."
        />
        <div className="flex items-center justify-center h-64">
          <div className="w-6 h-6 border-2 border-f1-red border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  // Error state
  if (fetchError) {
    return (
      <div className="space-y-6">
        <PageHeader title="Enter Team" />
        <div className="bg-f1-surface rounded-xl border border-f1-border p-6 text-center">
          <p className="text-f1-red text-sm mb-2">Failed to load player data</p>
          <p className="text-f1-text-muted text-xs">{fetchError}</p>
        </div>
      </div>
    );
  }

  const budgetPct = Math.min(100, (totalPrice / BUDGET_CAP) * 100);

  return (
    <div className="pb-32">
      {/* Header */}
      <PageHeader
        title="Enter Team"
        subtitle="Select 5 drivers and 2 constructors within the $100M budget to build your fantasy team."
      />

      {/* Team slot tabs + Save button */}
      <div className="flex items-center justify-between mb-6">
        <TeamSlotTabs activeSlot={activeSlot} onChange={setActiveSlot} />
        <button
          onClick={handleSave}
          disabled={!teamComplete || saving}
          className="px-5 py-2 rounded-lg text-sm font-bold bg-f1-red text-white hover:bg-f1-red/80 transition-colors disabled:opacity-40 disabled:cursor-not-allowed font-[var(--font-display)] uppercase tracking-wide"
        >
          {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Team'}
        </button>
      </div>

      {/* Error / success messages */}
      {error && (
        <div className="text-xs text-f1-red bg-f1-red/10 rounded-lg px-4 py-2.5 mb-4">
          {error}
        </div>
      )}
      {saved && (
        <div className="text-xs text-f1-green bg-f1-green/10 rounded-lg px-4 py-2.5 mb-4">
          Team saved to slot T{activeSlot}.{' '}
          <Link to="/fantasy/settings" className="underline">
            View in Settings
          </Link>
        </div>
      )}

      {/* Main two-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left column: Drivers (~60%) */}
        <div className="lg:col-span-3">
          <div className="bg-f1-surface rounded-xl border border-f1-border p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-f1-text font-[var(--font-display)] uppercase tracking-wide">
                Drivers
              </h2>
              <span className="font-timing text-xs text-f1-text-muted">
                {selectedDrivers.length}/{MAX_DRIVERS} selected
              </span>
            </div>

            <SearchBar
              placeholder="Find a driver... (e.g. VER+NOR)"
              value={searchDriver}
              onChange={setSearchDriver}
              className="mb-3"
            />

            <div className="space-y-1 max-h-[520px] overflow-y-auto pr-1">
              {filteredDrivers.map((d) => {
                const selected = isDriverSelected(d);
                const disabled = isDriverDisabled(d);
                return (
                  <button
                    key={d.driver_number}
                    type="button"
                    onClick={() => toggleDriver(d)}
                    disabled={disabled && !selected}
                    className={`
                      w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-left
                      ${selected
                        ? 'bg-f1-green/5 ring-2 ring-f1-green'
                        : disabled
                          ? 'opacity-40 cursor-not-allowed'
                          : 'hover:bg-f1-elevated/30 cursor-pointer'
                      }
                    `}
                  >
                    {/* Team color bar */}
                    <div
                      className="w-1 h-8 rounded-full flex-shrink-0"
                      style={{ backgroundColor: d.team_color }}
                    />

                    {/* Driver TLA pill */}
                    <div
                      className="min-w-[48px] h-[28px] rounded-md flex items-center justify-center text-xs font-bold text-white uppercase"
                      style={{ backgroundColor: `${d.team_color}CC` }}
                    >
                      {d.tla}
                    </div>

                    {/* Name + team */}
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-f1-text truncate">
                        {d.name}
                      </div>
                      <div className="text-[10px] text-f1-text-muted truncate">
                        {d.team_name}
                      </div>
                    </div>

                    {/* Price */}
                    <div className="flex-shrink-0 text-right">
                      <div className="font-timing text-xs text-f1-yellow">
                        ${d.price.toFixed(1)}M
                      </div>
                    </div>

                    {/* Projected points */}
                    <div className="flex-shrink-0 text-right w-12">
                      <div className="font-timing text-xs text-f1-cyan">
                        {d.projected_points} pts
                      </div>
                    </div>

                    {/* Selected % */}
                    <div className="flex-shrink-0 text-right w-10">
                      <div className="font-timing text-[10px] text-f1-text-muted">
                        {d.selected_pct.toFixed(0)}%
                      </div>
                    </div>

                    {/* Check mark */}
                    {selected && (
                      <span className="text-f1-green flex-shrink-0">
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </span>
                    )}
                  </button>
                );
              })}
              {filteredDrivers.length === 0 && (
                <p className="text-xs text-f1-text-muted text-center py-4">
                  No drivers match your search.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Right column: Constructors (~40%) */}
        <div className="lg:col-span-2">
          <div className="bg-f1-surface rounded-xl border border-f1-border p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-f1-text font-[var(--font-display)] uppercase tracking-wide">
                Constructors
              </h2>
              <span className="font-timing text-xs text-f1-text-muted">
                {selectedConstructors.length}/{MAX_CONSTRUCTORS} selected
              </span>
            </div>

            <SearchBar
              placeholder="Find a constructor..."
              value={searchConstructor}
              onChange={setSearchConstructor}
              className="mb-3"
            />

            <div className="space-y-1 max-h-[520px] overflow-y-auto pr-1">
              {filteredConstructors.map((c) => {
                const selected = isConstructorSelected(c);
                const disabled =
                  selectedConstructors.length >= MAX_CONSTRUCTORS && !selected;
                return (
                  <button
                    key={c.constructor_id}
                    type="button"
                    onClick={() => toggleConstructor(c)}
                    disabled={disabled && !selected}
                    className={`
                      w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-left
                      ${selected
                        ? 'bg-f1-green/5 ring-2 ring-f1-green'
                        : disabled
                          ? 'opacity-40 cursor-not-allowed'
                          : 'hover:bg-f1-elevated/30 cursor-pointer'
                      }
                    `}
                  >
                    {/* Team color bar */}
                    <div
                      className="w-1 h-8 rounded-full flex-shrink-0"
                      style={{ backgroundColor: c.team_color }}
                    />

                    {/* Constructor TLA pill */}
                    <div
                      className="min-w-[48px] h-[28px] rounded-md flex items-center justify-center text-xs font-bold text-white uppercase bg-f1-surface border-2"
                      style={{ borderColor: c.team_color }}
                    >
                      {c.tla}
                    </div>

                    {/* Name */}
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-f1-text truncate">
                        {c.name}
                      </div>
                    </div>

                    {/* Price */}
                    <div className="flex-shrink-0 text-right">
                      <div className="font-timing text-xs text-f1-yellow">
                        ${c.price.toFixed(1)}M
                      </div>
                    </div>

                    {/* Projected points */}
                    <div className="flex-shrink-0 text-right w-12">
                      <div className="font-timing text-xs text-f1-cyan">
                        {c.projected_points} pts
                      </div>
                    </div>

                    {/* Selected % */}
                    <div className="flex-shrink-0 text-right w-10">
                      <div className="font-timing text-[10px] text-f1-text-muted">
                        {c.selected_pct.toFixed(0)}%
                      </div>
                    </div>

                    {/* Check mark */}
                    {selected && (
                      <span className="text-f1-green flex-shrink-0">
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </span>
                    )}
                  </button>
                );
              })}
              {filteredConstructors.length === 0 && (
                <p className="text-xs text-f1-text-muted text-center py-4">
                  No constructors match your search.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom sticky bar: Budget tracker */}
      <div className="fixed bottom-0 left-0 right-0 bg-f1-surface border-t border-f1-border p-4 z-50">
        <div className="max-w-6xl mx-auto">
          {/* Selected pills row */}
          <div className="flex items-center gap-2 mb-3 flex-wrap min-h-[36px]">
            {selectedDrivers.map((d) => (
              <DriverPill
                key={d.driver_number}
                tla={d.tla}
                teamColor={d.team_color}
                selected
                onClick={() => toggleDriver(d)}
                size="sm"
              />
            ))}
            {/* Empty driver slots */}
            {Array.from({ length: MAX_DRIVERS - selectedDrivers.length }).map(
              (_, i) => (
                <div
                  key={`empty-d-${i}`}
                  className="min-w-[32px] h-[24px] rounded-md border border-dashed border-f1-border flex items-center justify-center"
                >
                  <span className="text-[10px] text-f1-text-muted">D</span>
                </div>
              )
            )}

            <div className="w-px h-6 bg-f1-border mx-1" />

            {selectedConstructors.map((c) => (
              <ConstructorPill
                key={c.constructor_id}
                tla={c.tla}
                teamColor={c.team_color}
                selected
                onClick={() => toggleConstructor(c)}
                size="sm"
              />
            ))}
            {/* Empty constructor slots */}
            {Array.from({
              length: MAX_CONSTRUCTORS - selectedConstructors.length,
            }).map((_, i) => (
              <div
                key={`empty-c-${i}`}
                className="min-w-[32px] h-[24px] rounded-md border border-dashed border-f1-border flex items-center justify-center"
              >
                <span className="text-[10px] text-f1-text-muted">C</span>
              </div>
            ))}
          </div>

          {/* Budget bar row */}
          <div className="flex items-center gap-4">
            {/* Progress bar */}
            <div className="flex-1">
              <div className="h-2 rounded-full bg-f1-elevated overflow-hidden">
                <div
                  className={`h-2 rounded-full transition-all ${
                    overBudget ? 'bg-f1-red' : 'bg-f1-green'
                  }`}
                  style={{ width: `${budgetPct}%` }}
                />
              </div>
            </div>

            {/* Budget numbers */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <span className="font-timing text-sm text-f1-text">
                ${totalPrice.toFixed(1)} / ${BUDGET_CAP.toFixed(1)}M
              </span>
              <span
                className={`font-timing text-sm font-bold ${
                  overBudget ? 'text-f1-red' : 'text-f1-green'
                }`}
              >
                ${budgetRemaining.toFixed(1)}M remaining
              </span>
            </div>

            {/* Save button */}
            <button
              onClick={handleSave}
              disabled={!teamComplete || saving}
              className="px-5 py-2 rounded-lg text-sm font-bold bg-f1-red text-white hover:bg-f1-red/80 transition-colors disabled:opacity-40 disabled:cursor-not-allowed font-[var(--font-display)] uppercase tracking-wide flex-shrink-0"
            >
              {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Team'}
            </button>
          </div>

          {/* Status text */}
          {!teamComplete && (
            <div className="mt-2 text-[10px] text-f1-text-muted text-center">
              {selectedDrivers.length < MAX_DRIVERS && (
                <span>
                  Select {MAX_DRIVERS - selectedDrivers.length} more driver
                  {MAX_DRIVERS - selectedDrivers.length !== 1 ? 's' : ''}
                </span>
              )}
              {selectedDrivers.length < MAX_DRIVERS &&
                selectedConstructors.length < MAX_CONSTRUCTORS && (
                  <span> and </span>
                )}
              {selectedConstructors.length < MAX_CONSTRUCTORS && (
                <span>
                  {MAX_CONSTRUCTORS - selectedConstructors.length} more
                  constructor
                  {MAX_CONSTRUCTORS - selectedConstructors.length !== 1
                    ? 's'
                    : ''}
                </span>
              )}
              {overBudget && (
                <span className="text-f1-red ml-2">
                  -- Over budget by ${Math.abs(budgetRemaining).toFixed(1)}M
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
