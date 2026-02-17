import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { StrategyPrediction } from '../../hooks/usePredictions';

interface PitWindowChartProps {
  strategy: StrategyPrediction;
}

const COMPOUND_COLORS: Record<string, string> = {
  SOFT: '#E10600',
  MEDIUM: '#FDE047',
  HARD: '#FFFFFF',
};

export function PitWindowChart({ strategy }: PitWindowChartProps) {
  const data = strategy.pit_windows.map((w, i) => ({
    name: `Window ${i + 1}`,
    label: `L${w.lap_start}-${w.lap_end}`,
    probability: Math.round(w.probability * 100),
    compound_from: w.compound_from,
    compound_to: w.compound_to,
    lap_start: w.lap_start,
    lap_end: w.lap_end,
  }));

  return (
    <div className="bg-f1-surface rounded-lg border border-f1-border p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-f1-text-muted uppercase tracking-wider font-[var(--font-display)]">
          Pit Windows — {strategy.name_acronym}
        </h3>
        <span className="text-xs font-timing text-f1-text-muted">
          {strategy.recommended_stops} stop{strategy.recommended_stops !== 1 ? 's' : ''}
        </span>
      </div>

      {data.length === 0 ? (
        <div className="text-f1-text-muted text-sm text-center py-4">No pit window data</div>
      ) : (
        <>
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                <XAxis
                  dataKey="label"
                  tick={{ fill: '#71717A', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                  axisLine={{ stroke: '#2D2D3D' }}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fill: '#71717A', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                  axisLine={false}
                  tickLine={false}
                  width={30}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1A1A24',
                    border: '1px solid #2D2D3D',
                    borderRadius: '4px',
                    fontFamily: 'JetBrains Mono',
                    fontSize: '11px',
                  }}
                  formatter={(value: number | undefined) => [`${value ?? 0}%`, 'Probability']}
                />
                <Bar dataKey="probability" radius={[4, 4, 0, 0]}>
                  {data.map((entry, idx) => (
                    <Cell
                      key={idx}
                      fill={COMPOUND_COLORS[entry.compound_to] || '#22D3EE'}
                      fillOpacity={0.8}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-2 space-y-1">
            {data.map((w, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: COMPOUND_COLORS[w.compound_from] || '#888' }}
                />
                <span className="text-f1-text-muted font-timing">
                  {w.compound_from} → {w.compound_to}
                </span>
                <span className="text-f1-text-muted font-timing ml-auto">
                  Laps {w.lap_start}–{w.lap_end}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
