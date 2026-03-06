import { useState, useEffect } from 'react';
import { useLiveTiming } from '../hooks/useLiveTiming';
import { LiveTimingBoard } from '../components/timing/LiveTimingBoard';
import { ConnectionStatus } from '../components/common/ConnectionStatus';
import { TrackMap } from '../components/live/TrackMap';
import { RaceControlFeed } from '../components/live/RaceControlFeed';
import { EnhancedWeather } from '../components/live/EnhancedWeather';
import type { CarPosition, Driver, RaceControl, SectorBests, Session, Weather } from '../types/f1';

function SessionTimer({ session }: { session: Session }) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const start = new Date(session.date_start).getTime();
  const end = new Date(session.date_end).getTime();

  if (now < start) {
    // Session hasn't started
    const diff = start - now;
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    return (
      <span className="font-timing text-xs text-f1-yellow">
        STARTS IN {h > 0 ? `${h}:` : ''}{String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}
      </span>
    );
  }

  if (now > end) {
    return (
      <span className="font-timing text-xs text-f1-text-muted">
        SESSION ENDED
      </span>
    );
  }

  // Session in progress — show remaining time
  const remaining = end - now;
  const h = Math.floor(remaining / 3600000);
  const m = Math.floor((remaining % 3600000) / 60000);
  const s = Math.floor((remaining % 60000) / 1000);

  return (
    <span className="font-timing text-xs text-f1-green">
      {h > 0 ? `${h}:` : ''}{String(m).padStart(2, '0')}:{String(s).padStart(2, '0')} REMAINING
    </span>
  );
}

/* ---------- Sub-view types ---------- */

type LiveView = 'dashboard' | 'trackmap' | 'conditions';

const NAV_ITEMS: { id: LiveView; label: string; icon: string }[] = [
  { id: 'dashboard', label: 'Dash', icon: '\u25A6' },
  { id: 'trackmap', label: 'Map', icon: '\u25CE' },
  { id: 'conditions', label: 'Cond', icon: '\u2601' },
];

/* ---------- DashboardView ---------- */

interface DashboardViewProps {
  drivers: Driver[];
  sectorBests: SectorBests;
  carPositions: CarPosition[];
  sessionInfo: Session | null;
  raceControl: RaceControl[];
  sessionStatus: 'live' | 'ended' | 'upcoming' | null;
}

function DashboardView({ drivers, sectorBests, carPositions, sessionInfo, raceControl, sessionStatus }: DashboardViewProps) {
  return (
    <div className="flex gap-3 h-full">
      {/* Left: Timing tower (~58%) */}
      <div className="flex-[58] min-w-0 overflow-auto">
        <LiveTimingBoard drivers={drivers} sectorBests={sectorBests} />
      </div>
      {/* Right: Track map (~60%) + race control (~40%) */}
      <div className="flex-[42] flex flex-col gap-3 min-w-0">
        <div className="flex-[60]">
          <TrackMap carPositions={carPositions} circuitKey={sessionInfo?.circuit_key} drivers={drivers} sessionStatus={sessionStatus} />
        </div>
        <div className="flex-[40] overflow-auto">
          <RaceControlFeed messages={raceControl} />
        </div>
      </div>
    </div>
  );
}

/* ---------- TrackMapView ---------- */

interface TrackMapViewProps {
  carPositions: CarPosition[];
  sessionInfo: Session | null;
  drivers: Driver[];
  sessionStatus: 'live' | 'ended' | 'upcoming' | null;
}

function TrackMapView({ carPositions, sessionInfo, drivers, sessionStatus }: TrackMapViewProps) {
  return (
    <div className="h-full">
      <TrackMap carPositions={carPositions} circuitKey={sessionInfo?.circuit_key} drivers={drivers} sessionStatus={sessionStatus} fullPage />
    </div>
  );
}

/* ---------- ConditionsView ---------- */

interface ConditionsViewProps {
  weather: Weather | null;
  raceControl: RaceControl[];
}

function ConditionsView({ weather, raceControl }: ConditionsViewProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <EnhancedWeather weather={weather} />
      <RaceControlFeed messages={raceControl} />
    </div>
  );
}

/* ---------- LiveDashboard ---------- */

export function LiveDashboard() {
  const { drivers, weather, raceControl, sessionInfo, carPositions, sectorBests, connectionStatus, sessionStatus } = useLiveTiming();
  const [activeView, setActiveView] = useState<LiveView>('dashboard');

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Top bar: session info + weather strip + connection status */}
      <div className="flex items-center justify-between px-4 py-2 shrink-0">
        <div className="flex items-center gap-4">
          {sessionInfo ? (
            <>
              <span className="text-sm font-semibold text-f1-text font-[var(--font-display)]">
                {sessionInfo.circuit_short_name}
              </span>
              <span className="text-xs text-f1-text-muted font-[var(--font-display)]">
                {sessionInfo.session_name}
              </span>
              <SessionTimer session={sessionInfo} />
              {weather && (
                <span className="text-xs font-timing text-f1-text-muted">
                  {weather.air_temperature}&deg;C / Track {weather.track_temperature}&deg;C
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

      {/* Sub-navigation strip + content area */}
      <div className="flex flex-1 min-h-0">
        {/* Sub-navigation strip */}
        <nav className="w-12 shrink-0 flex flex-col items-center gap-1 pt-2 border-r border-f1-border">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`w-10 h-10 flex flex-col items-center justify-center rounded-lg text-xs transition-colors ${
                activeView === item.id
                  ? 'bg-f1-elevated text-f1-cyan'
                  : 'text-f1-text-muted hover:text-f1-text hover:bg-f1-elevated/50'
              }`}
              title={item.label}
            >
              <span className="text-base leading-none">{item.icon}</span>
              <span className="text-[9px] mt-0.5 font-[var(--font-display)]">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Content area */}
        <div className="flex-1 min-w-0 p-3 overflow-auto">
          {activeView === 'dashboard' && (
            <DashboardView
              drivers={drivers}
              sectorBests={sectorBests}
              carPositions={carPositions}
              sessionInfo={sessionInfo}
              raceControl={raceControl}
              sessionStatus={sessionStatus}
            />
          )}
          {activeView === 'trackmap' && (
            <TrackMapView
              carPositions={carPositions}
              sessionInfo={sessionInfo}
              drivers={drivers}
              sessionStatus={sessionStatus}
            />
          )}
          {activeView === 'conditions' && (
            <ConditionsView
              weather={weather}
              raceControl={raceControl}
            />
          )}
        </div>
      </div>
    </div>
  );
}
