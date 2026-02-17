import { useLiveTiming } from '../hooks/useLiveTiming';
import { LiveTimingBoard } from '../components/timing/LiveTimingBoard';
import { ConnectionStatus } from '../components/common/ConnectionStatus';

export function LiveDashboard() {
  const { drivers, weather, sessionInfo, connectionStatus } = useLiveTiming();

  return (
    <div className="space-y-4">
      {/* Top bar: session info + weather strip + connection status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {sessionInfo ? (
            <>
              <span className="text-sm font-semibold text-f1-text font-[var(--font-display)]">
                {sessionInfo.circuit_short_name}
              </span>
              <span className="text-xs text-f1-text-muted font-[var(--font-display)]">
                {sessionInfo.session_name}
              </span>
              {weather && (
                <span className="text-xs font-timing text-f1-text-muted">
                  {weather.air_temperature}°C / Track {weather.track_temperature}°C
                </span>
              )}
            </>
          ) : (
            <span className="text-sm text-f1-text-muted font-[var(--font-display)]">
              No Active Session
            </span>
          )}
        </div>
        <ConnectionStatus status={connectionStatus} />
      </div>

      {/* Timing board */}
      <LiveTimingBoard drivers={drivers} />
    </div>
  );
}
