import { useState, useEffect } from 'react';
import { LoadingTelemetry } from '../../components/common/LoadingTelemetry';

interface ChipRecommendation {
  chip: string;
  recommended_round: number;
  reason: string;
  expected_gain: number;
}

const CHIP_LABELS: Record<string, { name: string; color: string }> = {
  drsBoost: { name: 'DRS Boost', color: 'text-f1-green' },
  wildcard: { name: 'Wildcard', color: 'text-f1-purple' },
  limitless: { name: 'Limitless', color: 'text-f1-cyan' },
  extraDrs: { name: 'Extra DRS', color: 'text-f1-yellow' },
};

export function ChipStrategy() {
  const [recommendations, setRecommendations] = useState<ChipRecommendation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/fantasy/chips/recommend')
      .then(r => r.json())
      .then(data => setRecommendations(data.recommendations ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingTelemetry />;

  // Build a calendar view of 24 rounds
  const roundChips = new Map<number, ChipRecommendation>();
  for (const rec of recommendations) {
    roundChips.set(rec.recommended_round, rec);
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold font-[var(--font-display)] text-f1-text">Chip Strategy</h1>
      <p className="text-xs text-f1-text-muted">Optimal chip usage schedule for the season.</p>

      <div className="grid grid-cols-4 gap-3">
        {Object.entries(CHIP_LABELS).map(([key, { name, color }]) => {
          const rec = recommendations.find(r => r.chip === key);
          return (
            <div key={key} className="bg-f1-surface rounded-lg border border-f1-border p-3">
              <div className={`text-xs font-semibold ${color}`}>{name}</div>
              {rec ? (
                <>
                  <div className="font-timing text-lg text-f1-text mt-1">Round {rec.recommended_round}</div>
                  <div className="text-[10px] text-f1-text-muted mt-0.5">{rec.reason}</div>
                  <div className="font-timing text-xs text-f1-green mt-1">+{rec.expected_gain.toFixed(1)} pts</div>
                </>
              ) : (
                <div className="text-xs text-f1-text-muted mt-1">Available</div>
              )}
            </div>
          );
        })}
      </div>

      <h2 className="text-sm font-semibold text-f1-text font-[var(--font-display)]">Season Calendar</h2>
      <div className="grid grid-cols-6 md:grid-cols-8 lg:grid-cols-12 gap-1">
        {Array.from({ length: 24 }, (_, i) => {
          const round = i + 1;
          const chip = roundChips.get(round);
          const chipInfo = chip ? CHIP_LABELS[chip.chip] : null;
          return (
            <div
              key={round}
              className={`rounded p-2 text-center border transition-colors ${
                chip
                  ? 'bg-f1-surface border-f1-border'
                  : 'bg-f1-elevated/30 border-transparent'
              }`}
              title={chip ? `${chipInfo?.name}: ${chip.reason}` : `Round ${round}`}
            >
              <div className="font-timing text-[10px] text-f1-text-muted">R{round}</div>
              {chipInfo && (
                <div className={`text-[9px] font-semibold mt-0.5 ${chipInfo.color}`}>
                  {chipInfo.name.split(' ')[0]}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {recommendations.length > 0 && (
        <>
          <h2 className="text-sm font-semibold text-f1-text font-[var(--font-display)]">Recommendations</h2>
          <div className="space-y-2">
            {recommendations.map((rec, i) => {
              const chipInfo = CHIP_LABELS[rec.chip] ?? { name: rec.chip, color: 'text-f1-text' };
              return (
                <div key={i} className="bg-f1-surface rounded-lg border border-f1-border p-3 flex items-center justify-between">
                  <div>
                    <div className={`text-sm font-semibold ${chipInfo.color}`}>{chipInfo.name}</div>
                    <div className="text-xs text-f1-text-muted">{rec.reason}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-timing text-sm text-f1-text">Round {rec.recommended_round}</div>
                    <div className="font-timing text-xs text-f1-green">+{rec.expected_gain.toFixed(1)} pts</div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
