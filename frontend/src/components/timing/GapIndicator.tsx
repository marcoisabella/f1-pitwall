import { formatGap } from '../../utils/formatters';

interface GapIndicatorProps {
  gap: number | string | null;
  isLeader?: boolean;
}

export function GapIndicator({ gap, isLeader }: GapIndicatorProps) {
  if (isLeader) {
    return (
      <span className="font-timing text-xs text-f1-text-muted">
        LEADER
      </span>
    );
  }

  return (
    <span className="font-timing text-xs text-f1-text">
      {formatGap(gap)}
    </span>
  );
}
