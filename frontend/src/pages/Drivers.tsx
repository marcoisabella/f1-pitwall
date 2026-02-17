import { Link } from 'react-router-dom';
import { ALL_DRIVERS } from '../data/teams2026';
import { countryFlag } from '../utils/countryFlags';

export function Drivers() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold font-[var(--font-display)] text-f1-text">
        2026 Drivers — {ALL_DRIVERS.length} on the Grid
      </h1>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {ALL_DRIVERS.map((driver) => (
          <Link
            key={driver.id}
            to={`/drivers/${driver.id}`}
            className="group bg-f1-surface rounded-lg border border-f1-border overflow-hidden hover:border-f1-text-muted transition-all"
            style={{ borderTopWidth: '3px', borderTopColor: driver.teamColor }}
          >
            <div className="p-4">
              {/* Number + abbreviation */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <span className="font-timing text-3xl font-bold" style={{ color: driver.teamColor }}>
                    {driver.number}
                  </span>
                </div>
                <span className="font-timing text-lg font-bold text-f1-text-muted group-hover:text-f1-text transition-colors">
                  {driver.abbreviation}
                </span>
              </div>

              {/* Avatar */}
              <div className="flex justify-center mb-3">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center text-lg font-bold text-white"
                  style={{ backgroundColor: driver.teamColor }}
                >
                  {driver.name.split(' ').map(n => n[0]).join('')}
                </div>
              </div>

              {/* Name */}
              <div className="text-center">
                <div className="text-sm font-bold font-[var(--font-display)] text-f1-text group-hover:text-f1-white transition-colors">
                  {driver.name}
                </div>
                <div className="text-xs text-f1-text-muted mt-0.5">
                  {countryFlag(driver.country)} {driver.countryName}
                </div>
              </div>

              {/* Team */}
              <div className="mt-3 text-center">
                <span
                  className="px-2 py-0.5 rounded text-[10px] font-semibold"
                  style={{ backgroundColor: `${driver.teamColor}20`, color: driver.teamColor }}
                >
                  {driver.teamName}
                </span>
              </div>

              {/* Role badge */}
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
