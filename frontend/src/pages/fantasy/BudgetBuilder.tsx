import { useState, useEffect } from 'react';
import { LoadingTelemetry } from '../../components/common/LoadingTelemetry';

interface OptimizedTeam {
  drivers: {
    driver_number: number;
    name_acronym: string;
    full_name: string;
    team_name: string;
    price: number;
    mean_points: number;
    p90: number;
    value: number;
  }[];
  total_price: number;
  total_expected: number;
  budget_remaining: number;
}

export function BudgetBuilder() {
  const [mode, setMode] = useState<'value' | 'ceiling'>('value');
  const [team, setTeam] = useState<OptimizedTeam | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/fantasy/optimize/mc?mode=${mode}`)
      .then(r => r.json())
      .then(data => setTeam(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [mode]);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold font-[var(--font-display)] text-f1-text">Budget Builder</h1>
      <p className="text-xs text-f1-text-muted">AI-optimized team suggestions within 100M budget.</p>

      <div className="flex gap-2">
        <button
          onClick={() => setMode('value')}
          className={`px-4 py-2 rounded text-xs font-semibold transition-colors ${
            mode === 'value' ? 'bg-f1-red text-white' : 'bg-f1-surface text-f1-text-muted border border-f1-border hover:text-f1-text'
          }`}
        >
          Best Value
        </button>
        <button
          onClick={() => setMode('ceiling')}
          className={`px-4 py-2 rounded text-xs font-semibold transition-colors ${
            mode === 'ceiling' ? 'bg-f1-red text-white' : 'bg-f1-surface text-f1-text-muted border border-f1-border hover:text-f1-text'
          }`}
        >
          Highest Ceiling
        </button>
      </div>

      {loading ? (
        <LoadingTelemetry />
      ) : team ? (
        <>
          <div className="bg-f1-surface rounded-lg border border-f1-border p-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-f1-text-muted">Expected Points</span>
                <div className="font-timing text-2xl text-f1-green font-bold">
                  {team.total_expected?.toFixed(1) ?? '—'}
                </div>
              </div>
              <div>
                <span className="text-xs text-f1-text-muted">Budget Used</span>
                <div className="font-timing text-lg text-f1-text">
                  {team.total_price?.toFixed(1) ?? '—'}M / 100M
                </div>
              </div>
              <div>
                <span className="text-xs text-f1-text-muted">Remaining</span>
                <div className="font-timing text-lg text-f1-cyan">
                  {team.budget_remaining?.toFixed(1) ?? '—'}M
                </div>
              </div>
            </div>
          </div>

          <div className="bg-f1-surface rounded-lg border border-f1-border overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="text-[10px] text-f1-text-muted uppercase border-b border-f1-border">
                  <th className="text-left px-3 py-2">Driver</th>
                  <th className="text-left px-3 py-2">Team</th>
                  <th className="text-right px-3 py-2">Price</th>
                  <th className="text-right px-3 py-2">{mode === 'value' ? 'Exp. Pts' : 'P90'}</th>
                  <th className="text-right px-3 py-2">Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-f1-border">
                {team.drivers?.map(d => (
                  <tr key={d.driver_number}>
                    <td className="px-3 py-2">
                      <span className="text-sm font-semibold text-f1-text font-[var(--font-display)]">{d.name_acronym}</span>
                      <span className="ml-2 text-xs text-f1-text-muted">{d.full_name}</span>
                    </td>
                    <td className="px-3 py-2 text-xs text-f1-text-muted">{d.team_name}</td>
                    <td className="px-3 py-2 text-right font-timing text-xs text-f1-text">{d.price}M</td>
                    <td className="px-3 py-2 text-right font-timing text-xs text-f1-green font-bold">
                      {mode === 'value' ? d.mean_points : d.p90}
                    </td>
                    <td className="px-3 py-2 text-right font-timing text-xs text-f1-cyan">{d.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="text-f1-text-muted text-sm">No optimization data available.</div>
      )}
    </div>
  );
}
