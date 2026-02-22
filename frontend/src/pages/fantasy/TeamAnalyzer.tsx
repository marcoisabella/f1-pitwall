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

export function TeamAnalyzer() {
  const [allDrivers, setAllDrivers] = useState<SimDriver[]>([]);
  const [teamDrivers, setTeamDrivers] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/fantasy/simulate').then(r => r.json()),
      fetch('/api/fantasy/team').then(r => r.ok ? r.json() : { team: null }),
    ])
      .then(([sim, team]) => {
        setAllDrivers(sim.drivers ?? []);
        if (team.team?.drivers) setTeamDrivers(team.team.drivers);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingTelemetry />;

  const myTeam = allDrivers.filter(d => teamDrivers.includes(d.driver_number));
  const notOnTeam = allDrivers.filter(d => !teamDrivers.includes(d.driver_number));

  const teamExpected = myTeam.reduce((s, d) => s + d.mean_points, 0);
  const teamPrice = myTeam.reduce((s, d) => s + d.price, 0);
  const teamValue = teamPrice > 0 ? teamExpected / teamPrice : 0;

  // Find best transfer suggestions
  const transfers = myTeam.flatMap(out => {
    const budget = 100 - teamPrice + out.price;
    return notOnTeam
      .filter(inn => inn.price <= budget && inn.mean_points > out.mean_points)
      .map(inn => ({
        out,
        in: inn,
        pointsGain: inn.mean_points - out.mean_points,
        costDiff: inn.price - out.price,
      }));
  }).sort((a, b) => b.pointsGain - a.pointsGain).slice(0, 5);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold font-[var(--font-display)] text-f1-text">Team Analyzer</h1>
      <p className="text-xs text-f1-text-muted">Analyze your current team and find optimal transfers.</p>

      {myTeam.length === 0 ? (
        <div className="bg-f1-surface rounded-lg border border-f1-border p-8 text-center">
          <p className="text-f1-text-muted text-sm">No team saved. Create a team in the Team Calculator first.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-f1-surface rounded-lg border border-f1-border p-3">
              <div className="text-[10px] text-f1-text-muted uppercase">Expected Points</div>
              <div className="font-timing text-xl text-f1-green font-bold">{teamExpected.toFixed(1)}</div>
            </div>
            <div className="bg-f1-surface rounded-lg border border-f1-border p-3">
              <div className="text-[10px] text-f1-text-muted uppercase">Budget Used</div>
              <div className="font-timing text-xl text-f1-text">{teamPrice.toFixed(1)}M</div>
            </div>
            <div className="bg-f1-surface rounded-lg border border-f1-border p-3">
              <div className="text-[10px] text-f1-text-muted uppercase">Efficiency</div>
              <div className="font-timing text-xl text-f1-cyan">{teamValue.toFixed(2)}</div>
              <div className="text-[10px] text-f1-text-muted">pts/M</div>
            </div>
          </div>

          <h2 className="text-sm font-semibold text-f1-text font-[var(--font-display)]">Your Drivers</h2>
          <div className="bg-f1-surface rounded-lg border border-f1-border overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="text-[10px] text-f1-text-muted uppercase border-b border-f1-border">
                  <th className="text-left px-3 py-2">Driver</th>
                  <th className="text-left px-3 py-2">Team</th>
                  <th className="text-right px-3 py-2">Price</th>
                  <th className="text-right px-3 py-2">Exp. Pts</th>
                  <th className="text-right px-3 py-2">Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-f1-border">
                {myTeam.sort((a, b) => b.mean_points - a.mean_points).map(d => (
                  <tr key={d.driver_number}>
                    <td className="px-3 py-2">
                      <span className="text-sm font-semibold text-f1-text font-[var(--font-display)]">{d.name_acronym}</span>
                    </td>
                    <td className="px-3 py-2 text-xs text-f1-text-muted">{d.team_name}</td>
                    <td className="px-3 py-2 text-right font-timing text-xs text-f1-text">{d.price}M</td>
                    <td className="px-3 py-2 text-right font-timing text-xs text-f1-green font-bold">{d.mean_points}</td>
                    <td className="px-3 py-2 text-right font-timing text-xs text-f1-cyan">{d.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {transfers.length > 0 && (
            <>
              <h2 className="text-sm font-semibold text-f1-text font-[var(--font-display)]">Suggested Transfers</h2>
              <div className="space-y-2">
                {transfers.map((t, i) => (
                  <div key={i} className="bg-f1-surface rounded-lg border border-f1-border p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-center">
                        <div className="text-xs text-f1-red font-semibold font-[var(--font-display)]">{t.out.name_acronym}</div>
                        <div className="text-[10px] text-f1-text-muted">OUT</div>
                      </div>
                      <span className="text-f1-text-muted">→</span>
                      <div className="text-center">
                        <div className="text-xs text-f1-green font-semibold font-[var(--font-display)]">{t.in.name_acronym}</div>
                        <div className="text-[10px] text-f1-text-muted">IN</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-timing text-sm text-f1-green font-bold">+{t.pointsGain.toFixed(1)} pts</div>
                      <div className="font-timing text-[10px] text-f1-text-muted">
                        {t.costDiff > 0 ? '+' : ''}{t.costDiff.toFixed(1)}M
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
