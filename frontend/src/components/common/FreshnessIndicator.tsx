interface FreshnessIndicatorProps {
  source: string;
  fetchedAt: string;
  stale: boolean;
}

export function FreshnessIndicator({ source, fetchedAt, stale }: FreshnessIndicatorProps) {
  const age = Date.now() - new Date(fetchedAt).getTime();
  const hours = age / 3600000;

  let dotColor = 'bg-f1-green';
  let label = 'Live';
  if (source === 'seed') {
    dotColor = 'bg-f1-yellow';
    label = 'Seed data';
  } else if (stale || hours > 24) {
    dotColor = 'bg-orange-500';
    label = 'Stale';
  } else if (hours > 1) {
    dotColor = 'bg-f1-yellow';
    label = 'Cached';
  }

  const sourceLabel =
    source === 'jolpica' ? 'Jolpica API' :
    source === 'cache' ? 'Cached' :
    source === 'seed' ? 'Seed data' :
    source;

  return (
    <div className="group relative inline-flex items-center gap-1.5">
      <div className={`w-2 h-2 rounded-full ${dotColor}`} />
      <span className="text-[10px] text-f1-text-muted">{label}</span>
      <div className="absolute bottom-full left-0 mb-1 hidden group-hover:block z-50">
        <div className="bg-f1-elevated border border-f1-border rounded px-2 py-1 text-[10px] text-f1-text whitespace-nowrap shadow-lg">
          <div>Source: {sourceLabel}</div>
          <div>Updated: {new Date(fetchedAt).toLocaleString()}</div>
        </div>
      </div>
    </div>
  );
}
