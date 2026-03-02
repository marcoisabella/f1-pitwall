import { useState, useEffect, useMemo } from 'react';
import { LoadingTelemetry } from '../../components/common/LoadingTelemetry';
import { useF1Players } from '../../hooks/useFantasy';
import { PageHeader } from '../../components/fantasy/PageHeader';
import { TeamSlotTabs } from '../../components/fantasy/TeamSlotTabs';
import { SearchBar } from '../../components/fantasy/SearchBar';
import { DriverPill } from '../../components/fantasy/DriverPill';
import { ConstructorPill } from '../../components/fantasy/ConstructorPill';
import type { F1Player } from '../../types/f1';

// ── Normal CDF approximation ────────────────────────────────────────

function normalCDF(x: number, mean: number, std: number): number {
  if (std === 0) return x >= mean ? 1 : 0;
  const z = (x - mean) / std;
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989422804 * Math.exp(-z * z / 2);
  const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.8212560 + t * 1.3302744))));
  return z > 0 ? 1 - p : p;
}

// ── Types ────────────────────────────────────────────────────────────

interface SimPlayer {
  driver_number?: number;
  constructor_id?: string;
  mean_points: number;
  std_dev: number;
  price: number;
}

interface Thresholds {
  big_rise: number;
  small_rise: number;
  small_drop: number;
  big_drop: number;
}

interface PriceChangeCols {
  negative: number[];
  positive: number[];
}

interface PlayerRow {
  id: string;
  tla: string;
  teamColor: string;
  price: number;
  r_minus_1: number | null; // previous round points
  r0: number | null;        // last round points
  r1_xpts: number;          // expected next-round points
  odds: number[];           // probabilities for each price change column (4 values)
  xDelta: number;           // expected price change
  mean_points: number;
  std_dev: number;
  type: 'driver' | 'constructor';
}

// ── Tier config ──────────────────────────────────────────────────────

const TIER_A_THRESHOLD = 18.5;

const DRIVER_TIER_A_CHANGES: PriceChangeCols = {
  negative: [-0.3, -0.1],
  positive: [0.1, 0.3],
};

const DRIVER_TIER_B_CHANGES: PriceChangeCols = {
  negative: [-0.6, -0.2],
  positive: [0.2, 0.6],
};

const CONSTRUCTOR_TIER_A_CHANGES: PriceChangeCols = {
  negative: [-0.3, -0.1],
  positive: [0.1, 0.3],
};

const CONSTRUCTOR_TIER_B_CHANGES: PriceChangeCols = {
  negative: [-0.6, -0.2],
  positive: [0.2, 0.6],
};

// ── Simulation presets ───────────────────────────────────────────────

const SIM_PRESETS = [
  { label: 'Standard (10k)', value: '10k' },
  { label: 'Quick (1k)', value: '1k' },
  { label: 'Deep (50k)', value: '50k' },
] as const;

// ── Helpers ──────────────────────────────────────────────────────────

function computeOdds(
  meanPts: number,
  stdDev: number,
  thresholds: Thresholds | null,
): number[] {
  if (!thresholds || stdDev === 0) {
    return [0, 0, 0, 0];
  }

  // P(big_drop): P(pts <= big_drop threshold)
  const pBigDrop = normalCDF(thresholds.big_drop, meanPts, stdDev);
  // P(small_drop): P(big_drop < pts < small_drop)
  const pSmallDrop = normalCDF(thresholds.small_drop, meanPts, stdDev) - pBigDrop;
  // P(small_rise): P(small_rise <= pts < big_rise)
  const pSmallRise = (1 - normalCDF(thresholds.small_rise, meanPts, stdDev)) -
    (1 - normalCDF(thresholds.big_rise, meanPts, stdDev));
  // P(big_rise): P(pts >= big_rise threshold)
  const pBigRise = 1 - normalCDF(thresholds.big_rise, meanPts, stdDev);

  return [
    Math.max(0, Math.min(1, pBigDrop)),
    Math.max(0, Math.min(1, pSmallDrop)),
    Math.max(0, Math.min(1, pSmallRise)),
    Math.max(0, Math.min(1, pBigRise)),
  ];
}

function computeExpectedDelta(odds: number[], cols: PriceChangeCols): number {
  const allChanges = [...cols.negative, ...cols.positive];
  return odds.reduce((sum, p, i) => sum + p * allChanges[i], 0);
}

function oddsBackground(p: number, isNegative: boolean): string {
  if (isNegative) {
    if (p > 0.8) return 'bg-red-900/50';
    if (p > 0.5) return 'bg-red-900/30';
    if (p > 0.2) return 'bg-red-900/20';
    return '';
  }
  if (p > 0.8) return 'bg-green-900/50';
  if (p > 0.5) return 'bg-green-900/30';
  if (p > 0.2) return 'bg-green-900/20';
  return '';
}

function deltaColor(v: number): string {
  if (v > 0.001) return 'text-green-400';
  if (v < -0.001) return 'text-red-400';
  return 'text-f1-text-muted';
}

function formatDelta(v: number): string {
  if (Math.abs(v) < 0.005) return '0';
  return (v > 0 ? '+' : '') + v.toFixed(2);
}

function matchesSearch(search: string, tla: string): boolean {
  if (!search.trim()) return true;
  const terms = search.toUpperCase().split('+').map(t => t.trim()).filter(Boolean);
  return terms.some(t => tla.toUpperCase().includes(t));
}

// ── Main component ───────────────────────────────────────────────────

export function BudgetBuilder() {
  const { drivers: f1Drivers, constructors: f1Constructors, loading: playersLoading } = useF1Players();

  const [simPreset, setSimPreset] = useState('10k');
  const [activeSlot, setActiveSlot] = useState<1 | 2 | 3>(1);
  const [driverSearch, setDriverSearch] = useState('');
  const [constructorSearch, setConstructorSearch] = useState('');

  // Simulation data from backend
  const [simData, setSimData] = useState<{ drivers: SimPlayer[]; constructors: SimPlayer[] } | null>(null);
  const [simLoading, setSimLoading] = useState(true);

  // Price prediction thresholds from backend
  const [thresholds, setThresholds] = useState<{
    drivers: Record<string, Thresholds & { price_changes: Record<string, number> }>;
    constructors: Record<string, Thresholds & { price_changes: Record<string, number> }>;
  } | null>(null);

  useEffect(() => {
    setSimLoading(true);
    Promise.all([
      fetch('/api/fantasy/simulate').then(r => r.json()),
      fetch('/api/fantasy/price-predictions').then(r => r.json()),
    ])
      .then(([sim, preds]) => {
        setSimData(sim);
        setThresholds(preds?.thresholds ?? null);
      })
      .catch(() => {})
      .finally(() => setSimLoading(false));
  }, []);

  // ── Build player rows ──────────────────────────────────────────────

  const driverRows = useMemo(() => {
    if (!f1Drivers.length) return [];

    const simMap = new Map<number, SimPlayer>();
    if (simData?.drivers) {
      for (const d of simData.drivers) {
        if (d.driver_number != null) simMap.set(d.driver_number, d);
      }
    }

    return f1Drivers.map((d: F1Player): PlayerRow => {
      const dnum = d.driver_number ?? 0;
      const sim = simMap.get(dnum);
      const meanPts = sim?.mean_points ?? d.projected_points ?? 0;
      const stdDev = sim?.std_dev ?? meanPts * 0.3;

      const th = thresholds?.drivers?.[String(dnum)] ?? null;
      const tier = d.price >= TIER_A_THRESHOLD ? 'A' : 'B';
      const cols = tier === 'A' ? DRIVER_TIER_A_CHANGES : DRIVER_TIER_B_CHANGES;
      const odds = computeOdds(meanPts, stdDev, th);
      const xDelta = computeExpectedDelta(odds, cols);

      return {
        id: `d-${dnum}`,
        tla: d.tla,
        teamColor: d.team_color || '#888',
        price: d.price,
        r_minus_1: null,  // no historical round data available yet
        r0: d.gameday_points > 0 ? d.gameday_points : null,
        r1_xpts: Math.round(meanPts * 10) / 10,
        odds,
        xDelta,
        mean_points: meanPts,
        std_dev: stdDev,
        type: 'driver',
      };
    });
  }, [f1Drivers, simData, thresholds]);

  const constructorRows = useMemo(() => {
    if (!f1Constructors.length) return [];

    const simMap = new Map<string, SimPlayer>();
    if (simData?.constructors) {
      for (const c of simData.constructors) {
        if (c.constructor_id != null) simMap.set(c.constructor_id, c);
      }
    }

    return f1Constructors.map((c: F1Player): PlayerRow => {
      const cid = c.constructor_id ?? '';
      const sim = simMap.get(cid);
      const meanPts = sim?.mean_points ?? c.projected_points ?? 0;
      const stdDev = sim?.std_dev ?? meanPts * 0.3;

      const th = thresholds?.constructors?.[cid] ?? null;
      const tier = c.price >= TIER_A_THRESHOLD ? 'A' : 'B';
      const cols = tier === 'A' ? CONSTRUCTOR_TIER_A_CHANGES : CONSTRUCTOR_TIER_B_CHANGES;
      const odds = computeOdds(meanPts, stdDev, th);
      const xDelta = computeExpectedDelta(odds, cols);

      return {
        id: `c-${cid}`,
        tla: c.tla,
        teamColor: c.team_color || '#888',
        price: c.price,
        r_minus_1: null,
        r0: c.gameday_points > 0 ? c.gameday_points : null,
        r1_xpts: Math.round(meanPts * 10) / 10,
        odds,
        xDelta,
        mean_points: meanPts,
        std_dev: stdDev,
        type: 'constructor',
      };
    });
  }, [f1Constructors, simData, thresholds]);

  // ── Split into tiers + filter + sort ───────────────────────────────

  const filterAndSort = (rows: PlayerRow[], search: string) => {
    const filtered = rows.filter(r => matchesSearch(search, r.tla));
    const tierA = filtered.filter(r => r.price >= TIER_A_THRESHOLD).sort((a, b) => b.r1_xpts - a.r1_xpts);
    const tierB = filtered.filter(r => r.price < TIER_A_THRESHOLD).sort((a, b) => b.r1_xpts - a.r1_xpts);
    return { tierA, tierB };
  };

  const driverTiers = useMemo(() => filterAndSort(driverRows, driverSearch), [driverRows, driverSearch]);
  const constructorTiers = useMemo(() => filterAndSort(constructorRows, constructorSearch), [constructorRows, constructorSearch]);

  const isLoading = playersLoading || simLoading;

  // ── Render ─────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <PageHeader
        title="Budget Builder"
        subtitle="Use the points scored in the past two races to see how many points each asset needs to increase in price by how much. The odds of them earning enough points are calculated from simulations."
      />

      {/* Controls bar */}
      <div className="flex items-center justify-center gap-6">
        <select
          value={simPreset}
          onChange={e => setSimPreset(e.target.value)}
          className="bg-f1-surface border border-f1-border rounded-lg px-3 py-1.5 text-sm text-f1-text focus:ring-1 focus:ring-f1-red focus:border-f1-red outline-none"
        >
          {SIM_PRESETS.map(p => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>

        <TeamSlotTabs activeSlot={activeSlot} onChange={setActiveSlot} />

        <button
          type="button"
          className="p-2 text-f1-text-muted hover:text-f1-text transition-colors"
          title="Settings"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      {/* Search bars row */}
      <div className="grid grid-cols-2 gap-4">
        <SearchBar
          placeholder="Find a driver... (e.g. VER+NOR)"
          value={driverSearch}
          onChange={setDriverSearch}
        />
        <SearchBar
          placeholder="Find a constructor... (e.g. RED+MCL)"
          value={constructorSearch}
          onChange={setConstructorSearch}
        />
      </div>

      {isLoading ? (
        <LoadingTelemetry />
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Left column: Drivers */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-f1-text font-[var(--font-display)]">Drivers</h2>
            <TierTable
              label={`Tier A (>=${TIER_A_THRESHOLD}M)`}
              rows={driverTiers.tierA}
              cols={DRIVER_TIER_A_CHANGES}
              entityType="driver"
            />
            <TierTable
              label={`Tier B (<${TIER_A_THRESHOLD}M)`}
              rows={driverTiers.tierB}
              cols={DRIVER_TIER_B_CHANGES}
              entityType="driver"
            />
          </div>

          {/* Right column: Constructors */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-f1-text font-[var(--font-display)]">Constructors</h2>
            <TierTable
              label={`Tier A (>=${TIER_A_THRESHOLD}M)`}
              rows={constructorTiers.tierA}
              cols={CONSTRUCTOR_TIER_A_CHANGES}
              entityType="constructor"
            />
            <TierTable
              label={`Tier B (<${TIER_A_THRESHOLD}M)`}
              rows={constructorTiers.tierB}
              cols={CONSTRUCTOR_TIER_B_CHANGES}
              entityType="constructor"
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Tier Table ───────────────────────────────────────────────────────

function TierTable({
  label,
  rows,
  cols,
  entityType,
}: {
  label: string;
  rows: PlayerRow[];
  cols: PriceChangeCols;
  entityType: 'driver' | 'constructor';
}) {
  const allChanges = [...cols.negative, ...cols.positive];

  if (rows.length === 0) {
    return (
      <div className="bg-f1-surface rounded-lg border border-f1-border p-4">
        <div className="text-f1-text-muted text-xs uppercase tracking-wider py-2 border-b border-f1-border mb-2">
          {label}
        </div>
        <div className="text-f1-text-muted text-sm py-4 text-center">No assets in this tier.</div>
      </div>
    );
  }

  return (
    <div className="bg-f1-surface rounded-lg border border-f1-border overflow-hidden">
      {/* Tier label */}
      <div className="text-f1-text-muted text-xs uppercase tracking-wider py-2 px-3 border-b border-f1-border">
        {label}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-[10px] text-f1-text-muted uppercase bg-f1-surface sticky top-0">
              <th className="text-left px-3 py-2 whitespace-nowrap">
                {entityType === 'driver' ? 'DR' : 'CN'}
              </th>
              <th className="text-right px-2 py-2 whitespace-nowrap">$</th>
              <th className="text-right px-2 py-2 whitespace-nowrap">R-1</th>
              <th className="text-right px-2 py-2 whitespace-nowrap">R0</th>
              <th className="text-right px-2 py-2 whitespace-nowrap">R1</th>
              {allChanges.map((change, i) => {
                const isNeg = i < cols.negative.length;
                return (
                  <th
                    key={i}
                    className={`text-center px-1 py-2 min-w-[56px] whitespace-nowrap ${
                      isNeg
                        ? 'bg-red-900/40 text-red-400'
                        : 'bg-green-900/40 text-green-400'
                    }`}
                  >
                    {change > 0 ? '+' : ''}{change.toFixed(1)}
                  </th>
                );
              })}
              <th className="text-right px-2 py-2 whitespace-nowrap">xDelta$</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-f1-border">
            {rows.map(row => (
              <tr key={row.id} className="hover:bg-f1-elevated/30 transition-colors">
                {/* Driver/Constructor pill */}
                <td className="px-3 py-1.5">
                  {entityType === 'driver' ? (
                    <DriverPill tla={row.tla} teamColor={row.teamColor} size="sm" />
                  ) : (
                    <ConstructorPill tla={row.tla} teamColor={row.teamColor} size="sm" />
                  )}
                </td>
                {/* Price */}
                <td className="text-right px-2 py-1.5 font-timing text-xs text-white whitespace-nowrap">
                  {row.price.toFixed(1)}
                </td>
                {/* R-1 */}
                <td className="text-right px-2 py-1.5 font-timing text-xs text-f1-text-muted">
                  {row.r_minus_1 != null ? row.r_minus_1 : '-'}
                </td>
                {/* R0 */}
                <td className="text-right px-2 py-1.5 font-timing text-xs text-f1-text-muted">
                  {row.r0 != null ? row.r0 : '-'}
                </td>
                {/* R1 xPts */}
                <td className="text-right px-2 py-1.5 font-timing text-xs text-f1-cyan font-semibold">
                  {row.r1_xpts.toFixed(1)}
                </td>
                {/* Odds columns */}
                {row.odds.map((p, i) => {
                  const isNeg = i < cols.negative.length;
                  const bg = oddsBackground(p, isNeg);
                  return (
                    <td
                      key={i}
                      className={`text-center px-1 py-1.5 font-timing text-xs min-w-[56px] ${bg}`}
                    >
                      <span className={isNeg ? 'text-red-300' : 'text-green-300'}>
                        {p > 0.005 ? `${Math.round(p * 100)}%` : '-'}
                      </span>
                    </td>
                  );
                })}
                {/* xDelta$ */}
                <td className={`text-right px-2 py-1.5 font-timing text-xs font-semibold ${deltaColor(row.xDelta)}`}>
                  {formatDelta(row.xDelta)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
