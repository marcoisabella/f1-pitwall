import { useState } from 'react';
import type { Driver } from '../../types/f1';
import { DriverRow } from './DriverRow';

interface LiveTimingBoardProps {
  drivers: Driver[];
}

export function LiveTimingBoard({ drivers }: LiveTimingBoardProps) {
  const [gapMode, setGapMode] = useState<'leader' | 'interval'>('interval');

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
    <div className="w-full">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-f1-text-muted uppercase tracking-wider font-[var(--font-display)]">
          Live Timing
        </h2>
        <button
          onClick={() => setGapMode(gapMode === 'leader' ? 'interval' : 'leader')}
          className="text-xs px-3 py-1 rounded bg-f1-elevated text-f1-text-muted hover:text-f1-text transition-colors font-timing"
        >
          {gapMode === 'leader' ? 'GAP TO LEADER' : 'INTERVAL'}
        </button>
      </div>

      <div className="bg-f1-surface rounded-lg overflow-hidden border border-f1-border">
        {/* Header */}
        <div className="grid grid-cols-[3rem_1fr_5rem_5.5rem_4.5rem_4.5rem_4.5rem_3rem_2.5rem] gap-0 px-3 py-2 text-[10px] font-semibold text-f1-text-muted uppercase tracking-wider border-b border-f1-border font-[var(--font-display)]">
          <div>POS</div>
          <div>DRIVER</div>
          <div className="text-right">GAP</div>
          <div className="text-right">LAST LAP</div>
          <div className="text-right">S1</div>
          <div className="text-right">S2</div>
          <div className="text-right">S3</div>
          <div className="text-center">TIRE</div>
          <div className="text-center">PIT</div>
        </div>

        {/* Rows */}
        {drivers.map((driver) => (
          <DriverRow
            key={driver.driver_number}
            driver={driver}
            gapMode={gapMode}
          />
        ))}
      </div>
    </div>
  );
}
