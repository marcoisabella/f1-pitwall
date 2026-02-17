/**
 * Format lap time from seconds to M:SS.mmm
 */
export function formatLapTime(seconds: number | null): string {
  if (seconds === null || seconds === undefined) return '—';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const secsStr = secs.toFixed(3).padStart(6, '0');
  if (mins > 0) {
    return `${mins}:${secsStr}`;
  }
  return secsStr;
}

/**
 * Format gap/interval display
 */
export function formatGap(gap: number | string | null): string {
  if (gap === null || gap === undefined) return '—';
  if (typeof gap === 'string') return gap;
  if (gap === 0) return 'LEADER';
  return `+${gap.toFixed(3)}`;
}

/**
 * Format sector time from seconds to SS.mmm
 */
export function formatSectorTime(seconds: number | null): string {
  if (seconds === null || seconds === undefined) return '—';
  return seconds.toFixed(3);
}
