import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { StrategyPrediction } from '../../hooks/usePredictions';

interface TireDegradationChartProps {
  strategy: StrategyPrediction;
}

const COMPOUND_COLORS: Record<string, string> = {
  SOFT: '#E10600',
  MEDIUM: '#FDE047',
  HARD: '#FFFFFF',
};

export function TireDegradationChart({ strategy }: TireDegradationChartProps) {
  // Reshape data: one row per lap with columns for each compound
  const lapMap = new Map<number, Record<string, number>>();
  for (const point of strategy.tire_degradation) {
    if (!lapMap.has(point.lap)) {
      lapMap.set(point.lap, { lap: point.lap });
    }
    lapMap.get(point.lap)![point.compound] = point.predicted_lap_time;
  }
  const data = Array.from(lapMap.values()).sort((a, b) => a.lap - b.lap);

  // Sample every 3 laps to avoid overcrowding
  const sampled = data.filter((_, i) => i % 3 === 0 || i === data.length - 1);

  return (
    <div className="bg-f1-surface rounded-lg border border-f1-border p-4">
      <h3 className="text-xs font-semibold text-f1-text-muted uppercase tracking-wider font-[var(--font-display)] mb-3">
        Tire Degradation
      </h3>

      {sampled.length === 0 ? (
        <div className="text-f1-text-muted text-sm text-center py-4">No degradation data</div>
      ) : (
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sampled} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <XAxis
                dataKey="lap"
                tick={{ fill: '#71717A', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                axisLine={{ stroke: '#2D2D3D' }}
                tickLine={false}
                label={{ value: 'Lap', position: 'insideBottom', offset: -2, fill: '#71717A', fontSize: 10 }}
              />
              <YAxis
                tick={{ fill: '#71717A', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                axisLine={false}
                tickLine={false}
                width={40}
                domain={['auto', 'auto']}
                label={{ value: 'Lap Time (s)', angle: -90, position: 'insideLeft', fill: '#71717A', fontSize: 10 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1A1A24',
                  border: '1px solid #2D2D3D',
                  borderRadius: '4px',
                  fontFamily: 'JetBrains Mono',
                  fontSize: '11px',
                }}
                formatter={(value: number | undefined, name?: string) => [`${(value ?? 0).toFixed(1)}s`, name ?? '']}
              />
              <Legend
                wrapperStyle={{ fontSize: '10px', fontFamily: 'JetBrains Mono' }}
              />
              {['SOFT', 'MEDIUM', 'HARD'].map((compound) => (
                <Line
                  key={compound}
                  type="monotone"
                  dataKey={compound}
                  stroke={COMPOUND_COLORS[compound]}
                  strokeWidth={2}
                  dot={false}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
