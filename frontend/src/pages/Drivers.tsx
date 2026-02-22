import { Link } from 'react-router-dom';
import { useDrivers, type DriverAPI } from '../hooks/useSeasonData';
import { ALL_DRIVERS as SEED_DRIVERS } from '../data/teams2026';
import { countryFlag } from '../utils/countryFlags';
import { FreshnessIndicator } from '../components/common/FreshnessIndicator';
import { LoadingTelemetry } from '../components/common/LoadingTelemetry';

export function Drivers() {
  const { data: apiDrivers, meta, isLoading } = useDrivers();

  // Use API drivers if they have team info, otherwise use seed
  const drivers = (apiDrivers && apiDrivers.length > 0 && apiDrivers[0].teamId)
    ? apiDrivers
    : SEED_DRIVERS.map(d => ({
        id: d.id,
        name: d.name,
        abbreviation: d.abbreviation,
        number: d.number,
        country: d.country,
        countryName: d.countryName,
        dateOfBirth: d.dateOfBirth,
        teamId: d.teamId,
        teamName: d.teamName,
        teamColor: d.teamColor,
        role: d.role,
      } as DriverAPI));

  if (isLoading) return <LoadingTelemetry />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-[var(--font-display)] text-f1-text">
          2026 Drivers — {drivers.length} on the Grid
        </h1>
        {meta && <FreshnessIndicator source={meta.source} fetchedAt={meta.fetched_at} stale={meta.stale} />}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {drivers.map((driver) => (
          <Link
            key={driver.id}
            to={`/drivers/${driver.id}`}
            className="group bg-f1-surface rounded-lg border border-f1-border overflow-hidden hover:border-f1-text-muted transition-all"
            style={{ borderTopWidth: '3px', borderTopColor: driver.teamColor ?? '#666' }}
          >
            <div className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <span className="font-timing text-3xl font-bold" style={{ color: driver.teamColor ?? '#666' }}>
                    {driver.number}
                  </span>
                </div>
                <span className="font-timing text-lg font-bold text-f1-text-muted group-hover:text-f1-text transition-colors">
                  {driver.abbreviation}
                </span>
              </div>
              <div className="flex justify-center mb-3">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center text-lg font-bold text-white"
                  style={{ backgroundColor: driver.teamColor ?? '#666' }}
                >
                  {driver.name.split(' ').map(n => n[0]).join('')}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm font-bold font-[var(--font-display)] text-f1-text group-hover:text-f1-white transition-colors">
                  {driver.name}
                </div>
                <div className="text-xs text-f1-text-muted mt-0.5">
                  {countryFlag(driver.country)} {driver.countryName ?? driver.country}
                </div>
              </div>
              <div className="mt-3 text-center">
                <span
                  className="px-2 py-0.5 rounded text-[10px] font-semibold"
                  style={{ backgroundColor: `${driver.teamColor ?? '#666'}20`, color: driver.teamColor ?? '#666' }}
                >
                  {driver.teamName ?? ''}
                </span>
              </div>
              {driver.role && (
                <div className="mt-2 text-center">
                  <span className="text-[10px] text-f1-yellow font-semibold">{driver.role}</span>
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
