import { useState, useEffect, useMemo } from 'react';
import { LoadingTelemetry } from '../../components/common/LoadingTelemetry';
import { useFantasy, useF1Players, type SavedTeam } from '../../hooks/useFantasy';
import { useSort, type SortConfig } from '../../hooks/useSort';
import { DriverPill } from '../../components/fantasy/DriverPill';
import { ConstructorPill } from '../../components/fantasy/ConstructorPill';
import { SearchBar } from '../../components/fantasy/SearchBar';
import { ChipButtons } from '../../components/fantasy/ChipButtons';
import type { F1Player } from '../../types/f1';

/* ------------------------------------------------------------------ */
/* Round data                                                         */
/* ------------------------------------------------------------------ */

interface RoundInfo {
  round: number;
  name: string;
  flag: string;
}

const ROUNDS_2025: RoundInfo[] = [
  { round: 1, name: 'Australia', flag: '\u{1F1E6}\u{1F1FA}' },
  { round: 2, name: 'China', flag: '\u{1F1E8}\u{1F1F3}' },
  { round: 3, name: 'Japan', flag: '\u{1F1EF}\u{1F1F5}' },
  { round: 4, name: 'Bahrain', flag: '\u{1F1E7}\u{1F1ED}' },
  { round: 5, name: 'Saudi Arabia', flag: '\u{1F1F8}\u{1F1E6}' },
  { round: 6, name: 'Miami', flag: '\u{1F1FA}\u{1F1F8}' },
  { round: 7, name: 'Emilia Romagna', flag: '\u{1F1EE}\u{1F1F9}' },
  { round: 8, name: 'Monaco', flag: '\u{1F1F2}\u{1F1E8}' },
];

const ROUNDS_2026: RoundInfo[] = [
  { round: 1, name: 'Australia', flag: '\u{1F1E6}\u{1F1FA}' },
  { round: 2, name: 'China', flag: '\u{1F1E8}\u{1F1F3}' },
  { round: 3, name: 'Japan', flag: '\u{1F1EF}\u{1F1F5}' },
  { round: 4, name: 'Bahrain', flag: '\u{1F1E7}\u{1F1ED}' },
  { round: 5, name: 'Saudi Arabia', flag: '\u{1F1F8}\u{1F1E6}' },
  { round: 6, name: 'Miami', flag: '\u{1F1FA}\u{1F1F8}' },
  { round: 7, name: 'Emilia Romagna', flag: '\u{1F1EE}\u{1F1F9}' },
  { round: 8, name: 'Monaco', flag: '\u{1F1F2}\u{1F1E8}' },
];

function getRounds(season: number): RoundInfo[] {
  if (season === 2026) return ROUNDS_2026;
  return ROUNDS_2025;
}

/* ------------------------------------------------------------------ */
/* Best-team combo types                                              */
/* ------------------------------------------------------------------ */

interface BestTeamCombo {
  drivers: { driver_number: number; tla: string; team_color: string; price: number; points: number }[];
  constructors: { constructor_id: string; tla: string; team_color: string; price: number; points: number }[];
  total_budget: number;
  delta_price: number;
  total_points: number;
}

interface BestTeamResponse {
  round: number;
  combos: BestTeamCombo[];
  // Legacy single-team response fallback
  drivers?: { driver_number: number; points: number }[];
  total_points?: number;
}

/* ------------------------------------------------------------------ */
/* Sort header                                                        */
/* ------------------------------------------------------------------ */

type PlayerSortKey = 'tla' | 'price' | 'price_change' | 'gameday_points';

function SortHeader({
  label,
  sortKey,
  config,
  onSort,
  align = 'left',
}: {
  label: string;
  sortKey: PlayerSortKey;
  config: SortConfig<PlayerSortKey>;
  onSort: (key: PlayerSortKey) => void;
  align?: 'left' | 'right';
}) {
  const active = config.key === sortKey;
  const arrow = active ? (config.direction === 'asc' ? ' \u25B2' : ' \u25BC') : '';
  return (
    <th
      className={`${align === 'right' ? 'text-right' : 'text-left'} px-2 py-1.5 cursor-pointer select-none hover:text-f1-text transition-colors whitespace-nowrap ${active ? 'text-f1-text' : ''}`}
      onClick={() => onSort(sortKey)}
    >
      {label}{arrow}
    </th>
  );
}

/* ------------------------------------------------------------------ */
/* Main component                                                     */
/* ------------------------------------------------------------------ */

export function Hindsight() {
  const { savedTeams } = useFantasy();
  const { drivers: f1Drivers, constructors: f1Constructors, loading: playersLoading } = useF1Players();

  // Settings state
  const [selectedSeason, setSelectedSeason] = useState(2025);
  const [selectedRound, setSelectedRound] = useState(1);
  const [selectedTeamSlot, setSelectedTeamSlot] = useState<string>('none');
  const [maxBudget, setMaxBudget] = useState('100.0');
  const [activeChip, setActiveChip] = useState<string | null>(null);
  const [convertDeltaPrice, setConvertDeltaPrice] = useState(false);

  // Best team combos
  const [bestCombos, setBestCombos] = useState<BestTeamCombo[]>([]);
  const [loadingCombos, setLoadingCombos] = useState(false);

  // Right column: search + include/exclude
  const [driverSearch, setDriverSearch] = useState('');
  const [constructorSearch, setConstructorSearch] = useState('');
  const [driverInclude, setDriverInclude] = useState<Set<number>>(new Set());
  const [driverExclude, setDriverExclude] = useState<Set<number>>(new Set());
  const [constructorInclude, setConstructorInclude] = useState<Set<string>>(new Set());
  const [constructorExclude, setConstructorExclude] = useState<Set<string>>(new Set());

  // Sorting for driver and constructor tables
  const driverSort = useSort<F1Player, PlayerSortKey>(f1Drivers, 'gameday_points');
  const constructorSort = useSort<F1Player, PlayerSortKey>(f1Constructors, 'gameday_points');

  // Fetch best team combos
  useEffect(() => {
    setLoadingCombos(true);
    fetch(`/api/fantasy/best-team/${selectedRound}?season=${selectedSeason}`)
      .then(r => r.json())
      .then((data: BestTeamResponse) => {
        if (data.combos && Array.isArray(data.combos)) {
          setBestCombos(data.combos.slice(0, 10));
        } else if (data.drivers && Array.isArray(data.drivers)) {
          // Fallback: convert legacy single-team response to combo format
          const combo: BestTeamCombo = {
            drivers: data.drivers.map(d => {
              const player = f1Drivers.find(p => p.driver_number === d.driver_number);
              return {
                driver_number: d.driver_number,
                tla: player?.tla ?? `#${d.driver_number}`,
                team_color: player?.team_color ?? '#888',
                price: player?.price ?? 0,
                points: d.points,
              };
            }),
            constructors: [],
            total_budget: 0,
            delta_price: 0,
            total_points: data.total_points ?? data.drivers.reduce((s, d) => s + d.points, 0),
          };
          setBestCombos([combo]);
        } else {
          setBestCombos([]);
        }
      })
      .catch(() => setBestCombos([]))
      .finally(() => setLoadingCombos(false));
  }, [selectedRound, selectedSeason, f1Drivers]);

  // Filtered drivers and constructors
  const filteredDrivers = useMemo(() => {
    const search = driverSearch.toLowerCase();
    return driverSort.sorted.filter(d =>
      !search || d.tla.toLowerCase().includes(search) || d.name.toLowerCase().includes(search)
    );
  }, [driverSort.sorted, driverSearch]);

  const filteredConstructors = useMemo(() => {
    const search = constructorSearch.toLowerCase();
    return constructorSort.sorted.filter(c =>
      !search || c.tla.toLowerCase().includes(search) || c.name.toLowerCase().includes(search)
    );
  }, [constructorSort.sorted, constructorSearch]);

  // Include/Exclude toggle handlers
  const toggleDriverInclude = (driverNum: number) => {
    setDriverInclude(prev => {
      const next = new Set(prev);
      if (next.has(driverNum)) { next.delete(driverNum); } else { next.add(driverNum); }
      return next;
    });
    setDriverExclude(prev => {
      const next = new Set(prev);
      next.delete(driverNum);
      return next;
    });
  };

  const toggleDriverExclude = (driverNum: number) => {
    setDriverExclude(prev => {
      const next = new Set(prev);
      if (next.has(driverNum)) { next.delete(driverNum); } else { next.add(driverNum); }
      return next;
    });
    setDriverInclude(prev => {
      const next = new Set(prev);
      next.delete(driverNum);
      return next;
    });
  };

  const toggleConstructorInclude = (id: string) => {
    setConstructorInclude(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
    setConstructorExclude(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const toggleConstructorExclude = (id: string) => {
    setConstructorExclude(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
    setConstructorInclude(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const handleFullReset = () => {
    setSelectedSeason(2025);
    setSelectedRound(1);
    setSelectedTeamSlot('none');
    setMaxBudget('100.0');
    setActiveChip(null);
    setConvertDeltaPrice(false);
    setDriverInclude(new Set());
    setDriverExclude(new Set());
    setConstructorInclude(new Set());
    setConstructorExclude(new Set());
    setDriverSearch('');
    setConstructorSearch('');
  };

  const rounds = getRounds(selectedSeason);

  if (playersLoading) return <LoadingTelemetry />;

  return (
    <div className="flex gap-4 h-full min-h-0">
      {/* ============================================================ */}
      {/* LEFT COLUMN: Best Team Combos                                */}
      {/* ============================================================ */}
      <div className="flex-1 min-w-0 flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold font-[var(--font-display)] text-f1-text">Hindsight</h1>
          <button className="text-[10px] uppercase font-bold text-f1-text-muted hover:text-f1-text border border-f1-border rounded px-2 py-1 transition-colors">
            Filters
          </button>
        </div>

        {/* Column headers */}
        <div className="flex items-center text-[10px] text-f1-text-muted uppercase px-3 py-1.5 border-b border-f1-border/30 bg-f1-surface/50 rounded-t-lg">
          <span className="flex-1">DR</span>
          <span className="w-14 text-right">$</span>
          <span className="w-14 text-right">{convertDeltaPrice ? '\u0394$Pts' : '\u0394$'}</span>
          <span className="w-14 text-right">Pts</span>
        </div>

        {/* Combo rows */}
        <div className="flex-1 overflow-y-auto bg-f1-surface rounded-b-lg border border-f1-border">
          {loadingCombos ? (
            <div className="flex items-center justify-center py-12">
              <span className="text-xs text-f1-text-muted">Loading best teams...</span>
            </div>
          ) : bestCombos.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <span className="text-xs text-f1-text-muted">No data available for this round.</span>
            </div>
          ) : (
            bestCombos.map((combo, idx) => (
              <div
                key={idx}
                className="flex items-center py-2 px-3 border-b border-f1-border/30 hover:bg-f1-elevated/30 transition-colors"
              >
                {/* Driver pills */}
                <div className="flex-1 flex items-center gap-1.5 min-w-0 flex-wrap">
                  {combo.drivers.map(d => (
                    <DriverPill
                      key={d.driver_number}
                      tla={d.tla}
                      teamColor={d.team_color}
                      price={d.price}
                      size="sm"
                    />
                  ))}
                  {combo.constructors.map(c => (
                    <ConstructorPill
                      key={c.constructor_id}
                      tla={c.tla}
                      teamColor={c.team_color}
                      price={c.price}
                      size="sm"
                    />
                  ))}
                </div>

                {/* Budget */}
                <span className="w-14 text-right font-timing text-[11px] text-f1-yellow">
                  ${combo.total_budget > 0 ? combo.total_budget.toFixed(1) : '--'}
                </span>

                {/* Delta price */}
                <span className={`w-14 text-right font-timing text-[11px] ${
                  combo.delta_price > 0 ? 'text-f1-green' : combo.delta_price < 0 ? 'text-f1-red' : 'text-f1-text-muted'
                }`}>
                  {combo.delta_price !== 0 ? (combo.delta_price > 0 ? '+' : '') + combo.delta_price.toFixed(1) : '--'}
                </span>

                {/* Points */}
                <span className="w-14 text-right font-timing text-[11px] text-f1-green font-bold">
                  {combo.total_points.toFixed(1)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/* CENTER COLUMN: Settings                                      */}
      {/* ============================================================ */}
      <div className="w-[320px] shrink-0 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold font-[var(--font-display)] text-f1-text uppercase">Settings</h2>
          <button
            onClick={() => {
              // Trigger refetch
              setSelectedRound(prev => prev);
            }}
            className="text-f1-text-muted hover:text-f1-text transition-colors"
            title="Reload"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        <div className="bg-f1-surface rounded-lg border border-f1-border p-3 space-y-3">
          {/* Season + Round row */}
          <div className="flex gap-2">
            {/* Season */}
            <div className="flex-1">
              <label className="text-[10px] text-f1-text-muted uppercase block mb-1">Season</label>
              <select
                value={selectedSeason}
                onChange={e => setSelectedSeason(Number(e.target.value))}
                className="w-full bg-f1-elevated border border-f1-border rounded px-2 py-1.5 text-xs text-f1-text focus:ring-1 focus:ring-f1-red outline-none"
              >
                <option value={2025}>2025</option>
                <option value={2026}>2026</option>
              </select>
            </div>

            {/* Round */}
            <div className="flex-1">
              <label className="text-[10px] text-f1-text-muted uppercase block mb-1">Round</label>
              <select
                value={selectedRound}
                onChange={e => setSelectedRound(Number(e.target.value))}
                className="w-full bg-f1-elevated border border-f1-border rounded px-2 py-1.5 text-xs text-f1-text focus:ring-1 focus:ring-f1-red outline-none"
              >
                {rounds.map(r => (
                  <option key={r.round} value={r.round}>
                    {r.flag} R{r.round} {r.name}
                  </option>
                ))}
                {/* Extra rounds beyond the mapped ones */}
                {Array.from({ length: 24 - rounds.length }, (_, i) => rounds.length + i + 1).map(n => (
                  <option key={n} value={n}>R{n}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Select a team */}
          <div>
            <label className="text-[10px] text-f1-text-muted uppercase block mb-1">Select a team to analyze</label>
            <select
              value={selectedTeamSlot}
              onChange={e => setSelectedTeamSlot(e.target.value)}
              className="w-full bg-f1-elevated border border-f1-border rounded px-2 py-1.5 text-xs text-f1-text focus:ring-1 focus:ring-f1-red outline-none"
            >
              <option value="none">No team selected</option>
              {savedTeams.map((t: SavedTeam) => (
                <option key={t.team_number} value={String(t.team_number)}>
                  T{t.team_number}{t.name ? ` - ${t.name}` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* OR divider */}
          <div className="flex items-center gap-2">
            <div className="flex-1 border-t border-f1-border/50" />
            <span className="text-[10px] text-f1-text-muted font-bold">OR</span>
            <div className="flex-1 border-t border-f1-border/50" />
          </div>

          {/* Maximum budget */}
          <div>
            <label className="text-[10px] text-f1-text-muted uppercase block mb-1">Maximum budget</label>
            <div className="flex items-center bg-f1-elevated border border-f1-border rounded px-2 py-1.5">
              <span className="text-xs text-f1-text-muted mr-1">$</span>
              <input
                type="number"
                step="0.1"
                value={maxBudget}
                onChange={e => setMaxBudget(e.target.value)}
                className="flex-1 bg-transparent text-xs text-f1-text outline-none font-timing min-w-0"
              />
              <span className="text-xs text-f1-text-muted ml-1">M</span>
            </div>
          </div>

          {/* Chip selection */}
          <div>
            <label className="text-[10px] text-f1-text-muted uppercase block mb-1">Select a chip</label>
            <ChipButtons
              chips={['X3', 'LL', 'WC', 'NN']}
              activeChip={activeChip}
              onSelect={setActiveChip}
            />
          </div>

          {/* Delta price toggle */}
          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={convertDeltaPrice}
              onChange={e => setConvertDeltaPrice(e.target.checked)}
              className="mt-0.5 accent-f1-red"
            />
            <span className="text-[10px] text-f1-text-muted leading-tight">
              Convert expected price changes ({'\u0394'}$) into expected price change points ({'\u0394'}$Pts)
            </span>
          </label>

          {/* Full Reset + gear */}
          <div className="flex items-center justify-between pt-1 border-t border-f1-border/30">
            <button
              onClick={handleFullReset}
              className="text-[10px] uppercase font-bold text-f1-red hover:text-f1-text transition-colors"
            >
              Full Reset
            </button>
            <button className="text-f1-text-muted hover:text-f1-text transition-colors" title="Settings">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* RIGHT COLUMN: Drivers + Constructors                         */}
      {/* ============================================================ */}
      <div className="w-[350px] shrink-0 flex flex-col gap-4 min-h-0">
        {/* --- Drivers section --- */}
        <div className="flex flex-col min-h-0 flex-1">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-bold font-[var(--font-display)] text-f1-text uppercase">Drivers</h2>
            <button className="text-[10px] uppercase font-bold text-f1-text-muted hover:text-f1-text border border-f1-border rounded px-2 py-0.5 transition-colors">
              Columns
            </button>
          </div>

          <SearchBar
            placeholder="Find a driver... (e.g. VER)"
            value={driverSearch}
            onChange={setDriverSearch}
            className="mb-2 !py-1.5 !text-xs"
          />

          <div className="flex-1 overflow-y-auto bg-f1-surface rounded-lg border border-f1-border">
            <table className="w-full">
              <thead className="sticky top-0 bg-f1-surface z-10">
                <tr className="text-[10px] text-f1-text-muted uppercase border-b border-f1-border">
                  <SortHeader label="DR" sortKey="tla" config={driverSort.sortConfig} onSort={driverSort.toggleSort} />
                  <SortHeader label="$" sortKey="price" config={driverSort.sortConfig} onSort={driverSort.toggleSort} align="right" />
                  <SortHeader label={convertDeltaPrice ? '\u0394$Pts' : '\u0394$'} sortKey="price_change" config={driverSort.sortConfig} onSort={driverSort.toggleSort} align="right" />
                  <SortHeader label="Pts" sortKey="gameday_points" config={driverSort.sortConfig} onSort={driverSort.toggleSort} align="right" />
                  <th className="px-2 py-1.5 text-center w-8" title="Include">
                    <span className="text-f1-green">+</span>
                  </th>
                  <th className="px-2 py-1.5 text-center w-8" title="Exclude">
                    <span className="text-f1-red">-</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-f1-border/30">
                {filteredDrivers.map(d => {
                  const dNum = d.driver_number ?? 0;
                  const isIncluded = driverInclude.has(dNum);
                  const isExcluded = driverExclude.has(dNum);
                  return (
                    <tr key={dNum} className="hover:bg-f1-elevated/30 transition-colors">
                      <td className="px-2 py-1.5">
                        <DriverPill tla={d.tla} teamColor={d.team_color} size="sm" />
                      </td>
                      <td className="px-2 py-1.5 text-right font-timing text-[11px] text-f1-yellow">
                        ${d.price.toFixed(1)}
                      </td>
                      <td className={`px-2 py-1.5 text-right font-timing text-[11px] ${
                        d.price_change > 0 ? 'text-f1-green' : d.price_change < 0 ? 'text-f1-red' : 'text-f1-text-muted'
                      }`}>
                        {d.price_change !== 0
                          ? (d.price_change > 0 ? '+' : '') + d.price_change.toFixed(1)
                          : '0.0'}
                      </td>
                      <td className="px-2 py-1.5 text-right font-timing text-[11px] text-f1-green font-bold">
                        {d.gameday_points}
                      </td>
                      <td className="px-2 py-1.5 text-center">
                        <button
                          onClick={() => toggleDriverInclude(dNum)}
                          className={`w-4 h-4 rounded border text-[10px] font-bold flex items-center justify-center transition-colors ${
                            isIncluded
                              ? 'bg-f1-green/20 border-f1-green text-f1-green'
                              : 'border-f1-border text-transparent hover:border-f1-green/50'
                          }`}
                        >
                          {isIncluded ? '\u2713' : '\u00A0'}
                        </button>
                      </td>
                      <td className="px-2 py-1.5 text-center">
                        <button
                          onClick={() => toggleDriverExclude(dNum)}
                          className={`w-4 h-4 rounded border text-[10px] font-bold flex items-center justify-center transition-colors ${
                            isExcluded
                              ? 'bg-f1-red/20 border-f1-red text-f1-red'
                              : 'border-f1-border text-transparent hover:border-f1-red/50'
                          }`}
                        >
                          {isExcluded ? '\u2715' : '\u00A0'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {filteredDrivers.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-3 py-4 text-center text-xs text-f1-text-muted">
                      No drivers found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* --- Constructors section --- */}
        <div className="flex flex-col min-h-0 flex-[0.6]">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-bold font-[var(--font-display)] text-f1-text uppercase">Constructors</h2>
            <button className="text-[10px] uppercase font-bold text-f1-text-muted hover:text-f1-text border border-f1-border rounded px-2 py-0.5 transition-colors">
              Columns
            </button>
          </div>

          <SearchBar
            placeholder="Find a constructor..."
            value={constructorSearch}
            onChange={setConstructorSearch}
            className="mb-2 !py-1.5 !text-xs"
          />

          <div className="flex-1 overflow-y-auto bg-f1-surface rounded-lg border border-f1-border">
            <table className="w-full">
              <thead className="sticky top-0 bg-f1-surface z-10">
                <tr className="text-[10px] text-f1-text-muted uppercase border-b border-f1-border">
                  <SortHeader label="CR" sortKey="tla" config={constructorSort.sortConfig} onSort={constructorSort.toggleSort} />
                  <SortHeader label="$" sortKey="price" config={constructorSort.sortConfig} onSort={constructorSort.toggleSort} align="right" />
                  <SortHeader label={convertDeltaPrice ? '\u0394$Pts' : '\u0394$'} sortKey="price_change" config={constructorSort.sortConfig} onSort={constructorSort.toggleSort} align="right" />
                  <SortHeader label="Pts" sortKey="gameday_points" config={constructorSort.sortConfig} onSort={constructorSort.toggleSort} align="right" />
                  <th className="px-2 py-1.5 text-center w-8" title="Include">
                    <span className="text-f1-green">+</span>
                  </th>
                  <th className="px-2 py-1.5 text-center w-8" title="Exclude">
                    <span className="text-f1-red">-</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-f1-border/30">
                {filteredConstructors.map(c => {
                  const cId = c.constructor_id ?? c.tla;
                  const isIncluded = constructorInclude.has(cId);
                  const isExcluded = constructorExclude.has(cId);
                  return (
                    <tr key={cId} className="hover:bg-f1-elevated/30 transition-colors">
                      <td className="px-2 py-1.5">
                        <ConstructorPill tla={c.tla} teamColor={c.team_color} size="sm" />
                      </td>
                      <td className="px-2 py-1.5 text-right font-timing text-[11px] text-f1-yellow">
                        ${c.price.toFixed(1)}
                      </td>
                      <td className={`px-2 py-1.5 text-right font-timing text-[11px] ${
                        c.price_change > 0 ? 'text-f1-green' : c.price_change < 0 ? 'text-f1-red' : 'text-f1-text-muted'
                      }`}>
                        {c.price_change !== 0
                          ? (c.price_change > 0 ? '+' : '') + c.price_change.toFixed(1)
                          : '0.0'}
                      </td>
                      <td className="px-2 py-1.5 text-right font-timing text-[11px] text-f1-green font-bold">
                        {c.gameday_points}
                      </td>
                      <td className="px-2 py-1.5 text-center">
                        <button
                          onClick={() => toggleConstructorInclude(cId)}
                          className={`w-4 h-4 rounded border text-[10px] font-bold flex items-center justify-center transition-colors ${
                            isIncluded
                              ? 'bg-f1-green/20 border-f1-green text-f1-green'
                              : 'border-f1-border text-transparent hover:border-f1-green/50'
                          }`}
                        >
                          {isIncluded ? '\u2713' : '\u00A0'}
                        </button>
                      </td>
                      <td className="px-2 py-1.5 text-center">
                        <button
                          onClick={() => toggleConstructorExclude(cId)}
                          className={`w-4 h-4 rounded border text-[10px] font-bold flex items-center justify-center transition-colors ${
                            isExcluded
                              ? 'bg-f1-red/20 border-f1-red text-f1-red'
                              : 'border-f1-border text-transparent hover:border-f1-red/50'
                          }`}
                        >
                          {isExcluded ? '\u2715' : '\u00A0'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {filteredConstructors.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-3 py-4 text-center text-xs text-f1-text-muted">
                      No constructors found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
