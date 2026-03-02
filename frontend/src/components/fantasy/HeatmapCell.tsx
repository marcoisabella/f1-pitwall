interface HeatmapCellProps {
  value: number;
  min?: number;
  max?: number;
  format?: (v: number) => string;
  className?: string;
}

function interpolateColor(value: number, min: number, max: number): string {
  // Clamp t to [0, 1]
  const t = Math.max(0, Math.min(1, (value - min) / (max - min || 1)));

  // red (#DC2626) at 0 -> yellow (#CA8A04) at 0.5 -> green (#16A34A) at 1
  let r: number, g: number, b: number;

  if (t < 0.5) {
    const p = t / 0.5;
    r = Math.round(0xDC + (0xCA - 0xDC) * p);
    g = Math.round(0x26 + (0x8A - 0x26) * p);
    b = Math.round(0x26 + (0x04 - 0x26) * p);
  } else {
    const p = (t - 0.5) / 0.5;
    r = Math.round(0xCA + (0x16 - 0xCA) * p);
    g = Math.round(0x8A + (0xA3 - 0x8A) * p);
    b = Math.round(0x04 + (0x4A - 0x04) * p);
  }

  return `rgb(${r}, ${g}, ${b})`;
}

export function HeatmapCell({
  value,
  min = -20,
  max = 60,
  format,
  className = '',
}: HeatmapCellProps) {
  const bgColor = interpolateColor(value, min, max);
  const displayValue = format ? format(value) : String(value);

  return (
    <span
      className={`
        inline-block px-1 py-0.5 rounded-sm min-w-[36px] text-center
        text-white text-xs font-timing tabular-nums
        ${className}
      `}
      style={{ backgroundColor: bgColor }}
    >
      {displayValue}
    </span>
  );
}
