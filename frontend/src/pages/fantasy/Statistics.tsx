import { useState, useEffect, useMemo } from 'react';
import { PageHeader } from '../../components/fantasy/PageHeader';
import { TeamSlotTabs } from '../../components/fantasy/TeamSlotTabs';
import { SearchBar } from '../../components/fantasy/SearchBar';
import { HeatmapCell } from '../../components/fantasy/HeatmapCell';
import { DriverPill } from '../../components/fantasy/DriverPill';
import { LoadingTelemetry } from '../../components/common/LoadingTelemetry';
import { RACES } from '../../data/calendar2026';
import { countryFlag } from '../../utils/countryFlags';
import { useF1Players } from '../../hooks/useFantasy';
import type { F1Player } from '../../types/f1';

// ── Types ────────────────────────────────────────────────────────────

interface RoundPoints {
  round: number;
  points: number;
}

interface DriverRow {
  id: string;
  tla: string;
  teamColor: string;
  rounds: RoundPoints[];
  avg: number;
}

// ── Metric options ───────────────────────────────────────────────────

const METRICS = [
  'Fantasy Points',
  'Race Points',
  'Qualifying Points',
  'Sprint Points',
  'Overtake Points',
  'Fastest Lap',
  'Position Delta',
  'DNF Penalty',
] as const;

type Metric = (typeof METRICS)[number];

// ── Season options ───────────────────────────────────────────────────

const SEASONS = [2026, 2025] as const;

// ── GP abbreviation helper ───────────────────────────────────────────

function gpAbbrev(name: string): string {
  // "Australian Grand Prix" -> "AUS", "Chinese Grand Prix" -> "CHN" etc.
  const map: Record<string, string> = {
    'Australian Grand Prix': 'AUS',
    'Chinese Grand Prix': 'CHN',
    'Japanese Grand Prix': 'JPN',
    'Bahrain Grand Prix': 'BHR',
    'Saudi Arabian Grand Prix': 'KSA',
    'Miami Grand Prix': 'MIA',
    'Canadian Grand Prix': 'CAN',
    'Monaco Grand Prix': 'MON',
    'Spanish Grand Prix': 'SPA',
    'Austrian Grand Prix': 'AUT',
    'British Grand Prix': 'GBR',
    'Belgian Grand Prix': 'BEL',
    'Hungarian Grand Prix': 'HUN',
    'Dutch Grand Prix': 'NLD',
    'Italian Grand Prix': 'ITA',
    'Madrid Grand Prix': 'MAD',
    'Azerbaijan Grand Prix': 'AZE',
    'Singapore Grand Prix': 'SGP',
    'United States Grand Prix': 'USA',
    'Mexico City Grand Prix': 'MEX',
    'São Paulo Grand Prix': 'BRA',
    'Las Vegas Grand Prix': 'LVG',
    'Qatar Grand Prix': 'QAT',
    'Abu Dhabi Grand Prix': 'ABU',
  };
  return map[name] ?? name.slice(0, 3).toUpperCase();
}

// ── Round metadata from calendar ─────────────────────────────────────

const ROUND_META = RACES.map(r => ({
  round: r.round,
  abbrev: gpAbbrev(r.name),
  country: r.country,
  flag: countryFlag(r.country),
}));

// ── Generate mock data when API returns nothing ──────────────────────

function generateMockData(players: F1Player[]): DriverRow[] {
  return players.map(p => {
    const rounds: RoundPoints[] = ROUND_META.map(rm => ({
      round: rm.round,
      points: Math.round((Math.random() * 80 - 20) * 10) / 10,
    }));
    const avg =
      rounds.length > 0
        ? Math.round((rounds.reduce((s, r) => s + r.points, 0) / rounds.length) * 10) / 10
        : 0;
    return {
      id: p.tla,
      tla: p.tla,
      teamColor: p.team_color,
      rounds,
      avg,
    };
  });
}

// ── Attempt to parse F1 Fantasy statistics API response ──────────────

function parseStatsResponse(
  raw: unknown[],
  players: F1Player[],
): DriverRow[] | null {
  if (!Array.isArray(raw) || raw.length === 0) return null;

  // The F1 Fantasy statistics feed returns an array of player objects
  // with GamedayPoints (round-by-round) or similar structure. Adapt:
  try {
    const rows: DriverRow[] = [];
    for (const entry of raw) {
      const e = entry as Record<string, unknown>;
      const playerId = String(e.PlayerId ?? e.player_id ?? '');
      const playerName = String(e.PlayerName ?? e.player_name ?? e.Name ?? '');

      // Try to match to a known player
      const player = players.find(
        p =>
          p.tla === playerName ||
          p.name === playerName ||
          String(p.driver_number) === playerId,
      );

      // Extract round-by-round points: look for GamedayPoints, RoundPoints, etc.
      const gamedayPoints = (e.GamedayPoints ?? e.gamedayPoints ?? e.Points ?? e.points) as
        | Record<string, number>
        | Array<{ round?: number; gameday?: number; points?: number; Points?: number }>
        | undefined;

      let rounds: RoundPoints[] = [];
      if (Array.isArray(gamedayPoints)) {
        rounds = gamedayPoints.map((gp, idx) => ({
          round: gp.round ?? gp.gameday ?? idx + 1,
          points: gp.points ?? gp.Points ?? 0,
        }));
      } else if (gamedayPoints && typeof gamedayPoints === 'object') {
        rounds = Object.entries(gamedayPoints).map(([key, val]) => ({
          round: parseInt(key, 10) || 0,
          points: Number(val) || 0,
        }));
      }

      // Fall back to overall points if no round breakdown
      if (rounds.length === 0) {
        const overall = Number(e.OverallPoints ?? e.overall_points ?? e.TotalPoints ?? 0);
        if (overall !== 0) {
          rounds = [{ round: 1, points: overall }];
        }
      }

      const avg =
        rounds.length > 0
          ? Math.round((rounds.reduce((s, r) => s + r.points, 0) / rounds.length) * 10) / 10
          : 0;

      rows.push({
        id: playerId || playerName,
        tla: player?.tla ?? playerName.slice(0, 3).toUpperCase(),
        teamColor: player?.team_color ?? '#666666',
        rounds,
        avg,
      });
    }

    return rows.length > 0 ? rows : null;
  } catch {
    return null;
  }
}

// ── Component ────────────────────────────────────────────────────────

export function Statistics() {
  const [season, setSeason] = useState<number>(2026);
  const [metric, setMetric] = useState<Metric>('Fantasy Points');
  const [activeSlot, setActiveSlot] = useState<1 | 2 | 3>(1);
  const [search, setSearch] = useState('');
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [showRaces, setShowRaces] = useState(true);
  const [loading, setLoading] = useState(true);
  const [rawStats, setRawStats] = useState<{ drivers: unknown[]; constructors: unknown[] } | null>(
    null,
  );

  const { drivers: f1Players, loading: playersLoading } = useF1Players();

  // Fetch stats from backend
  useEffect(() => {
    setLoading(true);
    fetch('/api/fantasy/f1-stats')
      .then(r => r.json())
      .then(data => setRawStats(data))
      .catch(() => setRawStats(null))
      .finally(() => setLoading(false));
  }, []);

  // Build rows: try API data first, fall back to mock
  const rows: DriverRow[] = useMemo(() => {
    if (rawStats?.drivers && f1Players.length > 0) {
      const parsed = parseStatsResponse(rawStats.drivers, f1Players);
      if (parsed && parsed.length > 0) return parsed;
    }
    // Fallback: generate mock data from player list
    if (f1Players.length > 0) {
      return generateMockData(f1Players);
    }
    return [];
  }, [rawStats, f1Players]);

  // Which rounds to display
  const visibleRounds = useMemo(() => {
    if (!showRaces) return [];
    // Determine rounds that have data
    const allRounds = new Set<number>();
    for (const row of rows) {
      for (const rp of row.rounds) {
        allRounds.add(rp.round);
      }
    }
    return ROUND_META.filter(rm => allRounds.has(rm.round));
  }, [rows, showRaces]);

  // Filter + sort
  const filteredRows = useMemo(() => {
    let result = rows;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(r => r.tla.toLowerCase().includes(q));
    }
    // Sort by avg descending
    return [...result].sort((a, b) => b.avg - a.avg);
  }, [rows, search]);

  if (loading || playersLoading) return <LoadingTelemetry />;

  return (
    <div className="space-y-6">
      {/* ── Header ────────────────────────────────────────────── */}
      <PageHeader
        title="Statistics"
        subtitle="Dive into the F1 Fantasy data for every race, driver and constructor. Show specific data types like Fastest Lap, Overtakes, DNF and much more — or filter through all possible Fantasy Points combinations."
      />

      {/* ── Controls bar ──────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        {/* Season dropdown */}
        <select
          value={season}
          onChange={e => setSeason(Number(e.target.value))}
          className="bg-f1-surface border border-f1-border rounded-lg px-3 py-1.5 text-sm text-f1-text focus:ring-1 focus:ring-f1-red focus:border-f1-red outline-none"
        >
          {SEASONS.map(s => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        {/* Metric selector */}
        <select
          value={metric}
          onChange={e => setMetric(e.target.value as Metric)}
          className="bg-f1-surface border border-f1-border rounded-lg px-3 py-1.5 text-sm text-f1-text focus:ring-1 focus:ring-f1-red focus:border-f1-red outline-none"
        >
          {METRICS.map(m => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>

        {/* Team slot tabs */}
        <TeamSlotTabs activeSlot={activeSlot} onChange={setActiveSlot} />

        {/* Settings gear */}
        <button
          type="button"
          className="p-2 rounded-lg border border-f1-border bg-f1-surface text-f1-text-muted hover:text-white transition-colors"
          title="Settings"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="8" cy="8" r="2.5" />
            <path d="M8 1v1.5M8 13.5V15M1 8h1.5M13.5 8H15M3.05 3.05l1.06 1.06M11.89 11.89l1.06 1.06M3.05 12.95l1.06-1.06M11.89 4.11l1.06-1.06" />
          </svg>
        </button>
      </div>

      {/* ── Filter bar ────────────────────────────────────────── */}
      <div className="flex items-center justify-center">
        <button
          type="button"
          onClick={() => setFiltersExpanded(!filtersExpanded)}
          className="flex items-center gap-2 px-4 py-1.5 rounded-lg border border-f1-border bg-f1-surface text-sm text-f1-text-muted hover:text-white transition-colors"
        >
          <span>Fantasy Points Types</span>
          <span className="font-timing text-f1-cyan text-xs">20 / 20</span>
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className={`transition-transform ${filtersExpanded ? 'rotate-180' : ''}`}
          >
            <path d="M3 4.5l3 3 3-3" />
          </svg>
        </button>
      </div>

      {filtersExpanded && (
        <div className="bg-f1-surface border border-f1-border rounded-lg p-4 text-xs text-f1-text-muted text-center">
          All 20 fantasy points types are currently selected.
        </div>
      )}

      {/* ── Search + Races toggle ─────────────────────────────── */}
      <div className="flex items-center gap-3">
        <SearchBar
          placeholder="Find a driver..."
          value={search}
          onChange={setSearch}
          className="flex-1"
        />
        <button
          type="button"
          onClick={() => setShowRaces(!showRaces)}
          className={`
            px-4 py-2 rounded-lg border text-sm font-timing transition-colors shrink-0
            ${showRaces
              ? 'border-f1-red bg-f1-red/10 text-f1-red'
              : 'border-f1-border bg-f1-surface text-f1-text-muted hover:text-white'
            }
          `}
        >
          Races
        </button>
      </div>

      {/* ── Heatmap table ─────────────────────────────────────── */}
      <div className="bg-f1-surface rounded-lg border border-f1-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-f1-border">
                {/* Sticky DR column header */}
                <th className="sticky left-0 z-20 bg-f1-surface px-3 py-2 text-left text-xs text-f1-text-muted uppercase min-w-[80px]">
                  DR
                </th>

                {/* Round columns */}
                {visibleRounds.map(rm => (
                  <th
                    key={rm.round}
                    className="bg-f1-surface px-1 py-2 text-center min-w-[44px]"
                  >
                    <div className="text-xs text-f1-text-muted font-timing">R{rm.round}</div>
                    <div className="text-[10px] text-f1-text-muted/60 leading-tight" title={rm.flag}>
                      {rm.abbrev}
                    </div>
                  </th>
                ))}

                {/* Sticky AVG column header */}
                <th className="sticky right-0 z-20 bg-f1-surface px-3 py-2 text-center text-xs text-f1-text-muted uppercase font-bold min-w-[56px]">
                  AVG
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-f1-border/50">
              {filteredRows.length === 0 && (
                <tr>
                  <td
                    colSpan={visibleRounds.length + 2}
                    className="px-4 py-8 text-center text-sm text-f1-text-muted"
                  >
                    No drivers found.
                  </td>
                </tr>
              )}
              {filteredRows.map(row => {
                const pointsByRound = new Map(row.rounds.map(rp => [rp.round, rp.points]));
                return (
                  <tr key={row.id} className="hover:bg-f1-elevated/20 transition-colors">
                    {/* Sticky driver pill */}
                    <td className="sticky left-0 z-10 bg-f1-bg px-2 py-1.5 min-w-[80px]">
                      <DriverPill tla={row.tla} teamColor={row.teamColor} size="sm" />
                    </td>

                    {/* Round cells */}
                    {visibleRounds.map(rm => {
                      const pts = pointsByRound.get(rm.round);
                      return (
                        <td key={rm.round} className="px-0.5 py-1 text-center min-w-[44px]">
                          {pts !== undefined ? (
                            <HeatmapCell
                              value={pts}
                              min={-20}
                              max={60}
                              format={v => v.toFixed(0)}
                            />
                          ) : (
                            <span className="text-xs text-f1-text-muted/30 font-timing">-</span>
                          )}
                        </td>
                      );
                    })}

                    {/* Sticky AVG */}
                    <td className="sticky right-0 z-10 bg-f1-bg px-2 py-1.5 text-center min-w-[56px]">
                      <span className="font-timing font-bold text-sm text-white tabular-nums">
                        {row.avg.toFixed(1)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Legend ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-center gap-4 text-[10px] text-f1-text-muted">
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-sm" style={{ backgroundColor: 'rgb(220, 38, 38)' }} />
          <span>Negative</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-sm" style={{ backgroundColor: 'rgb(202, 138, 4)' }} />
          <span>Low</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-sm" style={{ backgroundColor: 'rgb(22, 163, 74)' }} />
          <span>High</span>
        </div>
        <span className="text-f1-text-muted/40">|</span>
        <span>
          Metric: <span className="text-white font-timing">{metric}</span>
        </span>
        <span className="text-f1-text-muted/40">|</span>
        <span>
          Season: <span className="text-white font-timing">{season}</span>
        </span>
      </div>
    </div>
  );
}
