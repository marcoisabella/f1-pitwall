interface TeamSlotTabsProps {
  activeSlot: 1 | 2 | 3;
  onChange: (slot: 1 | 2 | 3) => void;
  className?: string;
}

const SLOTS = [1, 2, 3] as const;

export function TeamSlotTabs({ activeSlot, onChange, className = '' }: TeamSlotTabsProps) {
  return (
    <div className={`inline-flex rounded-lg border border-f1-border overflow-hidden ${className}`}>
      {SLOTS.map((slot) => (
        <button
          key={slot}
          type="button"
          onClick={() => onChange(slot)}
          className={`
            px-4 py-1.5 text-sm font-timing transition-colors
            ${activeSlot === slot
              ? 'bg-f1-elevated text-white'
              : 'bg-transparent text-f1-text-muted hover:text-white'
            }
          `}
        >
          T{slot}
        </button>
      ))}
    </div>
  );
}
