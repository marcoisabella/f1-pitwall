import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { LoadingTelemetry } from '../../components/common/LoadingTelemetry';

interface DriverStat {
  driver_number: number;
  name_acronym: string;
  full_name: string;
  team_name: string;
  price: number;
  mean_points: number;
  std_dev: number;
  p10: number;
  p90: number;
  value: number;
  consistency: number;
  predicted_points: number;
}

export function Statistics() {
  const [drivers, setDrivers] = useState<DriverStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/fantasy/statistics')
      .then(r => r.json())
      .then(data => setDrivers(data.drivers ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingTelemetry />;

  const chartData = [...drivers]
    .sort((a, b) => b.mean_points - a.mean_points)
    .slice(0, 15)
    .map(d => ({
      name: d.name_acronym,
      mean: d.mean_points,
      predicted: d.predicted_points,
    }));

  // Teammate pairs (by team)
  const teamMap = new Map<string, DriverStat[]>();
  for (const d of drivers) {
    if (!teamMap.has(d.team_name)) teamMap.set(d.team_name, []);
    teamMap.get(d.team_name)!.push(d);
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold font-[var(--font-display)] text-f1-text">Statistics</h1>
      <p className="text-xs text-f1-text-muted">Points breakdown and head-to-head teammate comparisons.</p>

      <div className="bg-f1-surface rounded-lg border border-f1-border p-4">
        <h2 className="text-xs text-f1-text-muted uppercase mb-3">Expected Points per Race</h2>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-f1-border)" />
            <XAxis dataKey="name" stroke="var(--color-f1-text-muted)" tick={{ fontSize: 10 }} />
            <YAxis stroke="var(--color-f1-text-muted)" tick={{ fontSize: 10 }} />
            <Tooltip
              contentStyle={{ background: '#1A1A23', border: '1px solid #2A2A35', borderRadius: 8 }}
              labelStyle={{ color: '#999' }}
              formatter={(value: number | undefined) => [value?.toFixed(1) ?? '0', 'Pts']}
            />
            <Bar dataKey="mean" fill="#E8002D" radius={[4, 4, 0, 0]} name="MC Expected" />
            <Bar dataKey="predicted" fill="#00D2BE" radius={[4, 4, 0, 0]} name="ML Predicted" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <h2 className="text-sm font-semibold text-f1-text font-[var(--font-display)]">Teammate H2H</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {Array.from(teamMap.entries()).map(([team, teammates]) => {
          if (teammates.length < 2) return null;
          const [a, b] = teammates.sort((x, y) => y.mean_points - x.mean_points);
          const total = a.mean_points + b.mean_points;
          const aPct = total > 0 ? (a.mean_points / total) * 100 : 50;
          return (
            <div key={team} className="bg-f1-surface rounded-lg border border-f1-border p-3">
              <div className="text-[10px] text-f1-text-muted uppercase mb-2">{team}</div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-f1-text font-[var(--font-display)]">{a.name_acronym}</span>
                <span className="font-timing text-f1-green">{a.mean_points.toFixed(1)}</span>
                <span className="text-f1-text-muted">vs</span>
                <span className="font-timing text-f1-cyan">{b.mean_points.toFixed(1)}</span>
                <span className="font-semibold text-f1-text font-[var(--font-display)]">{b.name_acronym}</span>
              </div>
              <div className="w-full bg-f1-elevated rounded-full h-1.5 flex overflow-hidden">
                <div className="h-1.5 bg-f1-green" style={{ width: `${aPct}%` }} />
                <div className="h-1.5 bg-f1-cyan" style={{ width: `${100 - aPct}%` }} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-f1-surface rounded-lg border border-f1-border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="text-[10px] text-f1-text-muted uppercase border-b border-f1-border">
              <th className="text-left px-3 py-2">Driver</th>
              <th className="text-left px-3 py-2">Team</th>
              <th className="text-right px-3 py-2">Mean Pts</th>
              <th className="text-right px-3 py-2">Std Dev</th>
              <th className="text-right px-3 py-2">P10</th>
              <th className="text-right px-3 py-2">P90</th>
              <th className="text-right px-3 py-2">Consistency</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-f1-border">
            {[...drivers].sort((a, b) => b.mean_points - a.mean_points).map(d => (
              <tr key={d.driver_number} className="hover:bg-f1-elevated/30 transition-colors">
                <td className="px-3 py-2">
                  <span className="text-sm font-semibold text-f1-text font-[var(--font-display)]">{d.name_acronym}</span>
                </td>
                <td className="px-3 py-2 text-xs text-f1-text-muted">{d.team_name}</td>
                <td className="px-3 py-2 text-right font-timing text-xs text-f1-green font-bold">{d.mean_points.toFixed(1)}</td>
                <td className="px-3 py-2 text-right font-timing text-xs text-f1-text-muted">{d.std_dev.toFixed(1)}</td>
                <td className="px-3 py-2 text-right font-timing text-xs text-f1-text-muted">{d.p10}</td>
                <td className="px-3 py-2 text-right font-timing text-xs text-f1-text-muted">{d.p90}</td>
                <td className="px-3 py-2 text-right font-timing text-xs text-f1-cyan">{(d.consistency * 100).toFixed(0)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
