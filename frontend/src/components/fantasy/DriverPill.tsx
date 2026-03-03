interface DriverPillProps {
  tla: string;
  teamColor: string;
  points?: number;
  price?: number;
  priceChange?: number;
  chipMultiplier?: 'x2' | 'x3';
  selected?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
}

const SIZE_CLASSES = {
  sm: 'min-w-[32px] h-[24px] text-[10px] px-1.5',
  md: 'min-w-[48px] h-[32px] text-xs px-2',
  lg: 'min-w-[56px] h-[36px] text-sm px-2.5',
} as const;

/** Return '#000' or '#fff' based on which has better contrast against the bg. */
function contrastText(hex: string): string {
  const c = hex.replace('#', '');
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  // Relative luminance (sRGB)
  const L = 0.299 * r + 0.587 * g + 0.114 * b;
  return L > 160 ? '#000' : '#fff';
}

export function DriverPill({
  tla,
  teamColor,
  points,
  price,
  priceChange,
  chipMultiplier,
  selected = false,
  disabled = false,
  onClick,
  size = 'md',
}: DriverPillProps) {
  const textColor = contrastText(teamColor);

  return (
    <div className="inline-flex flex-col items-center gap-0.5">
      <div className="relative">
        {chipMultiplier && (
          <span className="absolute -top-2 -right-2 bg-f1-purple text-white text-[10px] font-bold font-timing px-1 rounded z-10 leading-tight">
            {chipMultiplier}
          </span>
        )}
        <button
          type="button"
          onClick={onClick}
          disabled={disabled}
          className={`
            ${SIZE_CLASSES[size]}
            rounded-md font-bold uppercase text-center
            flex items-center justify-center
            transition-all
            ${onClick ? 'cursor-pointer hover:brightness-110' : 'cursor-default'}
            ${disabled ? 'opacity-40 cursor-not-allowed' : ''}
            ${selected ? 'ring-2 ring-f1-green' : ''}
          `}
          style={{
            backgroundColor: teamColor,
            color: textColor,
          }}
        >
          {tla}
        </button>
      </div>

      {(price !== undefined || points !== undefined) && (
        <div className="flex flex-col items-center leading-tight">
          {price !== undefined && (
            <div className="flex items-center gap-0.5">
              <span className="font-timing text-[10px] text-f1-yellow">
                ${price.toFixed(1)}M
              </span>
              {priceChange !== undefined && priceChange !== 0 && (
                <span
                  className={`font-timing text-[10px] ${
                    priceChange > 0 ? 'text-f1-green' : 'text-f1-red'
                  }`}
                >
                  {priceChange > 0 ? '+' : ''}
                  {priceChange.toFixed(1)}
                </span>
              )}
            </div>
          )}
          {points !== undefined && (
            <span className="font-timing text-[10px] text-white">
              {points} pts
            </span>
          )}
        </div>
      )}
    </div>
  );
}
