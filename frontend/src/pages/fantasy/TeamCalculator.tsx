import { useState, useEffect, useCallback, useMemo } from 'react';
import { LoadingTelemetry } from '../../components/common/LoadingTelemetry';
import { useSort, type SortConfig } from '../../hooks/useSort';
import { useAuth } from '../../contexts/AuthContext';
import { useFantasy, useF1Players, type SavedTeam } from '../../hooks/useFantasy';
import { DriverPill } from '../../components/fantasy/DriverPill';
import { ConstructorPill } from '../../components/fantasy/ConstructorPill';
import { SearchBar } from '../../components/fantasy/SearchBar';
import { ChipButtons } from '../../components/fantasy/ChipButtons';
import { getTeamColor } from '../../utils/teamColors';
import type { F1Player } from '../../types/f1';

/* ── Sim data types ────────────────────────────────────────── */

interface SimDriver {
  driver_number: number;
  name_acronym: string;
  full_name: string;
  team_name: string;
  mean_points: number;
  median_points: number;
  p10: number;
  p90: number;
  std_dev: number;
  price: number;
  value: number;
}

interface SimConstructor {
  constructor_id: string;
  name: string;
  full_name: string;
  color: string;
  engine: string;
  drivers: number[];
  mean_points: number;
  p10: number;
  p90: number;
  std_dev: number;
  price: number;
  value: number;
}

interface OptimizeResult {
  drivers: number[];
  constructors: string[];
  total_price: number;
  expected_points: number;
  budget_remaining: number;
}

/** Normalise the /optimize/mc response into our OptimizeResult shape */
function parseOptimizeResponse(raw: Record<string, unknown>): OptimizeResult {
  // drivers may be numbers or objects with driver_number
  const rawDrivers = (raw.drivers ?? []) as Array<number | Record<string, unknown>>;
  const drivers = rawDrivers.map(d =>
    typeof d === 'number' ? d : (d as Record<string, unknown>).driver_number as number,
  );

  // constructors may be strings or objects with constructor_id
  const rawConstructors = (raw.constructors ?? []) as Array<string | Record<string, unknown>>;
  const constructors = rawConstructors.map(c =>
    typeof c === 'string' ? c : (c as Record<string, unknown>).constructor_id as string,
  );

  return {
    drivers,
    constructors,
    total_price: (raw.total_price as number) ?? 0,
    expected_points: (raw.expected_points as number) ?? (raw.total_expected as number) ?? 0,
    budget_remaining: (raw.budget_remaining as number) ?? 0,
  };
}

/* ── Sort header helper ────────────────────────────────────── */

function SortHeader<K extends string>({
  label,
  sortKey,
  config,
  onSort,
  align = 'left',
}: {
  label: string;
  sortKey: K;
  config: SortConfig<K>;
  onSort: (key: K) => void;
  align?: 'left' | 'right';
}) {
  const active = config.key === sortKey;
  const arrow = active ? (config.direction === 'asc' ? ' \u25B2' : ' \u25BC') : '';
  return (
    <th
      className={`${align === 'right' ? 'text-right' : 'text-left'} px-2 py-1.5 cursor-pointer select-none hover:text-f1-text transition-colors text-[10px] uppercase font-semibold ${active ? 'text-f1-text' : 'text-f1-text-muted'}`}
      onClick={() => onSort(sortKey)}
    >
      {label}{arrow}
    </th>
  );
}

/* ── Include / Exclude checkbox ────────────────────────────── */

function InclExclCheckbox({
  included,
  excluded,
  onToggleInclude,
  onToggleExclude,
}: {
  included: boolean;
  excluded: boolean;
  onToggleInclude: () => void;
  onToggleExclude: () => void;
}) {
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={onToggleInclude}
        className={`w-4 h-4 rounded border text-[10px] flex items-center justify-center transition-colors font-bold leading-none ${
          included
            ? 'bg-f1-green/20 border-f1-green text-f1-green'
            : 'border-f1-border text-transparent hover:border-f1-text-muted'
        }`}
      >
        {'\u2713'}
      </button>
      <button
        type="button"
        onClick={onToggleExclude}
        className={`w-4 h-4 rounded border text-[10px] flex items-center justify-center transition-colors font-bold leading-none ${
          excluded
            ? 'bg-f1-red/20 border-f1-red text-f1-red'
            : 'border-f1-border text-transparent hover:border-f1-text-muted'
        }`}
      >
        {'\u2715'}
      </button>
    </div>
  );
}

/* ── Price change display ─────────────────────────────────── */

function PriceChangeCell({ value }: { value: number }) {
  if (value === 0) return <span className="font-timing text-[11px] text-f1-text-muted">0.0</span>;
  return (
    <span className={`font-timing text-[11px] ${value > 0 ? 'text-f1-green' : 'text-f1-red'}`}>
      {value > 0 ? '+' : ''}{value.toFixed(1)}
    </span>
  );
}

/* ── Merge sim + real API player data ─────────────────────── */

interface MergedDriver {
  driver_number: number;
  tla: string;
  full_name: string;
  team_name: string;
  team_color: string;
  price: number;
  price_change: number;
  mean_points: number;
  value: number;
}

interface MergedConstructor {
  constructor_id: string;
  tla: string;
  full_name: string;
  team_color: string;
  price: number;
  price_change: number;
  mean_points: number;
  value: number;
}

function mergeDrivers(simDrivers: SimDriver[], apiDrivers: F1Player[]): MergedDriver[] {
  return simDrivers.map(sd => {
    const api = apiDrivers.find(a => a.driver_number === sd.driver_number);
    return {
      driver_number: sd.driver_number,
      tla: api?.tla ?? sd.name_acronym,
      full_name: api?.name ?? sd.full_name,
      team_name: api?.team_name ?? sd.team_name,
      team_color: api?.team_color ? (api.team_color.startsWith('#') ? api.team_color : `#${api.team_color}`) : getTeamColor(sd.team_name),
      price: api?.price ?? sd.price,
      price_change: api?.price_change ?? 0,
      mean_points: sd.mean_points,
      value: sd.value,
    };
  });
}

function mergeConstructors(simConstructors: SimConstructor[], apiConstructors: F1Player[]): MergedConstructor[] {
  return simConstructors.map(sc => {
    const api = apiConstructors.find(a => a.constructor_id === sc.constructor_id || a.tla === sc.name);
    return {
      constructor_id: sc.constructor_id,
      tla: api?.tla ?? sc.name,
      full_name: api?.name ?? sc.full_name,
      team_color: api?.team_color ? (api.team_color.startsWith('#') ? api.team_color : `#${api.team_color}`) : sc.color || getTeamColor(sc.name),
      price: api?.price ?? sc.price,
      price_change: api?.price_change ?? 0,
      mean_points: sc.mean_points,
      value: sc.value,
    };
  });
}

/* ── Main component ───────────────────────────────────────── */

type DriverSortKey = 'tla' | 'price' | 'price_change' | 'mean_points';
type ConstructorSortKey = 'tla' | 'price' | 'price_change' | 'mean_points';

export function TeamCalculator() {
  const { token } = useAuth();
  const { savedTeams } = useFantasy();
  const { drivers: apiDrivers, constructors: apiConstructors } = useF1Players();

  /* ── Data state ─────────────────────────────────────────── */
  const [simDrivers, setSimDrivers] = useState<SimDriver[]>([]);
  const [simConstructors, setSimConstructors] = useState<SimConstructor[]>([]);
  const [optimizedTeam, setOptimizedTeam] = useState<OptimizeResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [optimizing, setOptimizing] = useState(false);

  /* ── Settings state ─────────────────────────────────────── */
  const [budget, setBudget] = useState(100);
  const [activeChip, setActiveChip] = useState<string | null>(null);
  const [startingTeam, setStartingTeam] = useState<string>('none');
  const [convertPriceChanges, setConvertPriceChanges] = useState(false);
  const [simulationPreset, setSimulationPreset] = useState('default');
  const [notes, setNotes] = useState('');

  /* ── Include/Exclude state ─────────────────────────────── */
  const [includedDrivers, setIncludedDrivers] = useState<Set<number>>(new Set());
  const [excludedDrivers, setExcludedDrivers] = useState<Set<number>>(new Set());
  const [includedConstructors, setIncludedConstructors] = useState<Set<string>>(new Set());
  const [excludedConstructors, setExcludedConstructors] = useState<Set<string>>(new Set());

  /* ── Search state ───────────────────────────────────────── */
  const [driverSearch, setDriverSearch] = useState('');

  /* ── Fetch sim data ─────────────────────────────────────── */
  useEffect(() => {
    fetch('/api/fantasy/simulate')
      .then(r => r.json())
      .then(data => {
        setSimDrivers(data.drivers ?? []);
        setSimConstructors(data.constructors ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  /* ── Merged data ────────────────────────────────────────── */
  const mergedDrivers = useMemo(
    () => mergeDrivers(simDrivers, apiDrivers),
    [simDrivers, apiDrivers],
  );
  const mergedConstructors = useMemo(
    () => mergeConstructors(simConstructors, apiConstructors),
    [simConstructors, apiConstructors],
  );

  /* ── Sort ────────────────────────────────────────────────── */
  const driverSort = useSort<MergedDriver, DriverSortKey>(mergedDrivers, 'mean_points');
  const constructorSort = useSort<MergedConstructor, ConstructorSortKey>(mergedConstructors, 'mean_points');

  /* ── Filtered drivers (search) ──────────────────────────── */
  const filteredDrivers = useMemo(() => {
    if (!driverSearch) return driverSort.sorted;
    const q = driverSearch.toLowerCase();
    return driverSort.sorted.filter(
      d => d.tla.toLowerCase().includes(q) || d.full_name.toLowerCase().includes(q) || d.team_name.toLowerCase().includes(q),
    );
  }, [driverSort.sorted, driverSearch]);

  const filteredConstructors = useMemo(() => {
    if (!driverSearch) return constructorSort.sorted;
    const q = driverSearch.toLowerCase();
    return constructorSort.sorted.filter(
      c => c.tla.toLowerCase().includes(q) || c.full_name.toLowerCase().includes(q),
    );
  }, [constructorSort.sorted, driverSearch]);

  /* ── Toggle include / exclude ───────────────────────────── */
  const toggleIncludeDriver = (num: number) => {
    setIncludedDrivers(prev => {
      const next = new Set(prev);
      if (next.has(num)) next.delete(num);
      else next.add(num);
      return next;
    });
    setExcludedDrivers(prev => {
      const next = new Set(prev);
      next.delete(num);
      return next;
    });
  };

  const toggleExcludeDriver = (num: number) => {
    setExcludedDrivers(prev => {
      const next = new Set(prev);
      if (next.has(num)) next.delete(num);
      else next.add(num);
      return next;
    });
    setIncludedDrivers(prev => {
      const next = new Set(prev);
      next.delete(num);
      return next;
    });
  };

  const toggleIncludeConstructor = (id: string) => {
    setIncludedConstructors(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setExcludedConstructors(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const toggleExcludeConstructor = (id: string) => {
    setExcludedConstructors(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setIncludedConstructors(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  /* ── Optimize ───────────────────────────────────────────── */
  const handleOptimize = useCallback(async () => {
    setOptimizing(true);
    try {
      const res = await fetch('/api/fantasy/optimize/mc?mode=value');
      if (!res.ok) return;
      const raw = await res.json();
      setOptimizedTeam(parseOptimizeResponse(raw));
    } catch { /* ignore */ }
    finally { setOptimizing(false); }
  }, []);

  /* ── Auto-optimize on mount when sim data arrives ───────── */
  useEffect(() => {
    if (simDrivers.length > 0 && !optimizedTeam) {
      handleOptimize();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [simDrivers]);

  /* ── Full reset ─────────────────────────────────────────── */
  const handleFullReset = () => {
    setBudget(100);
    setActiveChip(null);
    setStartingTeam('none');
    setConvertPriceChanges(false);
    setSimulationPreset('default');
    setNotes('');
    setIncludedDrivers(new Set());
    setExcludedDrivers(new Set());
    setIncludedConstructors(new Set());
    setExcludedConstructors(new Set());
    setDriverSearch('');
  };

  /* ── Resolve optimized team members for display ─────────── */
  const optimizedDrivers = useMemo(() => {
    if (!optimizedTeam) return [];
    return optimizedTeam.drivers
      .map(num => mergedDrivers.find(d => d.driver_number === num))
      .filter((d): d is MergedDriver => d !== undefined);
  }, [optimizedTeam, mergedDrivers]);

  const optimizedConstructorsList = useMemo(() => {
    if (!optimizedTeam) return [];
    return optimizedTeam.constructors
      .map(id => mergedConstructors.find(c => c.constructor_id === id))
      .filter((c): c is MergedConstructor => c !== undefined);
  }, [optimizedTeam, mergedConstructors]);

  /* ── Saved team names for dropdown ──────────────────────── */
  const savedTeamOptions = useMemo(() => {
    return savedTeams.map((t: SavedTeam) => ({
      value: String(t.team_number),
      label: t.name ?? `Team ${t.team_number}`,
    }));
  }, [savedTeams]);

  if (loading) return <LoadingTelemetry />;

  return (
    <div className="flex gap-4 h-[calc(100vh-8rem)] min-h-0">
      {/* ────────────────────────────────────────────────────────
          LEFT COLUMN — Best Teams
         ──────────────────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 bg-f1-surface rounded-xl border border-f1-border flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-f1-border shrink-0">
          <h2 className="text-sm font-bold text-f1-text font-[var(--font-display)] uppercase tracking-wider">
            Best Teams
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handleOptimize}
              disabled={optimizing}
              className="px-3 py-1 rounded text-[10px] font-bold bg-f1-cyan/10 text-f1-cyan hover:bg-f1-cyan/20 transition-colors disabled:opacity-50"
            >
              {optimizing ? 'Calculating...' : 'Recalculate'}
            </button>
          </div>
        </div>

        {/* Column headers */}
        <div className="px-4 py-1.5 border-b border-f1-border/50 shrink-0">
          <div className="grid grid-cols-[2rem_1fr_1fr_5rem_5rem_5rem] gap-1 text-[10px] text-f1-text-muted uppercase font-semibold">
            <span>#</span>
            <span>CR</span>
            <span>DR</span>
            <span className="text-right">$</span>
            <span className="text-right">xDelta$</span>
            <span className="text-right">xPts</span>
          </div>
        </div>

        {/* Teams list */}
        <div className="flex-1 overflow-y-auto overflow-x-auto">
          {optimizedTeam ? (
            <div className="divide-y divide-f1-border/30">
              {/* Team #1 — the optimized team */}
              <div className="px-4 py-2.5 hover:bg-f1-elevated/20 transition-colors">
                <div className="grid grid-cols-[2rem_1fr_1fr_5rem_5rem_5rem] gap-1 items-start">
                  {/* Rank */}
                  <span className="font-timing text-sm text-f1-text font-bold">1</span>

                  {/* Constructors */}
                  <div className="flex gap-1.5 flex-wrap">
                    {optimizedConstructorsList.map(c => (
                      <ConstructorPill
                        key={c.constructor_id}
                        tla={c.tla}
                        teamColor={c.team_color}
                        price={c.price}
                        priceChange={c.price_change}
                        size="sm"
                      />
                    ))}
                  </div>

                  {/* Drivers */}
                  <div className="flex gap-1 flex-wrap">
                    {optimizedDrivers.map(d => (
                      <DriverPill
                        key={d.driver_number}
                        tla={d.tla}
                        teamColor={d.team_color}
                        price={d.price}
                        priceChange={d.price_change}
                        size="sm"
                      />
                    ))}
                  </div>

                  {/* Totals */}
                  <span className="text-right font-timing text-xs text-f1-yellow font-bold">
                    ${optimizedTeam.total_price.toFixed(1)}M
                  </span>
                  <span className="text-right font-timing text-xs text-f1-text-muted">
                    {optimizedDrivers.reduce((s, d) => s + d.price_change, 0).toFixed(1)}
                  </span>
                  <span className="text-right font-timing text-xs text-white font-bold">
                    {optimizedTeam.expected_points.toFixed(1)}
                  </span>
                </div>
              </div>

              {/* Teams #2-10 — variations (swap 1 driver at a time with next-best) */}
              {generateVariations(optimizedTeam, mergedDrivers, mergedConstructors, excludedDrivers, excludedConstructors, budget).map((variation, i) => {
                const vDrivers = variation.drivers
                  .map(num => mergedDrivers.find(d => d.driver_number === num))
                  .filter((d): d is MergedDriver => d !== undefined);
                const vConstructors = variation.constructors
                  .map(id => mergedConstructors.find(c => c.constructor_id === id))
                  .filter((c): c is MergedConstructor => c !== undefined);
                const totalPrice = vDrivers.reduce((s, d) => s + d.price, 0) + vConstructors.reduce((s, c) => s + c.price, 0);
                const totalPts = vDrivers.reduce((s, d) => s + d.mean_points, 0) + vConstructors.reduce((s, c) => s + c.mean_points, 0);
                const totalDelta = vDrivers.reduce((s, d) => s + d.price_change, 0) + vConstructors.reduce((s, c) => s + c.price_change, 0);

                return (
                  <div key={i} className="px-4 py-2.5 hover:bg-f1-elevated/20 transition-colors">
                    <div className="grid grid-cols-[2rem_1fr_1fr_5rem_5rem_5rem] gap-1 items-start">
                      <span className="font-timing text-sm text-f1-text-muted">{i + 2}</span>
                      <div className="flex gap-1.5 flex-wrap">
                        {vConstructors.map(c => (
                          <ConstructorPill
                            key={c.constructor_id}
                            tla={c.tla}
                            teamColor={c.team_color}
                            price={c.price}
                            priceChange={c.price_change}
                            size="sm"
                          />
                        ))}
                      </div>
                      <div className="flex gap-1 flex-wrap">
                        {vDrivers.map(d => (
                          <DriverPill
                            key={d.driver_number}
                            tla={d.tla}
                            teamColor={d.team_color}
                            price={d.price}
                            priceChange={d.price_change}
                            size="sm"
                          />
                        ))}
                      </div>
                      <span className="text-right font-timing text-xs text-f1-yellow">
                        ${totalPrice.toFixed(1)}M
                      </span>
                      <span className="text-right font-timing text-xs text-f1-text-muted">
                        {totalDelta.toFixed(1)}
                      </span>
                      <span className="text-right font-timing text-xs text-white">
                        {totalPts.toFixed(1)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-f1-text-muted text-sm">
              {optimizing ? 'Calculating best teams...' : 'No optimization data yet'}
            </div>
          )}
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────
          CENTER COLUMN — Settings
         ──────────────────────────────────────────────────────── */}
      <div className="w-80 shrink-0 bg-f1-surface rounded-xl border border-f1-border p-4 overflow-y-auto space-y-5">
        <h2 className="text-sm font-bold text-f1-text font-[var(--font-display)] uppercase tracking-wider">
          Settings
        </h2>

        {/* Starting team dropdown */}
        <div className="space-y-1.5">
          <label className="text-[10px] uppercase text-f1-text-muted font-semibold tracking-wider">
            Select a starting team
          </label>
          <select
            value={startingTeam}
            onChange={e => setStartingTeam(e.target.value)}
            className="w-full bg-f1-elevated border border-f1-border rounded-lg px-3 py-2 text-sm text-f1-text focus:ring-1 focus:ring-f1-red focus:border-f1-red outline-none"
          >
            <option value="none">No team selected</option>
            {savedTeamOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* OR divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-f1-border" />
          <span className="text-[10px] text-f1-text-muted font-bold">OR</span>
          <div className="flex-1 h-px bg-f1-border" />
        </div>

        {/* Maximum budget */}
        <div className="space-y-1.5">
          <label className="text-[10px] uppercase text-f1-text-muted font-semibold tracking-wider">
            Maximum budget
          </label>
          <div className="flex items-center bg-f1-elevated border border-f1-border rounded-lg overflow-hidden">
            <span className="px-2 text-sm text-f1-text-muted">$</span>
            <input
              type="number"
              value={budget}
              onChange={e => setBudget(Number(e.target.value) || 0)}
              className="flex-1 bg-transparent px-1 py-2 text-sm text-f1-text font-timing outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <span className="px-2 text-sm text-f1-text-muted">M</span>
          </div>
        </div>

        {/* Select a chip */}
        <div className="space-y-1.5">
          <label className="text-[10px] uppercase text-f1-text-muted font-semibold tracking-wider">
            Select a chip
          </label>
          <ChipButtons
            chips={['X3', 'LL', 'WC', 'NN']}
            activeChip={activeChip}
            onSelect={setActiveChip}
          />
        </div>

        {/* Price change toggle */}
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={() => setConvertPriceChanges(!convertPriceChanges)}
            className={`mt-0.5 w-9 h-5 rounded-full transition-colors shrink-0 relative ${
              convertPriceChanges ? 'bg-f1-green' : 'bg-f1-border'
            }`}
          >
            <span
              className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                convertPriceChanges ? 'left-[1.125rem]' : 'left-0.5'
              }`}
            />
          </button>
          <span className="text-xs text-f1-text-muted leading-tight">
            Convert expected price changes into expected price change points
          </span>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleFullReset}
            className="flex-1 px-3 py-2 rounded-lg text-xs font-bold bg-f1-elevated text-f1-text-muted hover:text-f1-text border border-f1-border transition-colors"
          >
            Full Reset
          </button>
          <button
            onClick={handleOptimize}
            disabled={optimizing}
            className="flex-1 px-3 py-2 rounded-lg text-xs font-bold bg-f1-red text-white hover:bg-f1-red/80 transition-colors disabled:opacity-50"
          >
            {optimizing ? 'Running...' : 'Optimize'}
          </button>
        </div>

        {/* Simulation section */}
        <div className="pt-2 border-t border-f1-border space-y-3">
          <h3 className="text-xs font-bold text-f1-text font-[var(--font-display)] uppercase tracking-wider">
            Simulation
          </h3>
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase text-f1-text-muted font-semibold tracking-wider">
              Select a simulation preset
            </label>
            <select
              value={simulationPreset}
              onChange={e => setSimulationPreset(e.target.value)}
              className="w-full bg-f1-elevated border border-f1-border rounded-lg px-3 py-2 text-sm text-f1-text focus:ring-1 focus:ring-f1-red focus:border-f1-red outline-none"
            >
              <option value="default">Default (10k sims)</option>
              <option value="quick">Quick (1k sims)</option>
              <option value="detailed">Detailed (50k sims)</option>
            </select>
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-1.5">
          <label className="text-[10px] uppercase text-f1-text-muted font-semibold tracking-wider">
            Notes
          </label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Add notes..."
            rows={3}
            className="w-full bg-f1-elevated border border-f1-border rounded-lg px-3 py-2 text-sm text-f1-text placeholder:text-f1-text-muted/50 outline-none focus:ring-1 focus:ring-f1-red focus:border-f1-red resize-none"
          />
        </div>

        {/* Budget summary when logged in */}
        {token && startingTeam !== 'none' && (
          <div className="p-3 rounded-lg bg-f1-elevated/50 border border-f1-border/50 space-y-1">
            <span className="text-[10px] uppercase text-f1-text-muted font-semibold">Loaded Team</span>
            <p className="text-xs text-f1-text">
              {savedTeamOptions.find(o => o.value === startingTeam)?.label ?? 'Unknown'}
            </p>
          </div>
        )}
      </div>

      {/* ────────────────────────────────────────────────────────
          RIGHT COLUMN — Drivers + Constructors
         ──────────────────────────────────────────────────────── */}
      <div className="w-[350px] shrink-0 space-y-4 flex flex-col min-h-0">

        {/* ─── Drivers section ─────────────────────────────── */}
        <div className="flex-1 min-h-0 bg-f1-surface rounded-xl border border-f1-border flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-2 px-3 py-2.5 border-b border-f1-border shrink-0">
            <h2 className="text-sm font-bold text-f1-text font-[var(--font-display)] uppercase tracking-wider">
              Drivers
            </h2>
            <div className="flex-1">
              <SearchBar
                placeholder="Filter drivers..."
                value={driverSearch}
                onChange={setDriverSearch}
                className="!py-1 !text-xs !rounded-md"
              />
            </div>
          </div>

          {/* Table */}
          <div className="flex-1 overflow-y-auto overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className="sticky top-0 z-10 bg-f1-surface">
                <tr className="border-b border-f1-border">
                  <SortHeader label="DR" sortKey="tla" config={driverSort.sortConfig} onSort={driverSort.toggleSort} />
                  <SortHeader label="$" sortKey="price" config={driverSort.sortConfig} onSort={driverSort.toggleSort} align="right" />
                  <SortHeader label="xDelta$" sortKey="price_change" config={driverSort.sortConfig} onSort={driverSort.toggleSort} align="right" />
                  <SortHeader label="xPts" sortKey="mean_points" config={driverSort.sortConfig} onSort={driverSort.toggleSort} align="right" />
                  <th className="px-2 py-1.5 text-[10px] text-f1-text-muted uppercase font-semibold text-center w-16">
                    Incl/Excl
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-f1-border/30">
                {filteredDrivers.map(d => (
                  <tr
                    key={d.driver_number}
                    className={`transition-colors ${
                      includedDrivers.has(d.driver_number)
                        ? 'bg-f1-green/5'
                        : excludedDrivers.has(d.driver_number)
                          ? 'bg-f1-red/5 opacity-50'
                          : 'hover:bg-f1-elevated/30'
                    }`}
                  >
                    <td className="px-2 py-1.5">
                      <DriverPill
                        tla={d.tla}
                        teamColor={d.team_color}
                        size="sm"
                      />
                    </td>
                    <td className="px-2 py-1.5 text-right">
                      <span className="font-timing text-[11px] text-f1-yellow">${d.price.toFixed(1)}M</span>
                    </td>
                    <td className="px-2 py-1.5 text-right">
                      <PriceChangeCell value={d.price_change} />
                    </td>
                    <td className="px-2 py-1.5 text-right">
                      <span className="font-timing text-[11px] text-white font-bold">{d.mean_points.toFixed(1)}</span>
                    </td>
                    <td className="px-2 py-1.5">
                      <div className="flex justify-center">
                        <InclExclCheckbox
                          included={includedDrivers.has(d.driver_number)}
                          excluded={excludedDrivers.has(d.driver_number)}
                          onToggleInclude={() => toggleIncludeDriver(d.driver_number)}
                          onToggleExclude={() => toggleExcludeDriver(d.driver_number)}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredDrivers.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center text-f1-text-muted text-xs py-6">
                      No drivers found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ─── Constructors section ────────────────────────── */}
        <div className="shrink-0 bg-f1-surface rounded-xl border border-f1-border flex flex-col overflow-hidden" style={{ maxHeight: '40%' }}>
          {/* Header */}
          <div className="flex items-center gap-2 px-3 py-2.5 border-b border-f1-border shrink-0">
            <h2 className="text-sm font-bold text-f1-text font-[var(--font-display)] uppercase tracking-wider">
              Constructors
            </h2>
          </div>

          {/* Table */}
          <div className="flex-1 overflow-y-auto overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className="sticky top-0 z-10 bg-f1-surface">
                <tr className="border-b border-f1-border">
                  <SortHeader label="CR" sortKey="tla" config={constructorSort.sortConfig} onSort={constructorSort.toggleSort} />
                  <SortHeader label="$" sortKey="price" config={constructorSort.sortConfig} onSort={constructorSort.toggleSort} align="right" />
                  <SortHeader label="xDelta$" sortKey="price_change" config={constructorSort.sortConfig} onSort={constructorSort.toggleSort} align="right" />
                  <SortHeader label="xPts" sortKey="mean_points" config={constructorSort.sortConfig} onSort={constructorSort.toggleSort} align="right" />
                  <th className="px-2 py-1.5 text-[10px] text-f1-text-muted uppercase font-semibold text-center w-16">
                    Incl/Excl
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-f1-border/30">
                {filteredConstructors.map(c => (
                  <tr
                    key={c.constructor_id}
                    className={`transition-colors ${
                      includedConstructors.has(c.constructor_id)
                        ? 'bg-f1-green/5'
                        : excludedConstructors.has(c.constructor_id)
                          ? 'bg-f1-red/5 opacity-50'
                          : 'hover:bg-f1-elevated/30'
                    }`}
                  >
                    <td className="px-2 py-1.5">
                      <ConstructorPill
                        tla={c.tla}
                        teamColor={c.team_color}
                        size="sm"
                      />
                    </td>
                    <td className="px-2 py-1.5 text-right">
                      <span className="font-timing text-[11px] text-f1-yellow">${c.price.toFixed(1)}M</span>
                    </td>
                    <td className="px-2 py-1.5 text-right">
                      <PriceChangeCell value={c.price_change} />
                    </td>
                    <td className="px-2 py-1.5 text-right">
                      <span className="font-timing text-[11px] text-white font-bold">{c.mean_points.toFixed(1)}</span>
                    </td>
                    <td className="px-2 py-1.5">
                      <div className="flex justify-center">
                        <InclExclCheckbox
                          included={includedConstructors.has(c.constructor_id)}
                          excluded={excludedConstructors.has(c.constructor_id)}
                          onToggleInclude={() => toggleIncludeConstructor(c.constructor_id)}
                          onToggleExclude={() => toggleExcludeConstructor(c.constructor_id)}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Generate team variations by swapping 1 driver at a time ── */

function generateVariations(
  base: OptimizeResult,
  allDrivers: MergedDriver[],
  allConstructors: MergedConstructor[],
  excludedDrivers: Set<number>,
  excludedConstructors: Set<string>,
  budget: number,
): Array<{ drivers: number[]; constructors: string[] }> {
  const variations: Array<{ drivers: number[]; constructors: string[] }> = [];
  const seen = new Set<string>();
  seen.add([...base.drivers].sort().join(',') + '|' + [...base.constructors].sort().join(','));

  // Sort non-team drivers by expected points desc
  const otherDrivers = allDrivers
    .filter(d => !base.drivers.includes(d.driver_number) && !excludedDrivers.has(d.driver_number))
    .sort((a, b) => b.mean_points - a.mean_points);

  // Swap each base driver with best available replacement
  for (let i = 0; i < base.drivers.length && variations.length < 9; i++) {
    for (const replacement of otherDrivers) {
      const newDrivers = [...base.drivers];
      newDrivers[i] = replacement.driver_number;

      const key = [...newDrivers].sort().join(',') + '|' + [...base.constructors].sort().join(',');
      if (seen.has(key)) continue;

      // Check budget
      const driverCost = newDrivers.reduce((s, num) => {
        const d = allDrivers.find(d => d.driver_number === num);
        return s + (d?.price ?? 0);
      }, 0);
      const constructorCost = base.constructors.reduce((s, id) => {
        const c = allConstructors.find(c => c.constructor_id === id);
        return s + (c?.price ?? 0);
      }, 0);

      if (driverCost + constructorCost <= budget) {
        seen.add(key);
        variations.push({ drivers: newDrivers, constructors: [...base.constructors] });
        break; // One swap per position
      }
    }
  }

  // Also try swapping constructors
  const otherConstructors = allConstructors
    .filter(c => !base.constructors.includes(c.constructor_id) && !excludedConstructors.has(c.constructor_id))
    .sort((a, b) => b.mean_points - a.mean_points);

  for (let i = 0; i < base.constructors.length && variations.length < 9; i++) {
    for (const replacement of otherConstructors) {
      const newConstructors = [...base.constructors];
      newConstructors[i] = replacement.constructor_id;

      const key = [...base.drivers].sort().join(',') + '|' + [...newConstructors].sort().join(',');
      if (seen.has(key)) continue;

      const driverCost = base.drivers.reduce((s, num) => {
        const d = allDrivers.find(d => d.driver_number === num);
        return s + (d?.price ?? 0);
      }, 0);
      const constructorCost = newConstructors.reduce((s, id) => {
        const c = allConstructors.find(c => c.constructor_id === id);
        return s + (c?.price ?? 0);
      }, 0);

      if (driverCost + constructorCost <= budget) {
        seen.add(key);
        variations.push({ drivers: [...base.drivers], constructors: newConstructors });
        break;
      }
    }
  }

  // Sort variations by total expected points desc
  variations.sort((a, b) => {
    const ptsA = a.drivers.reduce((s, n) => s + (allDrivers.find(d => d.driver_number === n)?.mean_points ?? 0), 0)
               + a.constructors.reduce((s, id) => s + (allConstructors.find(c => c.constructor_id === id)?.mean_points ?? 0), 0);
    const ptsB = b.drivers.reduce((s, n) => s + (allDrivers.find(d => d.driver_number === n)?.mean_points ?? 0), 0)
               + b.constructors.reduce((s, id) => s + (allConstructors.find(c => c.constructor_id === id)?.mean_points ?? 0), 0);
    return ptsB - ptsA;
  });

  return variations.slice(0, 9);
}
