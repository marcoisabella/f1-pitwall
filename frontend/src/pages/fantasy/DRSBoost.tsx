import { useState, useEffect } from 'react';
import { LoadingTelemetry } from '../../components/common/LoadingTelemetry';

interface SimDriver {
  driver_number: number;
  name_acronym: string;
  full_name: string;
  team_name: string;
  mean_points: number;
  p10: number;
  p90: number;
  std_dev: number;
  price: number;
  value: number;
}

export function DRSBoost() {
  const [drivers, setDrivers] = useState<SimDriver[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/fantasy/simulate')
      .then(r => r.json())
      .then(data => setDrivers(data.drivers ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingTelemetry />;

  // DRS Boost = 2x points for one driver. Best target = highest expected points.
  // Also show "upside play" = highest std_dev for variance-based picks.
  const byExpected = [...drivers].sort((a, b) => b.mean_points - a.mean_points);
  const byUpside = [...drivers].sort((a, b) => b.p90 - a.p90);

  const bestPick = byExpected[0];

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold font-[var(--font-display)] text-f1-text">DRS Boost</h1>
      <p className="text-xs text-f1-text-muted">Find the best driver to apply your DRS Boost (2x points) this round.</p>

      {bestPick && (
        <div className="bg-f1-surface rounded-lg border-2 border-f1-green p-4">
          <div className="text-[10px] text-f1-green uppercase font-semibold mb-1">Recommended DRS Boost</div>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-lg font-bold text-f1-text font-[var(--font-display)]">{bestPick.name_acronym}</span>
              <span className="ml-2 text-sm text-f1-text-muted">{bestPick.full_name}</span>
              <div className="text-xs text-f1-text-muted">{bestPick.team_name}</div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-f1-text-muted">2x Expected Points</div>
              <div className="font-timing text-2xl text-f1-green font-bold">{(bestPick.mean_points * 2).toFixed(1)}</div>
            </div>
          </div>
        </div>
      )}

      <h2 className="text-sm font-semibold text-f1-text font-[var(--font-display)]">Safe Picks (Highest Expected)</h2>
      <div className="bg-f1-surface rounded-lg border border-f1-border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="text-[10px] text-f1-text-muted uppercase border-b border-f1-border">
              <th className="text-center px-3 py-2 w-8">#</th>
              <th className="text-left px-3 py-2">Driver</th>
              <th className="text-right px-3 py-2">Exp. Pts</th>
              <th className="text-right px-3 py-2">2x Pts</th>
              <th className="text-right px-3 py-2">P10 (2x)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-f1-border">
            {byExpected.slice(0, 10).map((d, i) => (
              <tr key={d.driver_number} className={`transition-colors ${i === 0 ? 'bg-f1-green/5' : 'hover:bg-f1-elevated/30'}`}>
                <td className="px-3 py-2 text-center font-timing text-xs text-f1-text-muted">{i + 1}</td>
                <td className="px-3 py-2">
                  <span className="text-sm font-semibold text-f1-text font-[var(--font-display)]">{d.name_acronym}</span>
                  <span className="ml-2 text-xs text-f1-text-muted">{d.team_name}</span>
                </td>
                <td className="px-3 py-2 text-right font-timing text-xs text-f1-text">{d.mean_points}</td>
                <td className="px-3 py-2 text-right font-timing text-xs text-f1-green font-bold">{(d.mean_points * 2).toFixed(1)}</td>
                <td className="px-3 py-2 text-right font-timing text-xs text-f1-text-muted">{(d.p10 * 2).toFixed(1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="text-sm font-semibold text-f1-text font-[var(--font-display)]">Upside Plays (Highest Ceiling)</h2>
      <div className="bg-f1-surface rounded-lg border border-f1-border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="text-[10px] text-f1-text-muted uppercase border-b border-f1-border">
              <th className="text-center px-3 py-2 w-8">#</th>
              <th className="text-left px-3 py-2">Driver</th>
              <th className="text-right px-3 py-2">P90</th>
              <th className="text-right px-3 py-2">2x P90</th>
              <th className="text-right px-3 py-2">Std Dev</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-f1-border">
            {byUpside.slice(0, 10).map((d, i) => (
              <tr key={d.driver_number} className="hover:bg-f1-elevated/30 transition-colors">
                <td className="px-3 py-2 text-center font-timing text-xs text-f1-text-muted">{i + 1}</td>
                <td className="px-3 py-2">
                  <span className="text-sm font-semibold text-f1-text font-[var(--font-display)]">{d.name_acronym}</span>
                  <span className="ml-2 text-xs text-f1-text-muted">{d.team_name}</span>
                </td>
                <td className="px-3 py-2 text-right font-timing text-xs text-f1-text">{d.p90}</td>
                <td className="px-3 py-2 text-right font-timing text-xs text-f1-cyan font-bold">{(d.p90 * 2).toFixed(1)}</td>
                <td className="px-3 py-2 text-right font-timing text-xs text-f1-text-muted">{d.std_dev}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
