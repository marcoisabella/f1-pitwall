import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export interface FantasyScore {
  session_key: number;
  session_name: string;
  score: number;
  breakdown: Record<string, number>;
  created_at: string;
}

interface ScoreHistoryProps {
  scores: FantasyScore[];
}

export function ScoreHistory({ scores }: ScoreHistoryProps) {
  if (scores.length === 0) {
    return (
      <div className="bg-f1-surface rounded-lg border border-f1-border p-4 text-center text-f1-text-muted text-sm">
        No score history yet. Save a team and complete a race to see results.
      </div>
    );
  }

  const chartData = scores.map(s => ({
    name: s.session_name,
    score: s.score,
  }));

  return (
    <div className="bg-f1-surface rounded-lg border border-f1-border overflow-hidden">
      <div className="px-4 py-3 border-b border-f1-border">
        <h3 className="text-xs font-semibold text-f1-text-muted uppercase tracking-wider font-[var(--font-display)]">
          Score History
        </h3>
      </div>

      <div className="p-4">
        <div className="h-48 mb-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00E5CC" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#00E5CC" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="name"
                tick={{ fill: '#5A5A6E', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                axisLine={{ stroke: '#2A2A3C' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#5A5A6E', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1A1A2E',
                  border: '1px solid #2A2A3C',
                  borderRadius: '8px',
                  fontSize: 12,
                  fontFamily: 'JetBrains Mono',
                }}
                labelStyle={{ color: '#E8E8F0' }}
                itemStyle={{ color: '#00E5CC' }}
              />
              <Area
                type="monotone"
                dataKey="score"
                stroke="#00E5CC"
                fill="url(#scoreGradient)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="space-y-1">
          {scores.slice().reverse().map(s => (
            <div key={s.session_key} className="flex items-center justify-between text-xs py-1 border-b border-f1-border/50 last:border-0">
              <span className="text-f1-text font-[var(--font-display)]">{s.session_name}</span>
              <div className="flex items-center gap-3">
                {Object.entries(s.breakdown).map(([key, val]) => (
                  <span key={key} className="text-f1-text-muted">
                    {key}: <span className={val >= 0 ? 'text-f1-green' : 'text-f1-red'}>{val > 0 ? '+' : ''}{val}</span>
                  </span>
                ))}
                <span className="font-timing text-f1-cyan font-bold ml-2">{s.score} pts</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
