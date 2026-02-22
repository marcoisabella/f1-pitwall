import { useState, useEffect } from 'react';
import { LoadingTelemetry } from '../../components/common/LoadingTelemetry';

interface RoundScore {
  season: number;
  round: number;
  driver_number: number;
  points: number;
}

interface RoundResult {
  round: number;
  topDrivers: { driver_number: number; points: number }[];
  optimalPoints: number;
}

export function Hindsight() {
  const [scores, setScores] = useState<RoundScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRound, setSelectedRound] = useState<number | null>(null);

  useEffect(() => {
    fetch('/api/fantasy/historical/2025')
      .then(r => r.json())
      .then(data => setScores(data.scores ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingTelemetry />;

  const roundNumbers = [...new Set(scores.map(s => s.round))].sort((a, b) => a - b);

  const roundResults: RoundResult[] = roundNumbers.map(round => {
    const roundScores = scores.filter(s => s.round === round).sort((a, b) => b.points - a.points);
    const top5 = roundScores.slice(0, 5);
    return {
      round,
      topDrivers: top5,
      optimalPoints: top5.reduce((s, d) => s + d.points, 0),
    };
  });

  const activeRound = selectedRound ?? roundNumbers[roundNumbers.length - 1] ?? null;
  const activeResult = roundResults.find(r => r.round === activeRound);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold font-[var(--font-display)] text-f1-text">Hindsight</h1>
      <p className="text-xs text-f1-text-muted">See the optimal team for any past round.</p>

      {roundNumbers.length === 0 ? (
        <div className="bg-f1-surface rounded-lg border border-f1-border p-8 text-center">
          <p className="text-f1-text-muted text-sm">No historical data available yet.</p>
        </div>
      ) : (
        <>
          <div className="flex gap-1 flex-wrap">
            {roundNumbers.map(r => (
              <button
                key={r}
                onClick={() => setSelectedRound(r)}
                className={`w-8 h-8 rounded text-xs font-timing font-bold transition-colors ${
                  r === activeRound ? 'bg-f1-red text-white' : 'bg-f1-surface text-f1-text-muted border border-f1-border hover:text-f1-text'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          {activeResult && (
            <div className="bg-f1-surface rounded-lg border border-f1-border p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-f1-text font-[var(--font-display)]">
                  Round {activeResult.round} — Optimal Team
                </span>
                <span className="font-timing text-lg text-f1-green font-bold">
                  {activeResult.optimalPoints} pts
                </span>
              </div>

              <div className="space-y-2">
                {activeResult.topDrivers.map((d, i) => (
                  <div key={d.driver_number} className="flex items-center justify-between bg-f1-elevated rounded px-3 py-2">
                    <div className="flex items-center gap-3">
                      <span className="font-timing text-xs text-f1-text-muted w-4">{i + 1}.</span>
                      <span className="text-sm font-semibold text-f1-text font-[var(--font-display)]">#{d.driver_number}</span>
                    </div>
                    <span className="font-timing text-sm text-f1-green font-bold">{d.points} pts</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <h2 className="text-sm font-semibold text-f1-text font-[var(--font-display)]">All Rounds</h2>
          <div className="bg-f1-surface rounded-lg border border-f1-border overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="text-[10px] text-f1-text-muted uppercase border-b border-f1-border">
                  <th className="text-center px-3 py-2">Round</th>
                  <th className="text-right px-3 py-2">Optimal Pts</th>
                  <th className="text-left px-3 py-2">Top Scorer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-f1-border">
                {roundResults.map(r => (
                  <tr
                    key={r.round}
                    onClick={() => setSelectedRound(r.round)}
                    className={`cursor-pointer transition-colors ${r.round === activeRound ? 'bg-f1-red/10' : 'hover:bg-f1-elevated/30'}`}
                  >
                    <td className="px-3 py-2 text-center font-timing text-sm text-f1-text">R{r.round}</td>
                    <td className="px-3 py-2 text-right font-timing text-sm text-f1-green font-bold">{r.optimalPoints}</td>
                    <td className="px-3 py-2 font-timing text-xs text-f1-text-muted">
                      #{r.topDrivers[0]?.driver_number ?? '—'} ({r.topDrivers[0]?.points ?? 0} pts)
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
