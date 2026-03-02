interface ChipButtonsProps {
  chips: string[];
  activeChip: string | null;
  onSelect: (chip: string | null) => void;
  className?: string;
}

export function ChipButtons({
  chips,
  activeChip,
  onSelect,
  className = '',
}: ChipButtonsProps) {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {chips.map((chip) => {
        const isActive = activeChip === chip;
        return (
          <button
            key={chip}
            type="button"
            onClick={() => onSelect(isActive ? null : chip)}
            className={`
              px-3 py-1 rounded-md text-xs font-bold font-timing
              border transition-colors
              ${isActive
                ? 'bg-f1-elevated text-white border-f1-text-muted'
                : 'bg-transparent text-f1-text-muted border-f1-border hover:text-white'
              }
            `}
          >
            {chip}
          </button>
        );
      })}
    </div>
  );
}
