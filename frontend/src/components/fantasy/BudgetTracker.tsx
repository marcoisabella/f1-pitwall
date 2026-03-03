import type { FantasyDriver, FantasyConstructor } from '../../hooks/useFantasy';

interface BudgetTrackerProps {
  selectedDrivers: number[];
  drivers: FantasyDriver[];
  selectedConstructors?: string[];
  constructors?: FantasyConstructor[];
  budget: number;
}

export function BudgetTracker({ selectedDrivers, drivers, selectedConstructors = [], constructors = [], budget }: BudgetTrackerProps) {
  const driverMap = new Map(drivers.map(d => [d.driver_number, d]));
  const constructorMap = new Map(constructors.map(c => [c.constructor_id, c]));

  const driverSpent = selectedDrivers.reduce((sum, num) => sum + (driverMap.get(num)?.price || 0), 0);
  const constructorSpent = selectedConstructors.reduce((sum, id) => sum + (constructorMap.get(id)?.price || 0), 0);
  const spent = driverSpent + constructorSpent;
  const remaining = budget - spent;
  const overBudget = remaining < 0;
  const pct = Math.min((spent / budget) * 100, 100);

  return (
    <div className="bg-f1-surface rounded-lg border border-f1-border p-4">
      <h3 className="text-xs font-semibold text-f1-text-muted uppercase tracking-wider font-[var(--font-display)] mb-3">
        Budget
      </h3>

      <div className="flex justify-between mb-2">
        <span className="font-timing text-sm text-f1-text">${spent.toFixed(1)}M</span>
        <span className={`font-timing text-sm ${overBudget ? 'text-f1-red' : 'text-f1-green'}`}>
          ${remaining.toFixed(1)}M left
        </span>
      </div>

      <div className="w-full h-2 bg-f1-bg rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${overBudget ? 'bg-f1-red' : 'bg-f1-green'}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="text-right mt-1">
        <span className="font-timing text-[10px] text-f1-text-muted">
          of ${budget}M
        </span>
      </div>

      {/* Selected driver list */}
      {selectedDrivers.length > 0 && (
        <div className="mt-3 space-y-1">
          {selectedDrivers.map(num => {
            const d = driverMap.get(num);
            return d ? (
              <div key={num} className="flex justify-between text-xs">
                <span className="text-f1-text font-[var(--font-display)]">{d.name_acronym}</span>
                <span className="font-timing text-f1-text-muted">${d.price}M</span>
              </div>
            ) : null;
          })}
        </div>
      )}

      {/* Selected constructor list */}
      {selectedConstructors.length > 0 && (
        <div className="mt-2 pt-2 border-t border-f1-border space-y-1">
          {selectedConstructors.map(id => {
            const c = constructorMap.get(id);
            return c ? (
              <div key={id} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />
                  <span className="text-f1-text font-[var(--font-display)]">{c.name}</span>
                </div>
                <span className="font-timing text-f1-text-muted">${c.price}M</span>
              </div>
            ) : null;
          })}
        </div>
      )}
    </div>
  );
}
