import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useLiveFantasyScoring, type ScoredDriver } from '../../hooks/useLiveFantasyScoring';
import { useF1Players, useFantasy, type SavedTeam } from '../../hooks/useFantasy';
import { DriverPill } from '../../components/fantasy/DriverPill';
import { ConstructorPill } from '../../components/fantasy/ConstructorPill';
import { SearchBar } from '../../components/fantasy/SearchBar';
import { TeamCard } from '../../components/fantasy/TeamCard';
import type { F1Player } from '../../types/f1';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function signedStr(v: number): string {
  if (v > 0) return `+${v}`;
  return String(v);
}

function colorClass(v: number): string {
  if (v > 0) return 'text-[#16A34A]';
  if (v < 0) return 'text-[#DC2626]';
  return 'text-white';
}

function priceDeltaStr(v: number): string {
  if (v === 0) return '-';
  return `${v > 0 ? '+' : ''}${v.toFixed(1)}`;
}

function cellBg(v: number): string {
  if (v > 0) return 'bg-[#16A34A]/10';
  if (v < 0) return 'bg-[#DC2626]/10';
  return '';
}

// ---------------------------------------------------------------------------
// SessionBar
// ---------------------------------------------------------------------------

function SessionBar({
  sessionInfo,
  connectionStatus,
}: {
  sessionInfo: ScoredDriver extends never ? never : ReturnType<typeof useLiveFantasyScoring>['sessionInfo'];
  connectionStatus: string;
}) {
  return (
    <div className="flex items-center justify-between bg-f1-surface border border-f1-border rounded-lg px-4 py-2.5">
      <div className="flex items-center gap-3">
        <span className="text-sm font-bold font-[var(--font-display)] text-white uppercase tracking-wide">
          Live Scoring
        </span>
        {sessionInfo && (
          <>
            <span className="w-px h-4 bg-f1-border" />
            <span className="text-xs text-f1-text-muted">
              {sessionInfo.circuit_short_name}
            </span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold font-timing bg-f1-elevated text-white">
              {sessionInfo.session_name}
            </span>
          </>
        )}
      </div>
      <div className="flex items-center gap-2">
        <div
          className={`w-2 h-2 rounded-full ${
            connectionStatus === 'connected'
              ? 'bg-f1-green'
              : connectionStatus === 'connecting'
                ? 'bg-f1-yellow animate-pulse'
                : 'bg-f1-red'
          }`}
        />
        <span className="text-[10px] text-f1-text-muted uppercase font-timing">
          {connectionStatus}
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Merged driver row type
// ---------------------------------------------------------------------------

interface MergedDriver extends ScoredDriver {
  price?: number;
  priceChange?: number;
}

function mergeDriversWithPlayers(
  scored: ScoredDriver[],
  apiPlayers: F1Player[],
): MergedDriver[] {
  const playerByTla = new Map<string, F1Player>();
  for (const p of apiPlayers) {
    playerByTla.set(p.tla, p);
  }
  return scored.map((d) => {
    const ap = playerByTla.get(d.name_acronym);
    return {
      ...d,
      price: ap?.price,
      priceChange: ap?.price_change,
    };
  });
}

// ---------------------------------------------------------------------------
// Merged constructor row type (from F1 API only — no live scoring for constructors yet)
// ---------------------------------------------------------------------------

interface ConstructorRow {
  tla: string;
  teamColor: string;
  name: string;
  price: number;
  priceChange: number;
  overallPoints: number;
  gamedayPoints: number;
}

function buildConstructorRows(apiConstructors: F1Player[]): ConstructorRow[] {
  return apiConstructors
    .filter((c) => c.is_active)
    .map((c) => ({
      tla: c.tla,
      teamColor: c.team_color.startsWith('#') ? c.team_color : `#${c.team_color}`,
      name: c.name,
      price: c.price,
      priceChange: c.price_change,
      overallPoints: c.overall_points,
      gamedayPoints: c.gameday_points,
    }))
    .sort((a, b) => b.overallPoints - a.overallPoints);
}

// ---------------------------------------------------------------------------
// DriversTable
// ---------------------------------------------------------------------------

function DriversTable({ rows }: { rows: MergedDriver[] }) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search) return rows;
    const q = search.toLowerCase();
    return rows.filter(
      (d) =>
        d.name_acronym.toLowerCase().includes(q) ||
        d.team_name.toLowerCase().includes(q) ||
        (d.full_name && d.full_name.toLowerCase().includes(q)),
    );
  }, [rows, search]);

  const thBase = 'px-2 py-1.5 text-[10px] text-f1-text-muted uppercase font-semibold whitespace-nowrap';

  return (
    <div className="bg-f1-surface border border-f1-border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-f1-border">
        <svg className="w-4 h-4 text-f1-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        <span className="text-sm font-bold font-[var(--font-display)] text-white uppercase">
          Drivers
        </span>
        <div className="flex-1 max-w-[200px] ml-auto">
          <SearchBar
            placeholder="Search drivers..."
            value={search}
            onChange={setSearch}
            className="!py-1 !text-xs"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-xs">
          <thead>
            {/* Group header row */}
            <tr className="border-b border-f1-border/50">
              <th className={`${thBase} text-left`} colSpan={2} />
              <th className={`${thBase} text-center`} />
              <th
                className={`${thBase} text-center border-l border-f1-border/30`}
                colSpan={1}
              >
                Qualifying
              </th>
              <th
                className={`${thBase} text-center border-l border-f1-border/30`}
                colSpan={5}
              >
                Race
              </th>
            </tr>
            {/* Individual column headers */}
            <tr className="border-b border-f1-border">
              <th className={`${thBase} text-left w-[120px]`}>DR</th>
              <th className={`${thBase} text-center w-[52px]`}>TOT</th>
              <th className={`${thBase} text-center w-[52px]`}>Delta$</th>
              <th className={`${thBase} text-center w-[40px] border-l border-f1-border/30`}>POS</th>
              <th className={`${thBase} text-center w-[40px] border-l border-f1-border/30`}>POS</th>
              <th className={`${thBase} text-center w-[36px]`}>PG</th>
              <th className={`${thBase} text-center w-[36px]`}>OV</th>
              <th className={`${thBase} text-center w-[32px]`}>FL</th>
              <th className={`${thBase} text-center w-[32px]`}>DD</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center text-f1-text-muted text-sm py-6">
                  No drivers
                </td>
              </tr>
            ) : (
              filtered.map((d) => {
                const teamColor = d.team_colour
                  ? d.team_colour.startsWith('#') ? d.team_colour : `#${d.team_colour}`
                  : '#555';
                return (
                  <tr
                    key={d.driver_number}
                    className={`border-b border-f1-border/20 transition-colors ${
                      d.isMyTeam
                        ? 'bg-f1-cyan/5 border-l-2 border-l-f1-cyan'
                        : 'hover:bg-f1-elevated/30'
                    } ${d.is_dnf ? 'opacity-50' : ''}`}
                  >
                    {/* DR — DriverPill */}
                    <td className="px-2 py-1">
                      <div className="flex items-center gap-1.5">
                        <DriverPill tla={d.name_acronym} teamColor={teamColor} size="sm" />
                        {d.isMyTeam && (
                          <span className="text-[8px] font-bold bg-f1-cyan/20 text-f1-cyan rounded px-1 leading-relaxed">
                            MY
                          </span>
                        )}
                        {d.is_dnf && (
                          <span className="text-[8px] font-bold bg-f1-red/20 text-f1-red rounded px-1 leading-relaxed">
                            DNF
                          </span>
                        )}
                      </div>
                    </td>
                    {/* TOT */}
                    <td className={`px-2 py-1 text-center font-timing font-bold text-white`}>
                      {d.breakdown.total}
                    </td>
                    {/* Delta$ */}
                    <td className={`px-2 py-1 text-center font-timing ${d.priceChange ? colorClass(d.priceChange) : 'text-f1-text-muted'}`}>
                      {d.priceChange != null ? priceDeltaStr(d.priceChange) : '-'}
                    </td>
                    {/* Q POS */}
                    <td className={`px-2 py-1 text-center font-timing border-l border-f1-border/20 ${cellBg(d.breakdown.qualifyingPoints)}`}>
                      <span className={colorClass(d.breakdown.qualifyingPoints)}>
                        {d.grid_position ?? '-'}
                      </span>
                    </td>
                    {/* Race POS */}
                    <td className={`px-2 py-1 text-center font-timing border-l border-f1-border/20 ${cellBg(d.breakdown.racePoints)}`}>
                      <span className="text-white">
                        {d.position ?? '-'}
                      </span>
                    </td>
                    {/* PG (positions gained) */}
                    <td className={`px-2 py-1 text-center font-timing ${cellBg(d.breakdown.positionDelta)}`}>
                      <span className={colorClass(d.breakdown.positionDelta)}>
                        {d.breakdown.positionDelta !== 0 ? signedStr(d.breakdown.positionDelta) : '-'}
                      </span>
                    </td>
                    {/* OV (overtakes — not tracked in live) */}
                    <td className="px-2 py-1 text-center font-timing text-f1-text-muted">
                      {d.breakdown.overtakePoints > 0 ? d.breakdown.overtakePoints : '-'}
                    </td>
                    {/* FL */}
                    <td className="px-2 py-1 text-center">
                      {d.has_fastest_lap ? (
                        <span className="text-f1-purple font-bold text-[10px]">FL</span>
                      ) : (
                        <span className="text-f1-text-muted">-</span>
                      )}
                    </td>
                    {/* DD (DOTD — not tracked in live) */}
                    <td className="px-2 py-1 text-center text-f1-text-muted">
                      {d.breakdown.dotdBonus > 0 ? (
                        <span className="text-f1-cyan font-bold text-[10px]">DD</span>
                      ) : (
                        <span>-</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ConstructorsTable
// ---------------------------------------------------------------------------

function ConstructorsTable({ rows }: { rows: ConstructorRow[] }) {
  const thBase = 'px-2 py-1.5 text-[10px] text-f1-text-muted uppercase font-semibold whitespace-nowrap';

  if (rows.length === 0) return null;

  return (
    <div className="bg-f1-surface border border-f1-border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-f1-border">
        <svg className="w-4 h-4 text-f1-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
        <span className="text-sm font-bold font-[var(--font-display)] text-white uppercase">
          Constructors
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="border-b border-f1-border">
              <th className={`${thBase} text-left w-[120px]`}>CR</th>
              <th className={`${thBase} text-center w-[52px]`}>TOT</th>
              <th className={`${thBase} text-center w-[52px]`}>Delta$</th>
              <th className={`${thBase} text-center w-[52px]`}>GD</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.tla} className="border-b border-f1-border/20 hover:bg-f1-elevated/30 transition-colors">
                <td className="px-2 py-1">
                  <ConstructorPill tla={c.tla} teamColor={c.teamColor} size="sm" />
                </td>
                <td className="px-2 py-1 text-center font-timing font-bold text-white">
                  {c.overallPoints}
                </td>
                <td className={`px-2 py-1 text-center font-timing ${colorClass(c.priceChange)}`}>
                  {priceDeltaStr(c.priceChange)}
                </td>
                <td className={`px-2 py-1 text-center font-timing ${colorClass(c.gamedayPoints)}`}>
                  {c.gamedayPoints || '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// TeamsPanel
// ---------------------------------------------------------------------------

function TeamsPanel({
  savedTeams,
  fantasyDrivers,
  fantasyConstructors,
  apiDrivers,
  apiConstructors,
  isLoading,
}: {
  savedTeams: SavedTeam[];
  fantasyDrivers: ReturnType<typeof useFantasy>['drivers'];
  fantasyConstructors: ReturnType<typeof useFantasy>['constructors'];
  apiDrivers: F1Player[];
  apiConstructors: F1Player[];
  isLoading: boolean;
}) {
  // Map driver_number -> api player for price / points
  const driverByNumber = useMemo(() => {
    const m = new Map<number, F1Player>();
    for (const p of apiDrivers) {
      if (p.driver_number != null) m.set(p.driver_number, p);
    }
    return m;
  }, [apiDrivers]);

  // Map constructor_id -> api player
  const constructorById = useMemo(() => {
    const m = new Map<string, F1Player>();
    for (const c of apiConstructors) {
      if (c.constructor_id) m.set(c.constructor_id, c);
    }
    // Also try by TLA / name for fuzzy matching
    for (const c of apiConstructors) {
      m.set(c.tla.toLowerCase(), c);
      m.set(c.name.toLowerCase(), c);
    }
    return m;
  }, [apiConstructors]);

  // Fantasy driver lookup by number for TLA / team color
  const fantasyDriverByNumber = useMemo(() => {
    const m = new Map<number, (typeof fantasyDrivers)[number]>();
    for (const d of fantasyDrivers) m.set(d.driver_number, d);
    return m;
  }, [fantasyDrivers]);

  // Fantasy constructor lookup
  const fantasyConstructorById = useMemo(() => {
    const m = new Map<string, (typeof fantasyConstructors)[number]>();
    for (const c of fantasyConstructors) m.set(c.constructor_id, c);
    return m;
  }, [fantasyConstructors]);

  if (isLoading) {
    return (
      <div className="bg-f1-surface border border-f1-border rounded-lg p-4">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-f1-elevated rounded w-1/3" />
          <div className="h-20 bg-f1-elevated rounded" />
          <div className="h-20 bg-f1-elevated rounded" />
        </div>
      </div>
    );
  }

  if (savedTeams.length === 0) {
    return (
      <div className="bg-f1-surface border border-f1-border rounded-lg p-4">
        <h3 className="text-sm font-bold font-[var(--font-display)] text-white uppercase mb-2">Teams</h3>
        <p className="text-xs text-f1-text-muted">
          No saved teams. <Link to="/fantasy/enter-team" className="text-f1-cyan hover:underline">Build a team</Link> to track your score.
        </p>
      </div>
    );
  }

  function resolveDriver(driverNum: number, team: SavedTeam) {
    const fd = fantasyDriverByNumber.get(driverNum);
    const ap = driverByNumber.get(driverNum);
    const tla = fd?.name_acronym ?? ap?.tla ?? String(driverNum);
    const rawColor = fd?.team_name
      ? undefined
      : ap?.team_color;
    const teamColor = rawColor
      ? (rawColor.startsWith('#') ? rawColor : `#${rawColor}`)
      : '#888';
    return {
      tla,
      teamColor: fd ? getColorForTeamName(fd.team_name) : teamColor,
      points: ap?.gameday_points ?? 0,
      priceChange: ap?.price_change,
      chipMultiplier: (team.drs_boost_driver === driverNum ? 'x2' : undefined) as 'x2' | undefined,
    };
  }

  function resolveConstructor(cId: string) {
    const fc = fantasyConstructorById.get(cId);
    const ap = constructorById.get(cId) ?? constructorById.get(cId.toLowerCase());
    const tla = fc?.name ?? ap?.tla ?? cId.toUpperCase().slice(0, 3);
    const rawColor = fc?.color ?? ap?.team_color ?? '#888';
    const teamColor = rawColor.startsWith('#') ? rawColor : `#${rawColor}`;
    return {
      tla: tla.length > 4 ? tla.slice(0, 3).toUpperCase() : tla.toUpperCase(),
      teamColor,
      points: ap?.gameday_points ?? 0,
      priceChange: ap?.price_change,
    };
  }

  return (
    <div className="bg-f1-surface border border-f1-border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-f1-border">
        <svg className="w-4 h-4 text-f1-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span className="text-sm font-bold font-[var(--font-display)] text-white uppercase">
          My Teams
        </span>
      </div>

      <div className="p-2 space-y-2">
        {savedTeams.map((team) => {
          const constructorPlayers = team.constructors.map((cId) => resolveConstructor(cId));
          const driverPlayers = team.drivers.map((dn) => resolveDriver(dn, team));
          const totalPts = [...constructorPlayers, ...driverPlayers].reduce(
            (sum, p) => sum + p.points,
            0,
          );
          const totalDelta = [...constructorPlayers, ...driverPlayers].reduce(
            (sum, p) => sum + (p.priceChange ?? 0),
            0,
          );

          return (
            <TeamCard
              key={team.team_number}
              teamNumber={team.team_number as 1 | 2 | 3}
              constructors={constructorPlayers}
              drivers={driverPlayers}
              chipLabel={team.active_chip ?? undefined}
              totalDelta={totalDelta}
              totalPoints={totalPts}
            />
          );
        })}
      </div>
    </div>
  );
}

// Minimal color resolver from team name
function getColorForTeamName(teamName: string): string {
  const KNOWN: Record<string, string> = {
    mclaren: '#FF8000',
    ferrari: '#E8002D',
    'red bull': '#3671C6',
    'red bull racing': '#3671C6',
    mercedes: '#27F4D2',
    'aston martin': '#229971',
    alpine: '#0093CC',
    haas: '#B6BABD',
    'racing bulls': '#6692FF',
    williams: '#64C4FF',
    audi: '#00594F',
    cadillac: '#D4A96A',
  };
  const lower = teamName.toLowerCase();
  for (const [key, hex] of Object.entries(KNOWN)) {
    if (lower.includes(key)) return hex;
  }
  return '#888888';
}

// ---------------------------------------------------------------------------
// No-session state using F1 API data
// ---------------------------------------------------------------------------

function ApiOnlyDriversTable({ apiDrivers }: { apiDrivers: F1Player[] }) {
  const [search, setSearch] = useState('');

  const rows = useMemo(() => {
    const activeDrivers = apiDrivers.filter((d) => d.is_active);
    if (!search) return activeDrivers.sort((a, b) => b.overall_points - a.overall_points);
    const q = search.toLowerCase();
    return activeDrivers
      .filter(
        (d) =>
          d.tla.toLowerCase().includes(q) ||
          d.name.toLowerCase().includes(q) ||
          d.team_name.toLowerCase().includes(q),
      )
      .sort((a, b) => b.overall_points - a.overall_points);
  }, [apiDrivers, search]);

  const thBase = 'px-2 py-1.5 text-[10px] text-f1-text-muted uppercase font-semibold whitespace-nowrap';

  return (
    <div className="bg-f1-surface border border-f1-border rounded-lg overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-f1-border">
        <svg className="w-4 h-4 text-f1-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        <span className="text-sm font-bold font-[var(--font-display)] text-white uppercase">
          Drivers
        </span>
        <span className="text-[10px] text-f1-text-muted ml-1">(Season standings)</span>
        <div className="flex-1 max-w-[200px] ml-auto">
          <SearchBar
            placeholder="Search drivers..."
            value={search}
            onChange={setSearch}
            className="!py-1 !text-xs"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="border-b border-f1-border">
              <th className={`${thBase} text-left w-[120px]`}>DR</th>
              <th className={`${thBase} text-center w-[52px]`}>PTS</th>
              <th className={`${thBase} text-center w-[60px]`}>Price</th>
              <th className={`${thBase} text-center w-[52px]`}>Delta$</th>
              <th className={`${thBase} text-center w-[52px]`}>GD</th>
              <th className={`${thBase} text-center w-[44px]`}>Sel%</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((d) => {
              const teamColor = d.team_color.startsWith('#')
                ? d.team_color
                : `#${d.team_color}`;
              return (
                <tr key={d.tla} className="border-b border-f1-border/20 hover:bg-f1-elevated/30 transition-colors">
                  <td className="px-2 py-1">
                    <DriverPill tla={d.tla} teamColor={teamColor} size="sm" />
                  </td>
                  <td className="px-2 py-1 text-center font-timing font-bold text-white">
                    {d.overall_points}
                  </td>
                  <td className="px-2 py-1 text-center font-timing text-f1-yellow">
                    ${d.price.toFixed(1)}M
                  </td>
                  <td className={`px-2 py-1 text-center font-timing ${colorClass(d.price_change)}`}>
                    {priceDeltaStr(d.price_change)}
                  </td>
                  <td className={`px-2 py-1 text-center font-timing ${colorClass(d.gameday_points)}`}>
                    {d.gameday_points || '-'}
                  </td>
                  <td className="px-2 py-1 text-center font-timing text-f1-text-muted">
                    {d.selected_pct.toFixed(0)}%
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function LiveScoring() {
  const {
    scoredDrivers,
    myTeamDrivers: _myTeamDrivers,
    myTeamTotal: _myTeamTotal,
    myTeamConstructors: _myTeamConstructors,
    hasTeam: _hasTeam,
    isLoggedIn,
    sessionInfo,
    connectionStatus,
  } = useLiveFantasyScoring();

  const {
    drivers: apiDrivers,
    constructors: apiConstructors,
    loading: playersLoading,
  } = useF1Players();

  const {
    savedTeams,
    drivers: fantasyDrivers,
    constructors: fantasyConstructors,
    isLoading: fantasyLoading,
  } = useFantasy();

  const hasLiveData = scoredDrivers.length > 0;

  // Merge live + API data for drivers
  const mergedDrivers = useMemo(
    () => mergeDriversWithPlayers(scoredDrivers, apiDrivers),
    [scoredDrivers, apiDrivers],
  );

  // Build constructor rows from API data
  const constructorRows = useMemo(
    () => buildConstructorRows(apiConstructors),
    [apiConstructors],
  );

  return (
    <div className="space-y-4">
      {/* Session Bar */}
      <SessionBar sessionInfo={sessionInfo} connectionStatus={connectionStatus} />

      {/* Login prompt */}
      {!isLoggedIn && (
        <div className="bg-f1-surface rounded-lg border border-f1-border p-3 text-xs text-f1-text-muted">
          <Link to="/login" className="text-f1-cyan hover:underline">Log in</Link> and save a team to track your fantasy score live.
        </div>
      )}

      {/* 2-column layout */}
      <div className="flex gap-4">
        {/* Left column */}
        <div className="flex-1 min-w-0 space-y-4">
          {hasLiveData ? (
            <DriversTable rows={mergedDrivers} />
          ) : (
            <>
              {playersLoading ? (
                <div className="bg-f1-surface border border-f1-border rounded-lg p-8 text-center">
                  <div className="animate-pulse text-f1-text-muted text-sm">Loading player data...</div>
                </div>
              ) : apiDrivers.length > 0 ? (
                <>
                  <div className="bg-f1-elevated/50 border border-f1-border rounded-lg px-3 py-2 text-xs text-f1-text-muted flex items-center gap-2">
                    <svg className="w-3.5 h-3.5 text-f1-yellow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    No live session. Showing season data from the F1 Fantasy API.
                  </div>
                  <ApiOnlyDriversTable apiDrivers={apiDrivers} />
                </>
              ) : (
                <div className="bg-f1-surface border border-f1-border rounded-lg p-8 text-center">
                  <p className="text-f1-text-muted text-sm">
                    No live session data. Scoring will appear during a race.
                  </p>
                </div>
              )}
            </>
          )}

          {/* Constructors section */}
          <ConstructorsTable rows={constructorRows} />

          {/* Scoring legend */}
          <div className="text-[10px] text-f1-text-muted flex flex-wrap gap-x-4 gap-y-1 px-1">
            <span>Race: P1=25 ... P10=1</span>
            <span>Qual: P1=10 ... P10=1</span>
            <span>PG: +1/pos gained</span>
            <span>OV: +1/overtake</span>
            <span className="text-f1-purple">FL: +10</span>
            <span className="text-f1-cyan">DOTD: +10</span>
            <span className="text-f1-red">DNF: -20</span>
          </div>
        </div>

        {/* Right column */}
        <div className="w-[400px] shrink-0 space-y-4">
          <TeamsPanel
            savedTeams={savedTeams}
            fantasyDrivers={fantasyDrivers}
            fantasyConstructors={fantasyConstructors}
            apiDrivers={apiDrivers}
            apiConstructors={apiConstructors}
            isLoading={fantasyLoading}
          />
        </div>
      </div>
    </div>
  );
}
