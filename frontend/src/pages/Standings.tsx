import { useState } from 'react';
import { useDriverStandings, useConstructorStandings } from '../hooks/useSeasonData';
import { ALL_DRIVERS, TEAMS } from '../data/teams2026';
import { FreshnessIndicator } from '../components/common/FreshnessIndicator';
import { LoadingTelemetry } from '../components/common/LoadingTelemetry';

type Tab = 'drivers' | 'constructors';

export function Standings() {
  const [tab, setTab] = useState<Tab>('drivers');
  const driverStandings = useDriverStandings();
  const constructorStandings = useConstructorStandings();

  const activeMeta = tab === 'drivers' ? driverStandings.meta : constructorStandings.meta;

  if (driverStandings.isLoading || constructorStandings.isLoading) return <LoadingTelemetry />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-[var(--font-display)] text-f1-text">
          2026 Championship Standings
        </h1>
        {activeMeta && <FreshnessIndicator source={activeMeta.source} fetchedAt={activeMeta.fetched_at} stale={activeMeta.stale} />}
      </div>

      <div className="flex gap-1 bg-f1-surface rounded-lg border border-f1-border p-1 w-fit">
        {(['drivers', 'constructors'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded text-sm font-semibold font-[var(--font-display)] transition-colors ${
              tab === t
                ? 'bg-f1-red text-white'
                : 'text-f1-text-muted hover:text-f1-text'
            }`}
          >
            {t === 'drivers' ? 'Drivers' : 'Constructors'}
          </button>
        ))}
      </div>

      {tab === 'drivers'
        ? <DriversStandings data={driverStandings.data} />
        : <ConstructorsStandings data={constructorStandings.data} />
      }
    </div>
  );
}

function DriversStandings({ data }: { data: ReturnType<typeof useDriverStandings>['data'] }) {
  const hasStandings = data && data.length > 0;

  return (
    <div className="bg-f1-surface rounded-lg border border-f1-border overflow-hidden">
      <div className="px-4 py-3 border-b border-f1-border">
        <h2 className="text-xs font-semibold text-f1-text-muted uppercase tracking-wider font-[var(--font-display)]">
          World Drivers' Championship — {ALL_DRIVERS.length} Drivers
        </h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-xs text-f1-text-muted uppercase tracking-wider border-b border-f1-border">
              <th className="text-left px-4 py-2 font-semibold w-12">Pos</th>
              <th className="text-left px-4 py-2 font-semibold">Driver</th>
              <th className="text-left px-4 py-2 font-semibold">Team</th>
              <th className="text-right px-4 py-2 font-semibold">Points</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-f1-border">
            {hasStandings ? data.map((s) => {
              const seedDriver = ALL_DRIVERS.find(d => d.abbreviation === s.driver_code || d.id === s.driver_id);
              const teamColor = seedDriver?.teamColor ?? '#666';
              return (
                <tr key={s.driver_id} className="hover:bg-f1-elevated/30 transition-colors">
                  <td className="px-4 py-3"><span className="font-timing text-sm text-f1-text-muted">{s.position}</span></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-1 h-8 rounded-full shrink-0" style={{ backgroundColor: teamColor }} />
                      <span className="text-sm font-semibold text-f1-text font-[var(--font-display)]">{s.driver_name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold" style={{ backgroundColor: `${teamColor}20`, color: teamColor }}>
                      {s.constructor_name}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right"><span className="font-timing text-sm text-f1-text">{s.points}</span></td>
                </tr>
              );
            }) : ALL_DRIVERS.map((driver, i) => (
              <tr key={driver.id} className="hover:bg-f1-elevated/30 transition-colors">
                <td className="px-4 py-3"><span className="font-timing text-sm text-f1-text-muted">{i + 1}</span></td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-1 h-8 rounded-full shrink-0" style={{ backgroundColor: driver.teamColor }} />
                    <div>
                      <span className="text-sm font-semibold text-f1-text font-[var(--font-display)]">{driver.name}</span>
                      <span className="ml-2 font-timing text-xs text-f1-text-muted">#{driver.number}</span>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold" style={{ backgroundColor: `${driver.teamColor}20`, color: driver.teamColor }}>
                    {driver.teamName}
                  </span>
                </td>
                <td className="px-4 py-3 text-right"><span className="font-timing text-sm text-f1-text-muted">0</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!hasStandings && (
        <div className="px-4 py-3 border-t border-f1-border text-center text-f1-text-muted text-xs">
          Season has not started yet. Standings will update after Round 1 — Australian Grand Prix.
        </div>
      )}
    </div>
  );
}

function ConstructorsStandings({ data }: { data: ReturnType<typeof useConstructorStandings>['data'] }) {
  const hasStandings = data && data.length > 0;

  return (
    <div className="bg-f1-surface rounded-lg border border-f1-border overflow-hidden">
      <div className="px-4 py-3 border-b border-f1-border">
        <h2 className="text-xs font-semibold text-f1-text-muted uppercase tracking-wider font-[var(--font-display)]">
          World Constructors' Championship — {TEAMS.length} Teams
        </h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-xs text-f1-text-muted uppercase tracking-wider border-b border-f1-border">
              <th className="text-left px-4 py-2 font-semibold w-12">Pos</th>
              <th className="text-left px-4 py-2 font-semibold">Team</th>
              <th className="text-left px-4 py-2 font-semibold">Engine</th>
              <th className="text-left px-4 py-2 font-semibold">Drivers</th>
              <th className="text-right px-4 py-2 font-semibold">Points</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-f1-border">
            {hasStandings ? data.map((s) => {
              const seedTeam = TEAMS.find(t => t.id === s.constructor_id || t.name === s.constructor_name);
              const teamColor = seedTeam?.color ?? '#666';
              return (
                <tr key={s.constructor_id} className="hover:bg-f1-elevated/30 transition-colors">
                  <td className="px-4 py-3"><span className="font-timing text-sm text-f1-text-muted">{s.position}</span></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-1 h-8 rounded-full shrink-0" style={{ backgroundColor: teamColor }} />
                      <span className="text-sm font-semibold text-f1-text font-[var(--font-display)]">{s.constructor_name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3"><span className="text-xs text-f1-text-muted">{seedTeam?.engine ?? ''}</span></td>
                  <td className="px-4 py-3"><span className="text-xs text-f1-text-muted">{seedTeam?.drivers.map(d => d.abbreviation).join(' / ') ?? ''}</span></td>
                  <td className="px-4 py-3 text-right"><span className="font-timing text-sm text-f1-text">{s.points}</span></td>
                </tr>
              );
            }) : TEAMS.map((team, i) => (
              <tr key={team.id} className="hover:bg-f1-elevated/30 transition-colors">
                <td className="px-4 py-3"><span className="font-timing text-sm text-f1-text-muted">{i + 1}</span></td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-1 h-8 rounded-full shrink-0" style={{ backgroundColor: team.color }} />
                    <span className="text-sm font-semibold text-f1-text font-[var(--font-display)]">{team.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3"><span className="text-xs text-f1-text-muted">{team.engine}</span></td>
                <td className="px-4 py-3"><span className="text-xs text-f1-text-muted">{team.drivers.map(d => d.abbreviation).join(' / ')}</span></td>
                <td className="px-4 py-3 text-right"><span className="font-timing text-sm text-f1-text-muted">0</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!hasStandings && (
        <div className="px-4 py-3 border-t border-f1-border text-center text-f1-text-muted text-xs">
          Season has not started yet. Standings will update after Round 1 — Australian Grand Prix.
        </div>
      )}
    </div>
  );
}
