import { useState, useMemo } from 'react';
import { useF1Players } from '../../hooks/useFantasy';
import { LoadingTelemetry } from '../../components/common/LoadingTelemetry';
import { PageHeader } from '../../components/fantasy/PageHeader';
import { TeamSlotTabs } from '../../components/fantasy/TeamSlotTabs';
import { SearchBar } from '../../components/fantasy/SearchBar';
import { DriverPill } from '../../components/fantasy/DriverPill';
import { ConstructorPill } from '../../components/fantasy/ConstructorPill';
import { RACES } from '../../data/calendar2026';
import { countryFlag } from '../../utils/countryFlags';

// ---------------------------------------------------------------------------
// Mock chip usage data (community data we don't have -- clearly labelled)
// ---------------------------------------------------------------------------
// Seeded pseudo-random so values stay stable across renders
function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s & 0x7fffffff) / 0x7fffffff;
  };
}

const CHIP_KEYS = ['LL', 'X3', 'NN', 'AP', 'FF', 'WC'] as const;
type ChipKey = (typeof CHIP_KEYS)[number];

interface ChipRow {
  round: number;
  country: string;
  countryCode: string;
  LL: number;
  X3: number;
  NN: number;
  AP: number;
  FF: number;
  WC: number;
}

const CHIP_USAGE_MOCK: ChipRow[] = (() => {
  const rng = seededRandom(42);
  return Array.from({ length: 24 }, (_, i) => {
    const round = 24 - i;
    const race = RACES.find((r) => r.round === round);
    return {
      round,
      country: race?.countryName ?? '??',
      countryCode: race?.country ?? '',
      LL: +(rng() * 5).toFixed(1),
      X3: +(rng() * 5).toFixed(1),
      NN: +(rng() * 5).toFixed(1),
      AP: +(rng() * 20).toFixed(1),
      FF: +(rng() * 10).toFixed(1),
      WC: +(rng() * 8).toFixed(1),
    };
  });
})();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
type Dataset = 'global500' | 'subscriber500';

/** Green tint proportional to a percentage value (0..100) */
function pctBg(value: number): React.CSSProperties {
  const alpha = Math.min(value / 100, 1) * 0.5;
  return { backgroundColor: `rgba(22, 163, 74, ${alpha.toFixed(3)})` };
}

/** Format a percentage change with sign */
function fmtChange(val: number): string {
  const sign = val > 0 ? '+' : '';
  return `${sign}${val.toFixed(1)}%`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function EliteData() {
  const { drivers, constructors, loading } = useF1Players();

  // Settings state
  const [activeSlot, setActiveSlot] = useState<1 | 2 | 3>(1);
  const [datasets, setDatasets] = useState<Record<Dataset, boolean>>({
    global500: false,
    subscriber500: true,
  });
  const [showVisual, setShowVisual] = useState(false);

  // Picks tab: drivers vs constructors
  const [picksTab, setPicksTab] = useState<'drivers' | 'constructors'>('drivers');

  // Search state
  const [driverSearch, setDriverSearch] = useState('');
  const [chipSearch, setChipSearch] = useState('');

  // Sorted driver picks (by selected_pct descending)
  const driverPicks = useMemo(() => {
    const q = driverSearch.toLowerCase();
    const filtered = drivers.filter(
      (d) =>
        d.tla.toLowerCase().includes(q) ||
        d.name.toLowerCase().includes(q) ||
        d.team_name.toLowerCase().includes(q),
    );
    return [...filtered].sort((a, b) => b.selected_pct - a.selected_pct);
  }, [drivers, driverSearch]);

  // Sorted constructor picks
  const constructorPicks = useMemo(() => {
    const q = driverSearch.toLowerCase();
    const filtered = constructors.filter(
      (c) =>
        c.tla.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        c.team_name.toLowerCase().includes(q),
    );
    return [...filtered].sort((a, b) => b.selected_pct - a.selected_pct);
  }, [constructors, driverSearch]);

  // Filtered chip rows
  const chipRows = useMemo(() => {
    if (!chipSearch) return CHIP_USAGE_MOCK;
    const q = chipSearch.toLowerCase();
    return CHIP_USAGE_MOCK.filter(
      (r) =>
        `R${r.round}`.toLowerCase().includes(q) ||
        r.country.toLowerCase().includes(q) ||
        r.countryCode.toLowerCase().includes(q),
    );
  }, [chipSearch]);

  // Chip totals
  const chipTotals = useMemo(() => {
    const totals: Record<ChipKey, number> = { LL: 0, X3: 0, NN: 0, AP: 0, FF: 0, WC: 0 };
    for (const row of CHIP_USAGE_MOCK) {
      for (const key of CHIP_KEYS) {
        totals[key] += row[key];
      }
    }
    return totals;
  }, []);

  const activeDatasetLabel = datasets.subscriber500 ? 'Subscriber 500' : 'Global 500';

  if (loading) return <LoadingTelemetry />;

  // Generate fake +/- change values deterministically from existing data
  const fakeChange = (pct: number, idx: number) => {
    const rng = seededRandom(Math.round(pct * 1000) + idx * 7);
    return +((rng() - 0.4) * 15).toFixed(1);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Elite Data"
        subtitle="Selection percentages, captain choices, and chip usage across the top fantasy teams."
      />

      {/* 3-column layout */}
      <div className="flex gap-4 items-start">
        {/* ── LEFT COLUMN: Settings ── */}
        <div className="w-[250px] shrink-0 space-y-4">
          <div className="bg-f1-surface rounded-xl border border-f1-border p-4 space-y-5">
            {/* Header */}
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-f1-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.573-1.066z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <h2 className="text-sm font-bold text-f1-text font-[var(--font-display)] uppercase tracking-wider">
                Settings
              </h2>
            </div>

            {/* Team slot highlight */}
            <div className="space-y-2">
              <p className="text-xs text-f1-text-muted">Highlight your team</p>
              <TeamSlotTabs activeSlot={activeSlot} onChange={setActiveSlot} className="w-full" />
            </div>

            {/* Dataset selection */}
            <div className="space-y-2">
              <p className="text-xs text-f1-text-muted font-semibold">Select datasets</p>

              <label className="flex items-start gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={datasets.global500}
                  onChange={() =>
                    setDatasets((d) => ({ ...d, global500: !d.global500 }))
                  }
                  className="mt-0.5 accent-f1-green rounded"
                />
                <span className="text-xs text-f1-text group-hover:text-white transition-colors leading-relaxed">
                  <strong>Global 500</strong>
                  <br />
                  <span className="text-f1-text-muted">
                    The 500 highest overall scoring teams in F1 Fantasy
                  </span>
                </span>
              </label>

              <label className="flex items-start gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={datasets.subscriber500}
                  onChange={() =>
                    setDatasets((d) => ({ ...d, subscriber500: !d.subscriber500 }))
                  }
                  className="mt-0.5 accent-f1-green rounded"
                />
                <span className="text-xs text-f1-text group-hover:text-white transition-colors leading-relaxed">
                  <strong>Subscriber 500</strong>
                  <br />
                  <span className="text-f1-text-muted">
                    The 500 highest scoring teams among F1 Fantasy Tools Subscribers
                  </span>
                </span>
              </label>
            </div>

            {/* Visual settings (collapsible) */}
            <div>
              <button
                type="button"
                onClick={() => setShowVisual((v) => !v)}
                className="flex items-center gap-1 text-xs text-f1-text-muted hover:text-f1-text transition-colors w-full"
              >
                <svg
                  className={`w-3 h-3 transition-transform ${showVisual ? 'rotate-90' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
                Visual settings
              </button>
              {showVisual && (
                <div className="mt-2 pl-4 text-xs text-f1-text-muted space-y-1">
                  <p>Color intensity and display options coming soon.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── CENTER COLUMN: Driver / Constructor Picks ── */}
        <div className="flex-1 min-w-0">
          <div className="bg-f1-surface rounded-xl border border-f1-border p-4 space-y-3">
            {/* Header row */}
            <div className="flex items-center gap-3 flex-wrap">
              {/* Helmet icon */}
              <svg className="w-5 h-5 text-f1-cyan shrink-0" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12c0 1.33.26 2.61.74 3.77L8 12l3 3 5-5 4.26 4.26c.48-1.16.74-2.44.74-3.77A10.02 10.02 0 0012 2zm0 18c-4.41 0-8-3.59-8-8 0-.34.03-.67.07-1H4v1c0 4.41 3.59 8 8 8s8-3.59 8-8v-1h-.07c.04.33.07.66.07 1 0 4.41-3.59 8-8 8z" />
              </svg>
              <h2 className="text-sm font-bold text-f1-text font-[var(--font-display)] uppercase tracking-wider">
                {picksTab === 'drivers' ? 'Driver Picks' : 'Constructor Picks'}
              </h2>

              {/* Tooltip */}
              <span className="relative group">
                <svg className="w-3.5 h-3.5 text-f1-text-muted cursor-help" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 16v-4M12 8h.01" />
                </svg>
                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-f1-elevated text-f1-text text-[10px] rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                  Selection and captain percentages from top teams
                </span>
              </span>

              {/* Tabs: Drivers / Constructors */}
              <div className="inline-flex rounded-lg border border-f1-border overflow-hidden ml-auto">
                <button
                  type="button"
                  onClick={() => setPicksTab('drivers')}
                  className={`px-3 py-1 text-xs font-timing transition-colors ${
                    picksTab === 'drivers' ? 'bg-f1-elevated text-white' : 'text-f1-text-muted hover:text-white'
                  }`}
                >
                  Drivers
                </button>
                <button
                  type="button"
                  onClick={() => setPicksTab('constructors')}
                  className={`px-3 py-1 text-xs font-timing transition-colors ${
                    picksTab === 'constructors' ? 'bg-f1-elevated text-white' : 'text-f1-text-muted hover:text-white'
                  }`}
                >
                  Constructors
                </button>
              </div>

              <SearchBar
                placeholder="Search..."
                value={driverSearch}
                onChange={setDriverSearch}
                className="max-w-[180px] !py-1 !text-xs"
              />
            </div>

            {/* Dataset label */}
            <p className="text-[10px] text-f1-text-muted uppercase tracking-widest">
              {activeDatasetLabel}
            </p>

            {/* Table */}
            <div className="overflow-x-auto">
              {picksTab === 'drivers' ? (
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="text-[10px] text-f1-text-muted uppercase">
                      <th className="text-left py-1.5 px-2 font-semibold">DR</th>
                      <th className="text-right py-1.5 px-2 font-semibold">P%</th>
                      <th className="text-right py-1.5 px-2 font-semibold">+/-</th>
                      <th className="text-right py-1.5 px-2 font-semibold">x2%</th>
                      <th className="text-right py-1.5 px-2 font-semibold">+/-</th>
                    </tr>
                  </thead>
                  <tbody>
                    {driverPicks.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center text-f1-text-muted text-sm py-6">
                          No driver data available
                        </td>
                      </tr>
                    ) : (
                      driverPicks.map((d, idx) => {
                        const selChange = fakeChange(d.selected_pct, idx);
                        const capChange = fakeChange(d.captain_pct, idx + 100);
                        return (
                          <tr
                            key={d.tla}
                            className="border-b border-f1-border/30 hover:bg-f1-elevated/20 transition-colors"
                          >
                            <td className="py-1.5 px-2">
                              <DriverPill tla={d.tla} teamColor={d.team_color} size="sm" />
                            </td>
                            <td
                              className="py-1.5 px-2 text-right font-timing text-xs text-white tabular-nums"
                              style={pctBg(d.selected_pct)}
                            >
                              {d.selected_pct.toFixed(1)}%
                            </td>
                            <td className="py-1.5 px-2 text-right font-timing text-xs tabular-nums">
                              <span className={selChange >= 0 ? 'text-f1-green' : 'text-f1-red'}>
                                {fmtChange(selChange)}
                              </span>
                            </td>
                            <td
                              className="py-1.5 px-2 text-right font-timing text-xs text-white tabular-nums"
                              style={pctBg(d.captain_pct)}
                            >
                              {d.captain_pct.toFixed(1)}%
                            </td>
                            <td className="py-1.5 px-2 text-right font-timing text-xs tabular-nums">
                              <span className={capChange >= 0 ? 'text-f1-green' : 'text-f1-red'}>
                                {fmtChange(capChange)}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              ) : (
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="text-[10px] text-f1-text-muted uppercase">
                      <th className="text-left py-1.5 px-2 font-semibold">CR</th>
                      <th className="text-right py-1.5 px-2 font-semibold">P%</th>
                      <th className="text-right py-1.5 px-2 font-semibold">+/-</th>
                    </tr>
                  </thead>
                  <tbody>
                    {constructorPicks.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="text-center text-f1-text-muted text-sm py-6">
                          No constructor data available
                        </td>
                      </tr>
                    ) : (
                      constructorPicks.map((c, idx) => {
                        const selChange = fakeChange(c.selected_pct, idx + 200);
                        return (
                          <tr
                            key={c.tla}
                            className="border-b border-f1-border/30 hover:bg-f1-elevated/20 transition-colors"
                          >
                            <td className="py-1.5 px-2">
                              <ConstructorPill tla={c.tla} teamColor={c.team_color} size="sm" />
                            </td>
                            <td
                              className="py-1.5 px-2 text-right font-timing text-xs text-white tabular-nums"
                              style={pctBg(c.selected_pct)}
                            >
                              {c.selected_pct.toFixed(1)}%
                            </td>
                            <td className="py-1.5 px-2 text-right font-timing text-xs tabular-nums">
                              <span className={selChange >= 0 ? 'text-f1-green' : 'text-f1-red'}>
                                {fmtChange(selChange)}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN: Chip Usage ── */}
        <div className="w-[420px] shrink-0">
          <div className="bg-f1-surface rounded-xl border border-f1-border p-4 space-y-3">
            {/* Header */}
            <div className="flex items-center gap-3 flex-wrap">
              <svg className="w-5 h-5 text-f1-yellow shrink-0" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.27 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z" />
              </svg>
              <h2 className="text-sm font-bold text-f1-text font-[var(--font-display)] uppercase tracking-wider">
                Chip Usage
              </h2>
              <SearchBar
                placeholder="Find a race... (e.g. R3+AUS)"
                value={chipSearch}
                onChange={setChipSearch}
                className="ml-auto max-w-[200px] !py-1 !text-xs"
              />
            </div>

            {/* Sample data notice */}
            <div className="flex items-center gap-1.5">
              <p className="text-[10px] text-f1-text-muted uppercase tracking-widest">
                {activeDatasetLabel}
              </p>
              <span className="text-[10px] bg-f1-yellow/20 text-f1-yellow px-1.5 py-0.5 rounded font-semibold uppercase">
                Sample Data
              </span>
            </div>

            {/* Chip table */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="text-[10px] text-f1-text-muted uppercase">
                    <th className="text-left py-1.5 px-1.5 font-semibold">Race</th>
                    {CHIP_KEYS.map((chip) => (
                      <th key={chip} className="text-right py-1.5 px-1.5 font-semibold">
                        {chip}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {chipRows.map((row) => (
                    <tr
                      key={row.round}
                      className="border-b border-f1-border/30 hover:bg-f1-elevated/20 transition-colors"
                    >
                      <td className="py-1 px-1.5 text-xs text-f1-text font-timing whitespace-nowrap">
                        <span className="text-f1-text-muted">R{row.round}</span>
                        {row.countryCode && (
                          <span className="ml-1">{countryFlag(row.countryCode)}</span>
                        )}
                      </td>
                      {CHIP_KEYS.map((chip) => (
                        <td
                          key={chip}
                          className="py-1 px-1.5 text-right font-timing text-xs text-white tabular-nums"
                          style={pctBg(row[chip])}
                        >
                          {row[chip].toFixed(1)}%
                        </td>
                      ))}
                    </tr>
                  ))}

                  {/* Total row */}
                  <tr className="border-t border-f1-border bg-f1-elevated/20">
                    <td className="py-1.5 px-1.5 text-xs text-f1-text font-bold font-timing">
                      Total
                    </td>
                    {CHIP_KEYS.map((chip) => (
                      <td
                        key={chip}
                        className="py-1.5 px-1.5 text-right font-timing text-xs text-white font-bold tabular-nums"
                        style={pctBg(chipTotals[chip] / 24)}
                      >
                        {chipTotals[chip].toFixed(1)}%
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
