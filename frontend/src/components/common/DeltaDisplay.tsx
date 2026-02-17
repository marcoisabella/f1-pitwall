interface DeltaDisplayProps {
  value: number | null;
  format?: (v: number) => string;
}

export function DeltaDisplay({ value, format }: DeltaDisplayProps) {
  if (value === null || value === undefined) {
    return <span className="text-f1-text-muted font-timing">—</span>;
  }

  const formatted = format ? format(value) : value.toFixed(3);
  const prefix = value > 0 ? '+' : '';
  const colorClass = value > 0 ? 'text-f1-red' : value < 0 ? 'text-f1-green' : 'text-f1-text';

  return (
    <span className={`font-timing ${colorClass}`}>
      {prefix}{formatted}
    </span>
  );
}
