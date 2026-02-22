import { formatSectorTime } from '../../utils/formatters';
import type { SectorBests } from '../../types/f1';

interface SectorDisplayProps {
  s1: number | null;
  s2: number | null;
  s3: number | null;
  sectorBests: SectorBests;
  personalBests?: { s1: number | null; s2: number | null; s3: number | null };
}

function getSectorColor(
  value: number | null,
  sessionBest: number | null,
  personalBest: number | null,
): string {
  if (value === null) return 'text-f1-text-muted';
  if (sessionBest !== null && value <= sessionBest) return 'bg-purple-500/20 text-purple-400';
  if (personalBest !== null && value <= personalBest) return 'bg-green-500/20 text-green-400';
  return 'text-f1-yellow';
}

export function SectorDisplay({ s1, s2, s3, sectorBests, personalBests }: SectorDisplayProps) {
  const pb = personalBests ?? { s1: null, s2: null, s3: null };

  return (
    <>
      <div className={`text-right font-timing text-xs px-1 rounded ${getSectorColor(s1, sectorBests.s1, pb.s1)}`}>
        {formatSectorTime(s1)}
      </div>
      <div className={`text-right font-timing text-xs px-1 rounded ${getSectorColor(s2, sectorBests.s2, pb.s2)}`}>
        {formatSectorTime(s2)}
      </div>
      <div className={`text-right font-timing text-xs px-1 rounded ${getSectorColor(s3, sectorBests.s3, pb.s3)}`}>
        {formatSectorTime(s3)}
      </div>
    </>
  );
}
