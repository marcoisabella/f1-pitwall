import type { Driver, SectorBests } from '../../types/f1';
import { DriverRow } from './DriverRow';

interface LiveTimingBoardProps {
  drivers: Driver[];
  sectorBests?: SectorBests;
}

export function LiveTimingBoard({ drivers, sectorBests }: LiveTimingBoardProps) {
  if (drivers.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-f1-text-muted">
        <div className="text-center">
          <div className="text-4xl mb-4">🏁</div>
          <div className="text-lg font-[var(--font-display)]">No Live Session</div>
          <div className="text-sm mt-1">Waiting for session data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto">
      <div className="min-w-[700px]">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-f1-text-muted uppercase tracking-wider font-[var(--font-display)]">
            Live Timing
          </h2>
        </div>

        <div className="bg-f1-surface rounded-lg overflow-hidden border border-f1-border">
          {/* Header */}
          <div className="sticky top-0 z-10 bg-f1-surface grid grid-cols-[2rem_5.5rem_3.5rem_3.5rem_5rem_5rem_5rem_2.5rem_2.5rem_2.5rem] gap-0 px-2 py-2 text-[9px] font-semibold text-f1-text-muted uppercase tracking-wider border-b border-f1-border font-[var(--font-display)]">
            <div>P</div>
            <div>Driver</div>
            <div className="text-center">Tire</div>
            <div className="text-right">INT</div>
            <div className="text-right">Best</div>
            <div className="text-right">Last</div>
            <div className="text-right">Gap</div>
            <div className="text-center">S1</div>
            <div className="text-center">S2</div>
            <div className="text-center">S3</div>
          </div>

          {/* Rows */}
          {drivers.map((driver) => (
            <DriverRow
              key={driver.driver_number}
              driver={driver}
              sectorBests={sectorBests}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
