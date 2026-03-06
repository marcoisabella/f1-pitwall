import type { Driver, SectorBests } from '../../types/f1';
import { formatLapTime, formatSectorTime, formatGap } from '../../utils/formatters';
import { getTeamColorFromHex } from '../../utils/teamColors';
import { TireCompound } from './TireCompound';

interface DriverRowProps {
  driver: Driver;
  sectorBests?: SectorBests;
}

function MiniSector({ time, sessionBest, isPersonalBest }: {
  time: number | null;
  sessionBest: number | null;
  isPersonalBest?: boolean;
}) {
  if (time === null) return <div className="w-3 h-3 rounded-sm bg-f1-border/30" />;

  const isSessionBest = sessionBest !== null && Math.abs(time - sessionBest) < 0.001;
  const bg = isSessionBest ? 'bg-purple-500' : isPersonalBest ? 'bg-green-500' : 'bg-yellow-500/60';

  return (
    <div
      className={`w-3 h-3 rounded-sm ${bg} cursor-help`}
      title={formatSectorTime(time)}
    />
  );
}

function gapColor(gap: number | string | null): string {
  if (gap === null || gap === 0) return 'text-f1-text';
  if (typeof gap === 'string') return 'text-f1-red';
  if (gap < 1) return 'text-f1-green';
  if (gap < 5) return 'text-f1-yellow';
  return 'text-f1-red';
}

function PositionDelta({ change }: { change: number | null | undefined }) {
  if (change === null || change === undefined || change === 0) {
    return <span className="text-[8px] text-f1-text-muted">&mdash;</span>;
  }
  if (change > 0) {
    return <span className="text-[8px] text-f1-green">&uarr;{change}</span>;
  }
  return <span className="text-[8px] text-f1-red">&darr;{Math.abs(change)}</span>;
}

export function DriverRow({ driver, sectorBests }: DriverRowProps) {
  const teamColor = getTeamColorFromHex(driver.team_colour);
  const sb = sectorBests ?? { s1: null, s2: null, s3: null };
  const isLeader = driver.position === 1;
  const isDnf = driver.is_dnf === true;

  return (
    <div
      className={`grid grid-cols-[2rem_5.5rem_3.5rem_3.5rem_5rem_5rem_5rem_2.5rem_2.5rem_2.5rem] gap-0 px-2 py-0.5 items-center border-b border-f1-border/30 hover:bg-f1-elevated/30 text-xs${isDnf ? ' opacity-40' : ''}`}
      style={{ borderLeftWidth: '3px', borderLeftColor: teamColor }}
    >
      {/* Position + delta */}
      <div className="flex items-center gap-0.5">
        <span className="font-timing font-bold text-f1-text">
          {driver.position ?? '—'}
        </span>
        <PositionDelta change={driver.position_change} />
      </div>

      {/* Driver name + FL badge */}
      <div className="flex items-center gap-1 min-w-0">
        <span className={`font-bold text-f1-text font-[var(--font-display)] text-[11px]${isDnf ? ' line-through' : ''}`}>
          {driver.name_acronym}
        </span>
        {driver.has_fastest_lap && (
          <span className="text-[8px] font-bold text-purple-400 bg-purple-400/15 rounded px-0.5">FL</span>
        )}
      </div>

      {/* Tire + PIT badge */}
      <div className="flex items-center justify-center gap-0.5">
        <TireCompound compound={driver.compound} age={driver.tire_age} />
        {driver.in_pit && (
          <span className="text-[7px] font-bold text-f1-yellow bg-f1-yellow/15 rounded px-0.5 leading-tight">PIT</span>
        )}
      </div>

      {/* Interval */}
      <div className={`text-right font-timing ${isLeader ? 'text-f1-text-muted' : gapColor(driver.interval)}`}>
        {isLeader ? '' : formatGap(driver.interval)}
      </div>

      {/* Best Lap */}
      <div className={`text-right font-timing ${driver.has_fastest_lap ? 'text-purple-400 font-bold' : 'text-f1-text'}`}>
        {formatLapTime(driver.best_lap_time ?? null)}
      </div>

      {/* Last Lap */}
      <div className="text-right font-timing text-f1-text-muted">
        {formatLapTime(driver.last_lap_time)}
      </div>

      {/* Gap to leader */}
      <div className={`text-right font-timing ${isLeader ? '' : gapColor(driver.gap_to_leader)}`}>
        {isLeader ? (
          <span className="text-f1-text">Leader</span>
        ) : (
          formatGap(driver.gap_to_leader)
        )}
      </div>

      {/* Mini Sectors S1/S2/S3 */}
      <div className="flex justify-center">
        <MiniSector time={driver.sector_1_time} sessionBest={sb.s1} isPersonalBest={driver.is_pb_s1} />
      </div>
      <div className="flex justify-center">
        <MiniSector time={driver.sector_2_time} sessionBest={sb.s2} isPersonalBest={driver.is_pb_s2} />
      </div>
      <div className="flex justify-center">
        <MiniSector time={driver.sector_3_time} sessionBest={sb.s3} isPersonalBest={driver.is_pb_s3} />
      </div>
    </div>
  );
}
