import { DriverPill } from './DriverPill';
import { ConstructorPill } from './ConstructorPill';

interface TeamCardPlayer {
  tla: string;
  teamColor: string;
  points: number;
  priceChange?: number;
  chipMultiplier?: 'x2' | 'x3';
}

interface TeamCardProps {
  teamNumber: 1 | 2 | 3;
  constructors: TeamCardPlayer[];
  drivers: TeamCardPlayer[];
  chipLabel?: string;
  totalDelta?: number;
  totalPoints: number;
  className?: string;
  onClick?: () => void;
}

export function TeamCard({
  teamNumber,
  constructors,
  drivers,
  chipLabel,
  totalDelta,
  totalPoints,
  className = '',
  onClick,
}: TeamCardProps) {
  return (
    <div
      onClick={onClick}
      className={`
        bg-f1-surface border border-f1-border rounded-lg p-3
        hover:bg-f1-elevated/30 transition-colors
        flex items-center gap-4 flex-wrap
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
    >
      {/* Team slot label */}
      <span className="font-timing text-sm font-bold text-f1-text-muted shrink-0">
        T{teamNumber}
      </span>

      {/* Constructors */}
      <div className="flex items-start gap-2">
        {constructors.map((c) => (
          <ConstructorPill
            key={c.tla}
            tla={c.tla}
            teamColor={c.teamColor}
            points={c.points}
            priceChange={c.priceChange}
            size="sm"
          />
        ))}
      </div>

      {/* Separator */}
      <div className="w-px h-6 bg-f1-border shrink-0" />

      {/* Drivers */}
      <div className="flex items-start gap-2">
        {drivers.map((d) => (
          <DriverPill
            key={d.tla}
            tla={d.tla}
            teamColor={d.teamColor}
            points={d.points}
            priceChange={d.priceChange}
            chipMultiplier={d.chipMultiplier}
            size="sm"
          />
        ))}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right side: chip badge, delta, total */}
      <div className="flex items-center gap-3 shrink-0">
        {chipLabel && (
          <span className="px-2 py-0.5 rounded bg-f1-purple text-white text-[10px] font-bold font-timing">
            {chipLabel}
          </span>
        )}

        {totalDelta !== undefined && totalDelta !== 0 && (
          <span
            className={`font-timing text-xs ${
              totalDelta > 0 ? 'text-f1-green' : 'text-f1-red'
            }`}
          >
            {totalDelta > 0 ? '+' : ''}
            {totalDelta.toFixed(1)}
          </span>
        )}

        <span className="font-timing text-sm font-bold text-white">
          {totalPoints} pts
        </span>
      </div>
    </div>
  );
}
