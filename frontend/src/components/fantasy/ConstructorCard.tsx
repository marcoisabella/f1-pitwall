import type { FantasyConstructor } from '../../hooks/useFantasy';

interface ConstructorCardProps {
  constructor: FantasyConstructor;
  isSelected: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

export function ConstructorCard({ constructor, isSelected, onToggle, disabled }: ConstructorCardProps) {
  return (
    <button
      onClick={onToggle}
      disabled={disabled && !isSelected}
      className={`w-full text-left rounded-lg border transition-all ${
        isSelected
          ? 'border-f1-green bg-f1-green/5'
          : disabled
          ? 'border-f1-border/50 opacity-50 cursor-not-allowed'
          : 'border-f1-border hover:border-f1-text-muted bg-f1-surface'
      }`}
      style={{ borderLeftWidth: '3px', borderLeftColor: constructor.color }}
    >
      <div className="p-3">
        <div className="flex items-center justify-between mb-1">
          <span className="font-bold text-sm text-f1-text font-[var(--font-display)]">
            {constructor.name}
          </span>
          <span className="font-timing text-xs text-f1-yellow font-bold">
            ${constructor.price}M
          </span>
        </div>
        <div className="text-[10px] text-f1-text-muted mb-2">
          {constructor.driver_abbreviations.join(' / ') || 'TBA'}
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-f1-text-muted">{constructor.engine}</span>
          <span className="font-timing text-[10px] text-f1-cyan">
            {constructor.expected_points} pts
          </span>
        </div>
      </div>
    </button>
  );
}
