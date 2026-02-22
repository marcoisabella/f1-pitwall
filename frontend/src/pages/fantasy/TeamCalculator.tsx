import { useState, useEffect } from 'react';
import { LoadingTelemetry } from '../../components/common/LoadingTelemetry';

interface SimDriver {
  driver_number: number;
  name_acronym: string;
  full_name: string;
  team_name: string;
  mean_points: number;
  median_points: number;
  p10: number;
  p90: number;
  std_dev: number;
  price: number;
  value: number;
}

export function TeamCalculator() {
  const [drivers, setDrivers] = useState<SimDriver[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/fantasy/simulate')
      .then(r => r.json())
      .then(data => setDrivers(data.drivers ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingTelemetry />;

  const toggleDriver = (num: number) => {
    setSelected(prev =>
      prev.includes(num) ? prev.filter(n => n !== num) : prev.length < 5 ? [...prev, num] : prev
    );
  };

  const totalExpected = selected.reduce((sum, num) => {
    const d = drivers.find(d => d.driver_number === num);
    return sum + (d?.mean_points ?? 0);
  }, 0);

  const totalPrice = selected.reduce((sum, num) => {
    const d = drivers.find(d => d.driver_number === num);
    return sum + (d?.price ?? 0);
  }, 0);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold font-[var(--font-display)] text-f1-text">Team Calculator</h1>
      <p className="text-xs text-f1-text-muted">Monte Carlo simulation (N=10,000). Select up to 5 drivers.</p>

      {selected.length > 0 && (
        <div className="bg-f1-surface rounded-lg border border-f1-border p-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs text-f1-text-muted">Team Expected Points</span>
              <div className="font-timing text-2xl text-f1-green font-bold">{totalExpected.toFixed(1)}</div>
            </div>
            <div>
              <span className="text-xs text-f1-text-muted">Budget Used</span>
              <div className={`font-timing text-lg font-bold ${totalPrice > 100 ? 'text-f1-red' : 'text-f1-text'}`}>
                {totalPrice.toFixed(1)}M / 100M
              </div>
            </div>
            <div>
              <span className="text-xs text-f1-text-muted">Drivers</span>
              <div className="font-timing text-lg text-f1-text">{selected.length}/5</div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-f1-surface rounded-lg border border-f1-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-[10px] text-f1-text-muted uppercase border-b border-f1-border">
                <th className="text-left px-3 py-2"></th>
                <th className="text-left px-3 py-2">Driver</th>
                <th className="text-left px-3 py-2">Team</th>
                <th className="text-right px-3 py-2">Price</th>
                <th className="text-right px-3 py-2">Exp. Pts</th>
                <th className="text-right px-3 py-2">P10</th>
                <th className="text-right px-3 py-2">P90</th>
                <th className="text-right px-3 py-2">Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-f1-border">
              {drivers.map(d => {
                const isSelected = selected.includes(d.driver_number);
                return (
                  <tr
                    key={d.driver_number}
                    onClick={() => toggleDriver(d.driver_number)}
                    className={`cursor-pointer transition-colors ${isSelected ? 'bg-f1-red/10' : 'hover:bg-f1-elevated/30'}`}
                  >
                    <td className="px-3 py-2">
                      <div className={`w-4 h-4 rounded border-2 ${isSelected ? 'bg-f1-red border-f1-red' : 'border-f1-border'}`} />
                    </td>
                    <td className="px-3 py-2">
                      <span className="text-sm font-semibold text-f1-text font-[var(--font-display)]">{d.name_acronym}</span>
                      <span className="ml-2 text-xs text-f1-text-muted">{d.full_name}</span>
                    </td>
                    <td className="px-3 py-2 text-xs text-f1-text-muted">{d.team_name}</td>
                    <td className="px-3 py-2 text-right font-timing text-xs text-f1-text">{d.price}M</td>
                    <td className="px-3 py-2 text-right font-timing text-xs text-f1-green font-bold">{d.mean_points}</td>
                    <td className="px-3 py-2 text-right font-timing text-xs text-f1-text-muted">{d.p10}</td>
                    <td className="px-3 py-2 text-right font-timing text-xs text-f1-text-muted">{d.p90}</td>
                    <td className="px-3 py-2 text-right font-timing text-xs text-f1-cyan">{d.value}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
