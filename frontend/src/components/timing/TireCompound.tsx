const TIRE_COLORS: Record<string, string> = {
  SOFT: 'var(--color-tire-soft)',
  MEDIUM: 'var(--color-tire-medium)',
  HARD: 'var(--color-tire-hard)',
  INTERMEDIATE: 'var(--color-tire-inter)',
  WET: 'var(--color-tire-wet)',
};

const TIRE_LABELS: Record<string, string> = {
  SOFT: 'S',
  MEDIUM: 'M',
  HARD: 'H',
  INTERMEDIATE: 'I',
  WET: 'W',
};

interface TireCompoundProps {
  compound: string | null;
  age: number | null;
}

export function TireCompound({ compound, age }: TireCompoundProps) {
  if (!compound) {
    return <span className="text-f1-text-muted text-xs">—</span>;
  }

  const upper = compound.toUpperCase();
  const color = TIRE_COLORS[upper] || '#888';
  const label = TIRE_LABELS[upper] || compound.charAt(0);

  return (
    <div className="flex items-center gap-1">
      <div
        className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-f1-bg"
        style={{ backgroundColor: color }}
      >
        {label}
      </div>
      {age !== null && (
        <span className="text-[10px] font-timing text-f1-text-muted">
          {age}
        </span>
      )}
    </div>
  );
}
