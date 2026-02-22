import { useState, useEffect } from 'react';
import { LoadingTelemetry } from '../../components/common/LoadingTelemetry';

interface DriverStat {
  driver_number: number;
  name_acronym: string;
  full_name: string;
  team_name: string;
  price: number;
  predicted_points: number;
  form_score: number;
  mean_points: number;
  std_dev: number;
  p10: number;
  p90: number;
  value: number;
  consistency: number;
}

export function EliteData() {
  const [drivers, setDrivers] = useState<DriverStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'value' | 'form' | 'consistency'>('value');

  useEffect(() => {
    fetch('/api/fantasy/statistics')
      .then(r => r.json())
      .then(data => setDrivers(data.drivers ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingTelemetry />;

  const sorted = [...drivers].sort((a, b) => {
    if (sortBy === 'value') return b.value - a.value;
    if (sortBy === 'form') return b.form_score - a.form_score;
    return b.consistency - a.consistency;
  });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold font-[var(--font-display)] text-f1-text">Elite Data</h1>
      <p className="text-xs text-f1-text-muted">Advanced driver metrics for fantasy decision-making.</p>

      <div className="flex gap-2">
        {(['value', 'form', 'consistency'] as const).map(key => (
          <button
            key={key}
            onClick={() => setSortBy(key)}
            className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors ${
              sortBy === key ? 'bg-f1-red text-white' : 'bg-f1-surface text-f1-text-muted border border-f1-border hover:text-f1-text'
            }`}
          >
            {key === 'value' ? 'Value' : key === 'form' ? 'Form' : 'Consistency'}
          </button>
        ))}
      </div>

      <div className="bg-f1-surface rounded-lg border border-f1-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-[10px] text-f1-text-muted uppercase border-b border-f1-border">
                <th className="text-left px-3 py-2">Driver</th>
                <th className="text-left px-3 py-2">Team</th>
                <th className="text-right px-3 py-2">Price</th>
                <th className="text-right px-3 py-2">Form</th>
                <th className="text-right px-3 py-2">Value</th>
                <th className="text-right px-3 py-2">Consistency</th>
                <th className="text-right px-3 py-2">P10-P90</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-f1-border">
              {sorted.map(d => (
                <tr key={d.driver_number} className="hover:bg-f1-elevated/30 transition-colors">
                  <td className="px-3 py-2">
                    <span className="text-sm font-semibold text-f1-text font-[var(--font-display)]">{d.name_acronym}</span>
                    <span className="ml-2 text-xs text-f1-text-muted">{d.full_name}</span>
                  </td>
                  <td className="px-3 py-2 text-xs text-f1-text-muted">{d.team_name}</td>
                  <td className="px-3 py-2 text-right font-timing text-xs text-f1-text">{d.price}M</td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <span className={`text-xs ${d.form_score >= 0.7 ? 'text-f1-green' : d.form_score >= 0.4 ? 'text-f1-yellow' : 'text-f1-red'}`}>
                        {d.form_score >= 0.7 ? '▲' : d.form_score >= 0.4 ? '—' : '▼'}
                      </span>
                      <span className="font-timing text-xs text-f1-text">{(d.form_score * 100).toFixed(0)}%</span>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-right font-timing text-xs text-f1-cyan font-bold">{d.value}</td>
                  <td className="px-3 py-2 text-right">
                    <div className="w-16 bg-f1-elevated rounded-full h-1.5 ml-auto">
                      <div
                        className="h-1.5 rounded-full bg-f1-green"
                        style={{ width: `${Math.max(0, Math.min(100, d.consistency * 100))}%` }}
                      />
                    </div>
                  </td>
                  <td className="px-3 py-2 text-right font-timing text-[10px] text-f1-text-muted">
                    {d.p10}–{d.p90}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
