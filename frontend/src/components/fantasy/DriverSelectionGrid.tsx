import type { FantasyDriver } from '../../hooks/useFantasy';
import { DriverCard } from './DriverCard';

interface DriverSelectionGridProps {
  drivers: FantasyDriver[];
  selectedDrivers: number[];
  onToggleDriver: (driverNumber: number) => void;
  maxDrivers: number;
}

export function DriverSelectionGrid({
  drivers,
  selectedDrivers,
  onToggleDriver,
  maxDrivers,
}: DriverSelectionGridProps) {
  const atMax = selectedDrivers.length >= maxDrivers;

  return (
    <div className="bg-f1-surface rounded-lg border border-f1-border overflow-hidden">
      <div className="px-4 py-3 border-b border-f1-border flex items-center justify-between">
        <h3 className="text-xs font-semibold text-f1-text-muted uppercase tracking-wider font-[var(--font-display)]">
          Select Drivers
        </h3>
        <span className="font-timing text-xs text-f1-text-muted">
          {selectedDrivers.length}/{maxDrivers}
        </span>
      </div>
      <div className="p-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
        {drivers.map((driver) => (
          <DriverCard
            key={driver.driver_number}
            driver={driver}
            isSelected={selectedDrivers.includes(driver.driver_number)}
            onToggle={() => onToggleDriver(driver.driver_number)}
            disabled={atMax && !selectedDrivers.includes(driver.driver_number)}
          />
        ))}
      </div>
    </div>
  );
}
