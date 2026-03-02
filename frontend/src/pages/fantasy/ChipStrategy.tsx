import { useState, useEffect } from 'react';
import { LoadingTelemetry } from '../../components/common/LoadingTelemetry';
import { useAuth } from '../../contexts/AuthContext';
import { useFantasy } from '../../hooks/useFantasy';
import { PageHeader } from '../../components/fantasy/PageHeader';

interface ChipRecommendation {
  chip: string;
  recommended_round: number;
  reason: string;
  expected_gain: number;
}

const CHIP_LABELS: Record<string, { name: string; color: string; bg: string }> = {
  autopilot: { name: 'Autopilot', color: 'text-f1-green', bg: 'bg-f1-green' },
  extra_drs: { name: '3x Boost', color: 'text-f1-yellow', bg: 'bg-f1-yellow' },
  no_negative: { name: 'No Negative', color: 'text-f1-cyan', bg: 'bg-f1-cyan' },
  wildcard: { name: 'Wildcard', color: 'text-f1-purple', bg: 'bg-f1-purple' },
  limitless: { name: 'Limitless', color: 'text-f1-red', bg: 'bg-f1-red' },
  final_fix: { name: 'Final Fix', color: 'text-f1-text', bg: 'bg-f1-text' },
};

export function ChipStrategy() {
  const { user } = useAuth();
  const { settings, activateChip } = useFantasy();
  const [recommendations, setRecommendations] = useState<ChipRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activatingChip, setActivatingChip] = useState<string | null>(null);
  const [chipError, setChipError] = useState<string | null>(null);

  const chipsUsed = settings?.chips_used ?? {};

  useEffect(() => {
    fetch('/api/fantasy/chips/recommend')
      .then(r => r.json())
      .then(data => setRecommendations(data.recommendations ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingTelemetry />;

  const roundChips = new Map<number, ChipRecommendation>();
  for (const rec of recommendations) {
    roundChips.set(rec.recommended_round, rec);
  }

  const handleActivate = async (chip: string, round: number) => {
    if (!user) return;
    setActivatingChip(chip);
    setChipError(null);
    try {
      await activateChip(chip, round);
    } catch (e) {
      setChipError(e instanceof Error ? e.message : 'Failed');
    } finally {
      setActivatingChip(null);
    }
  };

  const usedCount = Object.keys(chipsUsed).length;
  const totalChips = Object.keys(CHIP_LABELS).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Chip Strategy"
        subtitle="Plan your chip usage across the season. 6 chips available, each usable once. 2x Boost is applied weekly and is not a chip."
      />

      {chipError && (
        <div className="text-xs text-f1-red bg-f1-red/10 rounded-lg px-3 py-2 border border-f1-red/20">
          {chipError}
        </div>
      )}

      {/* Chips used counter */}
      <div className="flex items-center justify-center gap-2">
        <span className="text-[10px] text-f1-text-muted uppercase tracking-wider">Chips Used</span>
        <span className="font-timing text-sm text-white">{usedCount} / {totalChips}</span>
      </div>

      {/* Chip cards grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {Object.entries(CHIP_LABELS).map(([key, { name, color, bg }]) => {
          const rec = recommendations.find(r => r.chip === key);
          const usedRound = chipsUsed[key];
          const isUsed = usedRound !== undefined;

          return (
            <div
              key={key}
              className={`bg-f1-surface rounded-xl border border-f1-border p-4 transition-opacity ${isUsed ? 'opacity-50' : ''}`}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-2 h-2 rounded-full ${bg} ${isUsed ? 'opacity-50' : ''}`} />
                <span className={`text-xs font-bold ${color}`}>{name}</span>
              </div>

              {isUsed ? (
                <div className="text-xs text-f1-text-muted font-timing">
                  Used in R{usedRound}
                </div>
              ) : rec ? (
                <div className="space-y-1.5">
                  <div className="font-timing text-xl text-white font-bold">
                    Round {rec.recommended_round}
                  </div>
                  <div className="text-[10px] text-f1-text-muted leading-relaxed">
                    {rec.reason}
                  </div>
                  <div className="font-timing text-sm text-f1-green font-bold">
                    +{rec.expected_gain.toFixed(1)} pts
                  </div>
                  {user && (
                    <button
                      onClick={() => handleActivate(key, rec.recommended_round)}
                      disabled={activatingChip === key}
                      className="mt-1 bg-f1-red hover:bg-f1-red/80 text-white px-4 py-2 rounded-lg font-bold text-sm transition-colors disabled:opacity-40"
                    >
                      {activatingChip === key ? 'Activating...' : `Activate for R${rec.recommended_round}`}
                    </button>
                  )}
                </div>
              ) : (
                <div className="text-xs text-f1-text-muted">Available</div>
              )}
            </div>
          );
        })}
      </div>

      {/* Season Calendar */}
      <div className="bg-f1-surface rounded-xl border border-f1-border p-4">
        <h2 className="text-sm font-semibold text-white font-[var(--font-display)] mb-3">
          Season Calendar
        </h2>
        <div className="grid grid-cols-6 md:grid-cols-8 lg:grid-cols-12 gap-1.5">
          {Array.from({ length: 24 }, (_, i) => {
            const round = i + 1;
            const chip = roundChips.get(round);
            const chipInfo = chip ? CHIP_LABELS[chip.chip] : null;
            const usedChipKey = Object.entries(chipsUsed).find(([, r]) => r === round)?.[0];
            const usedChipInfo = usedChipKey ? CHIP_LABELS[usedChipKey] : null;

            return (
              <div
                key={round}
                className={`rounded-lg p-2 text-center transition-colors ${
                  usedChipInfo
                    ? 'bg-f1-green/10 border border-f1-green/30'
                    : chip
                    ? 'bg-f1-elevated border border-f1-border'
                    : 'bg-f1-elevated/20 border border-transparent'
                }`}
                title={chip ? `${chipInfo?.name}: ${chip.reason}` : `Round ${round}`}
              >
                <div className="font-timing text-[10px] text-f1-text-muted">R{round}</div>
                {usedChipInfo ? (
                  <div className={`text-[9px] font-bold mt-0.5 ${usedChipInfo.color}`}>
                    {usedChipInfo.name.split(' ')[0]}
                  </div>
                ) : chipInfo && (
                  <div className={`text-[9px] font-bold mt-0.5 ${chipInfo.color}`}>
                    {chipInfo.name.split(' ')[0]}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Recommendations list */}
      {recommendations.length > 0 && (
        <div className="bg-f1-surface rounded-xl border border-f1-border p-4">
          <h2 className="text-sm font-semibold text-white font-[var(--font-display)] mb-3">
            Recommendations
          </h2>
          <div className="space-y-2">
            {recommendations.map((rec, i) => {
              const chipInfo = CHIP_LABELS[rec.chip] ?? { name: rec.chip, color: 'text-f1-text', bg: 'bg-f1-text' };
              const isUsed = chipsUsed[rec.chip] !== undefined;
              return (
                <div
                  key={i}
                  className={`rounded-lg border border-f1-border bg-f1-elevated/30 p-3 flex items-center justify-between transition-opacity ${isUsed ? 'opacity-50' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${chipInfo.bg}`} />
                    <div>
                      <div className={`text-sm font-bold ${chipInfo.color}`}>
                        {chipInfo.name}
                        {isUsed && <span className="ml-2 text-[10px] text-f1-text-muted">(Used)</span>}
                      </div>
                      <div className="text-xs text-f1-text-muted">{rec.reason}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-timing text-sm text-white">Round {rec.recommended_round}</div>
                    <div className="font-timing text-xs text-f1-green font-bold">+{rec.expected_gain.toFixed(1)} pts</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
