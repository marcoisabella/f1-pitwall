import type { OptimizedTeam, FantasyDriver, FantasyConstructor } from '../../hooks/useFantasy';

interface OptimizationSuggestionProps {
  team: OptimizedTeam;
  drivers: FantasyDriver[];
  constructors?: FantasyConstructor[];
  onApply: (driverNumbers: number[], constructorIds: string[]) => void;
}

export function OptimizationSuggestion({ team, drivers, constructors = [], onApply }: OptimizationSuggestionProps) {
  const driverMap = new Map(drivers.map(d => [d.driver_number, d]));
  const constructorMap = new Map(constructors.map(c => [c.constructor_id, c]));

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

      {team.constructors?.length > 0 && (
        <div className="space-y-1 mb-3 pt-2 border-t border-f1-purple/20">
          {team.constructors.map(id => {
            const c = constructorMap.get(id);
            return (
              <div key={id} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: c?.color || '#888' }} />
                  <span className="text-f1-text font-[var(--font-display)]">
                    {c?.name || id}
                  </span>
                </div>
                <span className="font-timing text-f1-text-muted">
                  ${c?.price || 0}M
                </span>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex justify-between text-xs mb-3">
        <span className="text-f1-text-muted">Expected Points</span>
        <span className="font-timing text-f1-cyan font-bold">{team.expected_points}</span>
      </div>
      <div className="flex justify-between text-xs mb-3">
        <span className="text-f1-text-muted">Budget Remaining</span>
        <span className="font-timing text-f1-green">${team.budget_remaining}M</span>
      </div>

      <button
        onClick={() => onApply(team.drivers, team.constructors || [])}
        className="w-full py-1.5 rounded text-xs font-[var(--font-display)] font-semibold tracking-wider bg-f1-purple/80 hover:bg-f1-purple text-white transition-colors"
      >
        APPLY
      </button>
    </div>
  );
}
