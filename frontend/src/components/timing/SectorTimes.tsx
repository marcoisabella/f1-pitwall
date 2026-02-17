import { formatSectorTime } from '../../utils/formatters';

interface SectorTimesProps {
  s1: number | null;
  s2: number | null;
  s3: number | null;
}

export function SectorTimes({ s1, s2, s3 }: SectorTimesProps) {
  return (
    <>
      <div className="text-right font-timing text-xs text-f1-text-muted">
        {formatSectorTime(s1)}
      </div>
      <div className="text-right font-timing text-xs text-f1-text-muted">
        {formatSectorTime(s2)}
      </div>
      <div className="text-right font-timing text-xs text-f1-text-muted">
        {formatSectorTime(s3)}
      </div>
    </>
  );
}
