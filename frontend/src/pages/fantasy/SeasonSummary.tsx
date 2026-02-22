import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { LoadingTelemetry } from '../../components/common/LoadingTelemetry';

interface RoundScore {
  season: number;
  round: number;
  driver_number: number;
  points: number;
}

interface DriverCumulative {
  driver_number: number;
  name: string;
  color: string;
  rounds: { round: number; cumulative: number }[];
  total: number;
}

const DRIVER_COLORS: Record<number, string> = {
  1: '#E8002D', 44: '#27F4D2', 4: '#FF8000', 16: '#E8002D', 63: '#6692FF',
  55: '#6692FF', 81: '#FF8000', 14: '#229971', 23: '#6B6E70', 22: '#6B6E70',
};

export function SeasonSummary() {
  const [scores, setScores] = useState<RoundScore[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/fantasy/historical/2025')
      .then(r => r.json())
      .then(data => setScores(data.scores ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingTelemetry />;

  const byDriver = new Map<number, RoundScore[]>();
  for (const s of scores) {
    if (!byDriver.has(s.driver_number)) byDriver.set(s.driver_number, []);
    byDriver.get(s.driver_number)!.push(s);
  }

  const cumulativeData: DriverCumulative[] = Array.from(byDriver.entries()).map(([num, rounds]) => {
    rounds.sort((a, b) => a.round - b.round);
    let sum = 0;
    return {
      driver_number: num,
      name: `#${num}`,
      color: DRIVER_COLORS[num] ?? '#888',
      rounds: rounds.map(r => ({ round: r.round, cumulative: sum += r.points })),
      total: sum,
    };
  }).sort((a, b) => b.total - a.total);

  const maxRound = Math.max(...scores.map(s => s.round), 1);
  const chartData = Array.from({ length: maxRound }, (_, i) => {
    const round = i + 1;
    const point: Record<string, number> = { round };
    for (const d of cumulativeData) {
      const r = d.rounds.find(r => r.round === round);
      point[`d${d.driver_number}`] = r?.cumulative ?? 0;
    }
    return point;
  });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold font-[var(--font-display)] text-f1-text">Season Summary</h1>
      <p className="text-xs text-f1-text-muted">Cumulative fantasy points over the season.</p>

      {scores.length === 0 ? (
        <div className="bg-f1-surface rounded-lg border border-f1-border p-8 text-center">
          <p className="text-f1-text-muted text-sm">No historical scoring data available yet.</p>
        </div>
      ) : (
        <>
          <div className="bg-f1-surface rounded-lg border border-f1-border p-4">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-f1-border)" />
                <XAxis dataKey="round" stroke="var(--color-f1-text-muted)" tick={{ fontSize: 10 }} />
                <YAxis stroke="var(--color-f1-text-muted)" tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ background: '#1A1A23', border: '1px solid #2A2A35', borderRadius: 8 }}
                  labelStyle={{ color: '#999' }}
                  formatter={(value: number | undefined) => [value ?? 0, 'Pts']}
                />
                {cumulativeData.slice(0, 8).map(d => (
                  <Line
                    key={d.driver_number}
                    type="monotone"
                    dataKey={`d${d.driver_number}`}
                    stroke={d.color}
                    strokeWidth={2}
                    dot={false}
                    name={d.name}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-f1-surface rounded-lg border border-f1-border overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="text-[10px] text-f1-text-muted uppercase border-b border-f1-border">
                  <th className="text-center px-3 py-2 w-10">#</th>
                  <th className="text-left px-3 py-2">Driver</th>
                  <th className="text-right px-3 py-2">Total Pts</th>
                  <th className="text-right px-3 py-2">Rounds</th>
                  <th className="text-right px-3 py-2">Avg/Round</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-f1-border">
                {cumulativeData.map((d, i) => (
                  <tr key={d.driver_number}>
                    <td className="px-3 py-2 text-center font-timing text-xs text-f1-text-muted">{i + 1}</td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                        <span className="text-sm font-semibold text-f1-text font-[var(--font-display)]">{d.name}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-right font-timing text-sm text-f1-green font-bold">{d.total}</td>
                    <td className="px-3 py-2 text-right font-timing text-xs text-f1-text-muted">{d.rounds.length}</td>
                    <td className="px-3 py-2 text-right font-timing text-xs text-f1-cyan">
                      {d.rounds.length > 0 ? (d.total / d.rounds.length).toFixed(1) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
