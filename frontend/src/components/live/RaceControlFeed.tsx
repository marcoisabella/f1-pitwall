import type { RaceControl } from '../../types/f1';

interface RaceControlFeedProps {
  messages: RaceControl[];
}

function getFlagColor(flag: string): string {
  const f = flag?.toUpperCase() ?? '';
  if (f.includes('RED')) return 'border-l-red-500 bg-red-500/5';
  if (f.includes('YELLOW')) return 'border-l-yellow-500 bg-yellow-500/5';
  if (f.includes('GREEN')) return 'border-l-green-500 bg-green-500/5';
  if (f.includes('BLUE')) return 'border-l-blue-500 bg-blue-500/5';
  if (f.includes('CHEQUERED') || f.includes('CHECKERED')) return 'border-l-white bg-white/5';
  return 'border-l-f1-border bg-f1-surface';
}

export function RaceControlFeed({ messages }: RaceControlFeedProps) {
  const sorted = [...messages].reverse();

  return (
    <div className="bg-f1-surface rounded-lg border border-f1-border overflow-hidden">
      <h3 className="text-xs font-semibold text-f1-text-muted uppercase tracking-wider px-3 py-2 border-b border-f1-border font-[var(--font-display)]">
        Race Control
      </h3>
      <div className="max-h-48 overflow-y-auto divide-y divide-f1-border/50">
        {sorted.length === 0 ? (
          <div className="px-3 py-4 text-center text-f1-text-muted text-xs">
            No race control messages
          </div>
        ) : (
          sorted.map((msg, i) => (
            <div
              key={`${msg.date}-${i}`}
              className={`px-3 py-2 border-l-2 ${getFlagColor(msg.flag)}`}
            >
              <div className="text-xs text-f1-text">{msg.message}</div>
              <div className="flex items-center gap-2 mt-0.5">
                {msg.flag && (
                  <span className="text-[10px] font-semibold text-f1-text-muted uppercase">
                    {msg.flag}
                  </span>
                )}
                {msg.lap_number && (
                  <span className="text-[10px] font-timing text-f1-text-muted">
                    Lap {msg.lap_number}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
