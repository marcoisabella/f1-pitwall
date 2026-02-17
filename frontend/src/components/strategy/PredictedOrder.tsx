import type { RacePrediction } from '../../hooks/usePredictions';
import { getTeamColor } from '../../utils/teamColors';

interface PredictedOrderProps {
  predictions: RacePrediction[];
  selectedDriver: number | null;
  onSelectDriver: (driverNumber: number) => void;
}

export function PredictedOrder({ predictions, selectedDriver, onSelectDriver }: PredictedOrderProps) {
  if (predictions.length === 0) {
    return (
      <div className="bg-f1-surface rounded-lg border border-f1-border p-6 text-center text-f1-text-muted">
        No predictions available
      </div>
    );
  }

  return (
    <div className="bg-f1-surface rounded-lg border border-f1-border overflow-hidden">
      <div className="px-4 py-3 border-b border-f1-border">
        <h3 className="text-xs font-semibold text-f1-text-muted uppercase tracking-wider font-[var(--font-display)]">
          Predicted Finishing Order
        </h3>
      </div>

      {/* Header */}
      <div className="grid grid-cols-[2.5rem_1fr_4rem_4rem_5rem] gap-2 px-4 py-2 text-[10px] font-semibold text-f1-text-muted uppercase tracking-wider border-b border-f1-border">
        <div>POS</div>
        <div>DRIVER</div>
        <div className="text-center">GRID</div>
        <div className="text-center">DIFF</div>
        <div className="text-right">CONF</div>
      </div>

      {/* Rows */}
      {predictions.map((pred) => {
        const diff = pred.grid_position - pred.predicted_position;
        const teamColor = getTeamColor(pred.team_name);
        const isSelected = selectedDriver === pred.driver_number;

        return (
          <button
            key={pred.driver_number}
            onClick={() => onSelectDriver(pred.driver_number)}
            className={`w-full grid grid-cols-[2.5rem_1fr_4rem_4rem_5rem] gap-2 px-4 py-2 items-center border-b border-f1-border/50 text-sm transition-colors text-left ${
              isSelected ? 'bg-f1-elevated' : 'hover:bg-f1-elevated/30'
            }`}
            style={{ borderLeftWidth: '3px', borderLeftColor: teamColor }}
          >
            <div className="font-timing font-bold text-f1-text">
              {pred.predicted_position}
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-f1-text font-[var(--font-display)]">
                {pred.name_acronym}
              </span>
            </div>
            <div className="text-center font-timing text-f1-text-muted text-xs">
              P{pred.grid_position}
            </div>
            <div className={`text-center font-timing text-xs font-bold ${
              diff > 0 ? 'text-f1-green' : diff < 0 ? 'text-f1-red' : 'text-f1-text-muted'
            }`}>
              {diff > 0 ? `+${diff}` : diff < 0 ? `${diff}` : '—'}
            </div>
            <div className="text-right">
              <div className="flex items-center justify-end gap-1">
                <div className="w-12 h-1.5 bg-f1-bg rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-f1-cyan"
                    style={{ width: `${pred.confidence * 100}%` }}
                  />
                </div>
                <span className="font-timing text-[10px] text-f1-text-muted">
                  {Math.round(pred.confidence * 100)}%
                </span>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
