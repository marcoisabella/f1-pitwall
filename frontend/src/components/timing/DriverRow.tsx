import type { Driver, SectorBests } from '../../types/f1';
import { formatLapTime } from '../../utils/formatters';
import { getTeamColorFromHex } from '../../utils/teamColors';
import { GapIndicator } from './GapIndicator';
import { SectorDisplay } from '../live/SectorDisplay';
import { TireCompound } from './TireCompound';

interface DriverRowProps {
  driver: Driver;
  gapMode: 'leader' | 'interval';
  sectorBests?: SectorBests;
}

export function DriverRow({ driver, gapMode, sectorBests }: DriverRowProps) {
  const teamColor = getTeamColorFromHex(driver.team_colour);
  const gap = gapMode === 'leader' ? driver.gap_to_leader : driver.interval;
  const sb = sectorBests ?? { s1: null, s2: null, s3: null };

  return (
    <div
      className="driver-row grid grid-cols-[3rem_1fr_5rem_5.5rem_4.5rem_4.5rem_4.5rem_3rem_2.5rem_2.5rem] gap-0 px-3 py-1.5 items-center border-b border-f1-border/50 hover:bg-f1-elevated/30 text-sm"
      style={{ borderLeftWidth: '3px', borderLeftColor: teamColor }}
    >
      {/* Position */}
      <div className="font-timing font-bold text-f1-text">
        {driver.position ?? '—'}
      </div>

      {/* Driver name */}
      <div className="flex items-center gap-2">
        <span className="font-bold text-f1-text font-[var(--font-display)]">
          {driver.name_acronym}
        </span>
        <span className="text-f1-text-muted text-xs font-timing">
          {driver.driver_number}
        </span>
      </div>

      {/* Gap */}
      <div className="text-right">
        <GapIndicator gap={gap} isLeader={driver.position === 1} />
      </div>

      {/* Last lap */}
      <div className="text-right font-timing text-f1-text text-xs">
        {formatLapTime(driver.last_lap_time)}
      </div>

      {/* Sectors with color coding */}
      <SectorDisplay
        s1={driver.sector_1_time}
        s2={driver.sector_2_time}
        s3={driver.sector_3_time}
        sectorBests={sb}
      />

      {/* Tire */}
      <div className="flex justify-center">
        <TireCompound compound={driver.compound} age={driver.tire_age} />
      </div>

      {/* Pit stops */}
      <div className="text-center font-timing text-f1-text-muted text-xs">
        {driver.pit_stops || '—'}
      </div>

      {/* DRS indicator */}
      <div className="text-center">
        {(driver as Driver & { drs?: number }).drs === 1 ? (
          <span className="px-1 py-0.5 bg-green-500/20 text-green-400 rounded text-[9px] font-bold font-timing">
            DRS
          </span>
        ) : null}
      </div>
    </div>
  );
}
