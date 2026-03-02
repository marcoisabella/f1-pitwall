interface ConstructorPillProps {
  tla: string;
  teamColor: string;
  points?: number;
  price?: number;
  priceChange?: number;
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

export function ConstructorPill({
  tla,
  teamColor,
  points,
  price,
  priceChange,
  selected = false,
  disabled = false,
  onClick,
  size = 'md',
}: ConstructorPillProps) {
  return (
    <div className="inline-flex flex-col items-center gap-0.5">
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={`
          ${SIZE_CLASSES[size]}
          rounded-md font-bold uppercase text-white text-center
          bg-f1-surface border-2
          flex items-center justify-center
          transition-all
          ${onClick ? 'cursor-pointer hover:brightness-110' : 'cursor-default'}
          ${disabled ? 'opacity-40 cursor-not-allowed' : ''}
          ${selected ? 'ring-2 ring-f1-green bg-f1-green/10' : ''}
        `}
        style={{ borderColor: teamColor }}
      >
        {tla}
      </button>

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
