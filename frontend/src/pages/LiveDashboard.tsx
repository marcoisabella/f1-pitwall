import { useLiveTiming } from '../hooks/useLiveTiming';
import { LiveTimingBoard } from '../components/timing/LiveTimingBoard';
import { ConnectionStatus } from '../components/common/ConnectionStatus';
import { TrackMap } from '../components/live/TrackMap';
import { RaceControlFeed } from '../components/live/RaceControlFeed';
import { EnhancedWeather } from '../components/live/EnhancedWeather';

export function LiveDashboard() {
  const { drivers, weather, raceControl, sessionInfo, carPositions, sectorBests, connectionStatus } = useLiveTiming();

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

      {/* Main layout: timing (2/3) + side panels (1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: Timing board */}
        <div className="lg:col-span-2">
          <LiveTimingBoard drivers={drivers} sectorBests={sectorBests} />
        </div>

        {/* Right: Track map + Race control + Weather */}
        <div className="space-y-4">
          <TrackMap
            carPositions={carPositions}
            circuitKey={sessionInfo?.circuit_key}
            drivers={drivers}
          />
          <RaceControlFeed messages={raceControl} />
          <EnhancedWeather weather={weather} />
        </div>
      </div>
    </div>
  );
}
