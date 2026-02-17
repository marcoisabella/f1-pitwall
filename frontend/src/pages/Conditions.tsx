import { useLiveTiming } from '../hooks/useLiveTiming';
import { WeatherPanel } from '../components/conditions/WeatherPanel';
import { TrackConditions } from '../components/conditions/TrackConditions';

export function Conditions() {
  const { weather, raceControl } = useLiveTiming();

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-semibold text-f1-text-muted uppercase tracking-wider font-[var(--font-display)]">
        Track Conditions
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <WeatherPanel weather={weather} />
        <TrackConditions raceControl={raceControl} />
      </div>
    </div>
  );
}
