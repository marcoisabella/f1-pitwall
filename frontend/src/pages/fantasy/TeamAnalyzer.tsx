import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useFantasy, useF1Players } from '../../hooks/useFantasy';
import { PageHeader } from '../../components/fantasy/PageHeader';
import { DriverPill } from '../../components/fantasy/DriverPill';
import { ConstructorPill } from '../../components/fantasy/ConstructorPill';
import { LoadingTelemetry } from '../../components/common/LoadingTelemetry';
import { RACES, getNextRace } from '../../data/calendar2026';
import type { SavedTeam } from '../../hooks/useFantasy';
import type { F1Player } from '../../types/f1';

// Country code to flag emoji
function countryFlag(code: string): string {
  if (!code || code.length !== 2) return '';
  const offset = 0x1f1e6;
  const a = code.toUpperCase().charCodeAt(0) - 65 + offset;
  const b = code.toUpperCase().charCodeAt(1) - 65 + offset;
  return String.fromCodePoint(a) + String.fromCodePoint(b);
}

// Determine which rounds have already happened
function getCompletedRounds(): number {
  const next = getNextRace();
  if (!next) return RACES.length; // season over
  return next.round - 1;
}

// Chip label styling
const CHIP_COLORS: Record<string, { bg: string; text: string }> = {
  x3: { bg: 'bg-f1-purple/20', text: 'text-f1-purple' },
  x2: { bg: 'bg-f1-cyan/20', text: 'text-f1-cyan' },
  limitless: { bg: 'bg-f1-green/20', text: 'text-f1-green' },
  no_negative: { bg: 'bg-f1-yellow/20', text: 'text-f1-yellow' },
  wildcard: { bg: 'bg-f1-red/20', text: 'text-f1-red' },
};

function ChipBadge({ chip }: { chip: string }) {
  const labels: Record<string, string> = {
    x3: 'X3',
    x2: 'X2',
    limitless: 'LL',
    no_negative: 'NN',
    wildcard: 'WC',
  };
  const style = CHIP_COLORS[chip] ?? { bg: 'bg-f1-purple/20', text: 'text-f1-purple' };
  return (
    <span className={`${style.bg} ${style.text} px-2 py-0.5 rounded text-xs font-bold font-timing`}>
      {labels[chip] ?? chip.toUpperCase()}
    </span>
  );
}

interface RoundCardProps {
  round: number;
  gpName: string;
  countryCode: string;
  chip: string | null;
  isExpanded: boolean;
  onToggle: () => void;
  hasData: boolean;
  team: SavedTeam | null;
  driverPlayers: F1Player[];
  constructorPlayers: F1Player[];
}

function RoundCard({
  round,
  gpName,
  countryCode,
  chip,
  isExpanded,
  onToggle,
  hasData,
  team,
  driverPlayers,
  constructorPlayers,
}: RoundCardProps) {
  return (
    <div className="border-b border-f1-border last:border-b-0">
      {/* Round header row */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center gap-3 cursor-pointer hover:bg-f1-elevated/30 transition-colors"
      >
        {/* Round label */}
        <span className="font-bold font-timing text-white text-sm min-w-[32px]">
          R{round}
        </span>

        {/* GP name + flag */}
        <span className="text-sm text-f1-text-muted flex items-center gap-1.5 flex-1 truncate">
          <span className="text-base leading-none">{countryFlag(countryCode)}</span>
          <span className="truncate">{gpName.replace(' Grand Prix', ' GP')}</span>
        </span>

        {/* Chip badge if used */}
        {chip && <ChipBadge chip={chip} />}

        {/* Points (placeholder for now) */}
        {hasData ? (
          <span className="font-timing text-white font-bold text-sm min-w-[40px] text-right">
            --
          </span>
        ) : (
          <span className="font-timing text-f1-text-muted text-sm min-w-[40px] text-right">
            --
          </span>
        )}

        {/* Cumulative (placeholder) */}
        <span className="font-timing text-f1-text-muted text-xs min-w-[40px] text-right">
          --
        </span>

        {/* Expand chevron */}
        <svg
          className={`w-4 h-4 text-f1-text-muted transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="px-4 pb-4">
          {hasData && team ? (
            <div className="space-y-3">
              {/* Constructors row */}
              <div>
                <div className="text-[10px] text-f1-text-muted uppercase mb-1.5">Constructors</div>
                <div className="flex flex-wrap gap-3">
                  {constructorPlayers.map((c) => (
                    <ConstructorPill
                      key={c.constructor_id ?? c.tla}
                      tla={c.tla}
                      teamColor={c.team_color}
                      price={c.price}
                      size="md"
                    />
                  ))}
                  {constructorPlayers.length === 0 && (
                    <span className="text-xs text-f1-text-muted italic">No constructors selected</span>
                  )}
                </div>
              </div>

              {/* Drivers row */}
              <div>
                <div className="text-[10px] text-f1-text-muted uppercase mb-1.5">Drivers</div>
                <div className="flex flex-wrap gap-3">
                  {driverPlayers.map((d) => (
                    <DriverPill
                      key={d.driver_number ?? d.tla}
                      tla={d.tla}
                      teamColor={d.team_color}
                      price={d.price}
                      chipMultiplier={
                        team.drs_boost_driver !== null && d.driver_number === team.drs_boost_driver
                          ? 'x2'
                          : undefined
                      }
                      size="md"
                    />
                  ))}
                  {driverPlayers.length === 0 && (
                    <span className="text-xs text-f1-text-muted italic">No drivers selected</span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="py-3 text-center">
              <span className="text-xs text-f1-text-muted italic">
                No historical data available yet. Your team changes will be tracked going forward.
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface TeamColumnProps {
  slotNumber: 1 | 2 | 3;
  team: SavedTeam | null;
  driverPlayers: F1Player[];
  constructorPlayers: F1Player[];
  completedRounds: number;
}

function TeamColumn({
  slotNumber,
  team,
  driverPlayers,
  constructorPlayers,
  completedRounds,
}: TeamColumnProps) {
  const [expandedRounds, setExpandedRounds] = useState<Set<number>>(() => {
    // Start with "current" round expanded if there's data
    if (team && (team.drivers.length > 0 || team.constructors.length > 0)) {
      return new Set([completedRounds + 1]);
    }
    return new Set<number>();
  });

  const [allExpanded, setAllExpanded] = useState(false);

  const toggleRound = (round: number) => {
    setExpandedRounds((prev) => {
      const next = new Set(prev);
      if (next.has(round)) {
        next.delete(round);
      } else {
        next.add(round);
      }
      return next;
    });
  };

  const toggleAll = () => {
    if (allExpanded) {
      setExpandedRounds(new Set());
    } else {
      setExpandedRounds(new Set(RACES.map((r) => r.round)));
    }
    setAllExpanded(!allExpanded);
  };

  const teamName = team?.name ?? `Team ${slotNumber}`;
  const hasTeam = team !== null && (team.drivers.length > 0 || team.constructors.length > 0);

  // Build round list in reverse chronological order
  // Show current round (next unraced or last completed + 1) with real data,
  // previous rounds as placeholders
  const currentRound = completedRounds + 1;

  // Only show rounds up to the current round (no future rounds)
  const roundsToShow = RACES.filter((r) => r.round <= currentRound);
  const reversedRounds = [...roundsToShow].reverse();

  return (
    <div className="bg-f1-surface rounded-xl border border-f1-border overflow-hidden flex flex-col">
      {/* Column header */}
      <div className="bg-f1-elevated p-3 flex items-center gap-3">
        {/* Team slot badge */}
        <div className="w-8 h-8 rounded-full bg-f1-border flex items-center justify-center text-white text-xs font-bold font-timing shrink-0">
          T{slotNumber}
        </div>
        <span className="text-sm font-semibold text-white truncate flex-1 font-[var(--font-display)]">
          {teamName}
        </span>
        <button
          type="button"
          onClick={toggleAll}
          className="text-[10px] text-f1-text-muted hover:text-white transition-colors shrink-0 uppercase tracking-wider"
        >
          {allExpanded ? 'Collapse all' : 'Expand all'}
        </button>
      </div>

      {/* Round timeline */}
      {!hasTeam ? (
        <div className="p-6 text-center">
          <p className="text-sm text-f1-text-muted mb-3">No team saved for slot T{slotNumber}.</p>
          <Link
            to="/fantasy/enter-team"
            className="text-xs text-f1-red hover:text-f1-red/80 transition-colors underline"
          >
            Enter a team
          </Link>
        </div>
      ) : (
        <div className="overflow-y-auto max-h-[600px]">
          {reversedRounds.map((race) => {
            const isCurrentRound = race.round === currentRound;
            return (
              <RoundCard
                key={race.round}
                round={race.round}
                gpName={race.name}
                countryCode={race.country}
                chip={isCurrentRound ? team.active_chip : null}
                isExpanded={expandedRounds.has(race.round)}
                onToggle={() => toggleRound(race.round)}
                hasData={isCurrentRound}
                team={isCurrentRound ? team : null}
                driverPlayers={isCurrentRound ? driverPlayers : []}
                constructorPlayers={isCurrentRound ? constructorPlayers : []}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

export function TeamAnalyzer() {
  const { savedTeams, isLoading: teamsLoading } = useFantasy();
  const { drivers: allDriverPlayers, constructors: allConstructorPlayers, loading: playersLoading } = useF1Players();
  const [season, setSeason] = useState(2026);

  const completedRounds = useMemo(() => getCompletedRounds(), []);

  // Map saved teams by slot number (1-indexed)
  const teamBySlot = useMemo(() => {
    const map: Record<number, SavedTeam> = {};
    for (const t of savedTeams) {
      map[t.team_number] = t;
    }
    return map;
  }, [savedTeams]);

  // Resolve player data for each slot
  const resolvedSlots = useMemo(() => {
    const slots: Array<{
      team: SavedTeam | null;
      drivers: F1Player[];
      constructors: F1Player[];
    }> = [];

    for (let slot = 1; slot <= 3; slot++) {
      const team = teamBySlot[slot] ?? null;
      let drivers: F1Player[] = [];
      let constructors: F1Player[] = [];

      if (team) {
        drivers = team.drivers
          .map((num) => allDriverPlayers.find((d) => d.driver_number === num))
          .filter((d): d is F1Player => d !== undefined);

        constructors = team.constructors
          .map((id) => allConstructorPlayers.find((c) => c.constructor_id === id))
          .filter((c): c is F1Player => c !== undefined);
      }

      slots.push({ team, drivers, constructors });
    }

    return slots;
  }, [teamBySlot, allDriverPlayers, allConstructorPlayers]);

  const isLoading = teamsLoading || playersLoading;

  if (isLoading) return <LoadingTelemetry />;

  const hasAnyTeam = savedTeams.length > 0 && savedTeams.some(
    (t) => t.drivers.length > 0 || t.constructors.length > 0
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Team Analyzer"
        subtitle="Analyze every decision you made during every F1 Fantasy season and see what the impact of those choices was. Compare yourself against the global rank one team and learn from the literal best."
      />

      {/* Controls bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {/* Season dropdown */}
          <select
            value={season}
            onChange={(e) => setSeason(Number(e.target.value))}
            className="bg-f1-surface border border-f1-border text-white text-sm rounded-lg px-3 py-1.5 font-timing focus:ring-1 focus:ring-f1-red focus:outline-none"
          >
            <option value={2026}>2026</option>
            <option value={2025}>2025</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          {/* Settings button */}
          <button
            type="button"
            className="p-2 rounded-lg bg-f1-surface border border-f1-border text-f1-text-muted hover:text-white transition-colors"
            title="Settings"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Empty state if no teams at all */}
      {!hasAnyTeam ? (
        <div className="bg-f1-surface rounded-xl border border-f1-border p-12 text-center">
          <div className="text-4xl mb-4 opacity-30">
            <svg className="w-12 h-12 mx-auto text-f1-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
            </svg>
          </div>
          <p className="text-f1-text-muted text-sm mb-4">
            No teams saved yet. Create a team first to start analyzing your decisions.
          </p>
          <Link
            to="/fantasy/enter-team"
            className="inline-flex items-center gap-2 bg-f1-red text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-f1-red/80 transition-colors"
          >
            Enter Team
          </Link>
        </div>
      ) : (
        /* 3-column layout: T1 | T2 | T3 */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {([1, 2, 3] as const).map((slot) => {
            const data = resolvedSlots[slot - 1];
            return (
              <TeamColumn
                key={slot}
                slotNumber={slot}
                team={data.team}
                driverPlayers={data.drivers}
                constructorPlayers={data.constructors}
                completedRounds={completedRounds}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
