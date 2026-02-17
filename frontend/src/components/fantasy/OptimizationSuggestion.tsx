import type { OptimizedTeam, FantasyDriver } from '../../hooks/useFantasy';

interface OptimizationSuggestionProps {
  team: OptimizedTeam;
  drivers: FantasyDriver[];
  onApply: (driverNumbers: number[]) => void;
}

export function OptimizationSuggestion({ team, drivers, onApply }: OptimizationSuggestionProps) {
  const driverMap = new Map(drivers.map(d => [d.driver_number, d]));

  return (
    <div className="bg-f1-purple/10 rounded-lg border border-f1-purple/30 p-4">
      <h3 className="text-xs font-semibold text-f1-purple uppercase tracking-wider font-[var(--font-display)] mb-3">
        AI Recommendation
      </h3>

      <div className="space-y-1 mb-3">
        {team.drivers.map(num => {
          const d = driverMap.get(num);
          return (
            <div key={num} className="flex justify-between text-xs">
              <span className="text-f1-text font-[var(--font-display)]">
                {d?.name_acronym || `#${num}`}
              </span>
              <span className="font-timing text-f1-text-muted">
                ${d?.price || 0}M
              </span>
            </div>
          );
        })}
      </div>

      <div className="flex justify-between text-xs mb-3">
        <span className="text-f1-text-muted">Expected Points</span>
        <span className="font-timing text-f1-cyan font-bold">{team.expected_points}</span>
      </div>
      <div className="flex justify-between text-xs mb-3">
        <span className="text-f1-text-muted">Budget Remaining</span>
        <span className="font-timing text-f1-green">${team.budget_remaining}M</span>
      </div>

      <button
        onClick={() => onApply(team.drivers)}
        className="w-full py-1.5 rounded text-xs font-[var(--font-display)] font-semibold tracking-wider bg-f1-purple/80 hover:bg-f1-purple text-white transition-colors"
      >
        APPLY
      </button>
    </div>
  );
}
