interface TeamColorBadgeProps {
  color: string;
  size?: 'sm' | 'md';
}

export function TeamColorBadge({ color, size = 'sm' }: TeamColorBadgeProps) {
  const sizeClass = size === 'sm' ? 'w-1 h-4' : 'w-1.5 h-5';
  return (
    <div
      className={`${sizeClass} rounded-full`}
      style={{ backgroundColor: color }}
    />
  );
}
