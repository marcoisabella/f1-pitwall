import type { RaceControl } from '../../types/f1';

interface TrackConditionsProps {
  raceControl: RaceControl[];
}

const FLAG_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  GREEN: { bg: 'bg-f1-green/20', text: 'text-f1-green', label: 'GREEN FLAG' },
  YELLOW: { bg: 'bg-f1-yellow/20', text: 'text-f1-yellow', label: 'YELLOW FLAG' },
  RED: { bg: 'bg-f1-red/20', text: 'text-f1-red', label: 'RED FLAG' },
  DOUBLE_YELLOW: { bg: 'bg-f1-yellow/20', text: 'text-f1-yellow', label: 'DOUBLE YELLOW' },
};

export function TrackConditions({ raceControl }: TrackConditionsProps) {
  const latestFlag = raceControl
    .filter((rc) => rc.flag)
    .at(-1);

  const flagConfig = latestFlag?.flag
    ? FLAG_COLORS[latestFlag.flag] || FLAG_COLORS.GREEN
    : FLAG_COLORS.GREEN;

  return (
    <div className="bg-f1-surface rounded-lg p-4 border border-f1-border">
      <h3 className="text-xs font-semibold text-f1-text-muted uppercase tracking-wider mb-3 font-[var(--font-display)]">
        Track Status
      </h3>

      <div className={`${flagConfig.bg} rounded-lg p-3 mb-3`}>
        <div className={`font-bold text-sm ${flagConfig.text} font-[var(--font-display)]`}>
          {flagConfig.label}
        </div>
      </div>

      {raceControl.length > 0 && (
        <div className="space-y-2">
          <div className="text-[10px] text-f1-text-muted uppercase tracking-wider">
            Recent Messages
          </div>
          {raceControl.slice(-5).reverse().map((rc, i) => (
            <div key={i} className="text-xs text-f1-text-muted py-1 border-b border-f1-border/30">
              {rc.message}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
