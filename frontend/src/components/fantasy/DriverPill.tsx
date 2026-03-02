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
            rounded-md font-bold uppercase text-white text-center
            flex items-center justify-center
            transition-all
            ${onClick ? 'cursor-pointer hover:brightness-110' : 'cursor-default'}
            ${disabled ? 'opacity-40 cursor-not-allowed' : ''}
            ${selected ? 'ring-2 ring-f1-green' : ''}
          `}
          style={{
            backgroundColor: selected
              ? undefined
              : `${teamColor}CC`, // 80% opacity
            background: selected
              ? `linear-gradient(${teamColor}CC, ${teamColor}CC), rgba(0,255,127,0.1)`
              : undefined,
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
