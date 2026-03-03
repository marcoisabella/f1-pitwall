import type { FantasyConstructor } from '../../hooks/useFantasy';
import { ConstructorCard } from './ConstructorCard';

interface ConstructorSelectionGridProps {
  constructors: FantasyConstructor[];
  selectedConstructors: string[];
  onToggleConstructor: (constructorId: string) => void;
  maxConstructors: number;
}

export function ConstructorSelectionGrid({
  constructors,
  selectedConstructors,
  onToggleConstructor,
  maxConstructors,
}: ConstructorSelectionGridProps) {
  const atMax = selectedConstructors.length >= maxConstructors;

  return (
    <div className="bg-f1-surface rounded-lg border border-f1-border overflow-hidden">
      <div className="px-4 py-3 border-b border-f1-border flex items-center justify-between">
        <h3 className="text-xs font-semibold text-f1-text-muted uppercase tracking-wider font-[var(--font-display)]">
          Select Constructors
        </h3>
        <span className="font-timing text-xs text-f1-text-muted">
          {selectedConstructors.length}/{maxConstructors}
        </span>
      </div>
      <div className="p-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
        {constructors.map((c) => (
          <ConstructorCard
            key={c.constructor_id}
            constructor={c}
            isSelected={selectedConstructors.includes(c.constructor_id)}
            onToggle={() => onToggleConstructor(c.constructor_id)}
            disabled={atMax && !selectedConstructors.includes(c.constructor_id)}
          />
        ))}
      </div>
    </div>
  );
}
