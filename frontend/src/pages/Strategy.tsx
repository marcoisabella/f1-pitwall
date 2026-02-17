import { useEffect, useState } from 'react';
import { usePredictions } from '../hooks/usePredictions';
import type { StrategyPrediction } from '../hooks/usePredictions';
import { PredictedOrder } from '../components/strategy/PredictedOrder';
import { PitWindowChart } from '../components/strategy/PitWindowChart';
import { TireDegradationChart } from '../components/strategy/TireDegradationChart';
import { LoadingTelemetry } from '../components/common/LoadingTelemetry';

export function Strategy() {
  const { racePredictions, isLoading, error, fetchStrategy } = usePredictions();
  const [selectedDriver, setSelectedDriver] = useState<number | null>(null);
  const [strategy, setStrategy] = useState<StrategyPrediction | null>(null);
  const [loadingStrategy, setLoadingStrategy] = useState(false);

  useEffect(() => {
    if (!selectedDriver) {
      setStrategy(null);
      return;
    }
    setLoadingStrategy(true);
    fetchStrategy(selectedDriver)
      .then(setStrategy)
      .finally(() => setLoadingStrategy(false));
  }, [selectedDriver, fetchStrategy]);

  // Auto-select first driver when predictions load
  useEffect(() => {
    if (racePredictions.length > 0 && !selectedDriver) {
      setSelectedDriver(racePredictions[0].driver_number);
    }
  }, [racePredictions, selectedDriver]);

  if (isLoading) return <LoadingTelemetry />;

  if (error) {
    return (
      <div className="text-center text-f1-text-muted py-12">
        <div className="text-f1-red text-sm">{error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-semibold text-f1-text-muted uppercase tracking-wider font-[var(--font-display)]">
        Strategy Analysis
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: Predicted finishing order */}
        <PredictedOrder
          predictions={racePredictions}
          selectedDriver={selectedDriver}
          onSelectDriver={setSelectedDriver}
        />

        {/* Right: Strategy details for selected driver */}
        <div className="space-y-4">
          {loadingStrategy ? (
            <LoadingTelemetry />
          ) : strategy ? (
            <>
              <PitWindowChart strategy={strategy} />
              <TireDegradationChart strategy={strategy} />
            </>
          ) : (
            <div className="bg-f1-surface rounded-lg border border-f1-border p-6 text-center text-f1-text-muted text-sm">
              Select a driver to view strategy
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
