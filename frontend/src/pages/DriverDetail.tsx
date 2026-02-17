import { useParams, Link } from 'react-router-dom';
import { getDriver, getTeam } from '../data/teams2026';
import { countryFlag } from '../utils/countryFlags';

export function DriverDetail() {
  const { driverId } = useParams<{ driverId: string }>();
  const driver = getDriver(driverId ?? '');

  if (!driver) {
    return (
      <div className="text-center py-20 text-f1-text-muted">
        <div className="text-lg font-[var(--font-display)]">Driver not found</div>
        <Link to="/drivers" className="text-f1-red text-sm mt-2 inline-block">Back to Drivers</Link>
      </div>
    );
  }

  const team = getTeam(driver.teamId);
  const dob = new Date(driver.dateOfBirth);
  const age = Math.floor((Date.now() - dob.getTime()) / 31557600000);

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-f1-text-muted">
        <Link to="/drivers" className="hover:text-f1-text transition-colors">Drivers</Link>
        <span>/</span>
        <span className="text-f1-text">{driver.name}</span>
      </div>

      {/* Driver header */}
      <div className="relative overflow-hidden rounded-xl border border-f1-border bg-f1-surface">
        <div className="h-2" style={{ backgroundColor: driver.teamColor }} />
        <div className="p-6 flex flex-col sm:flex-row items-start gap-6">
          {/* Avatar */}
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold text-white shrink-0"
            style={{ backgroundColor: driver.teamColor }}
          >
            {driver.abbreviation}
          </div>

          <div className="flex-1">
            <div className="font-timing text-f1-text-muted text-lg">#{driver.number}</div>
            <h1 className="text-3xl font-bold font-[var(--font-display)] text-f1-text">{driver.name}</h1>
            {driver.role && (
              <div className="text-sm text-f1-yellow font-semibold mt-1">{driver.role}</div>
            )}
            <p className="text-f1-text-muted text-sm mt-2 italic">{driver.note}</p>
          </div>
        </div>
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Nationality', value: `${countryFlag(driver.country)} ${driver.countryName}` },
          { label: 'Date of Birth', value: dob.toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' }) },
          { label: 'Age', value: `${age} years` },
          { label: 'Team', value: driver.teamName },
        ].map(item => (
          <div key={item.label} className="bg-f1-surface rounded-lg border border-f1-border p-4">
            <div className="text-xs text-f1-text-muted uppercase tracking-wider">{item.label}</div>
            <div className="text-sm font-semibold text-f1-text mt-1 font-[var(--font-display)]">{item.value}</div>
          </div>
        ))}
      </div>

      {/* Team link */}
      {team && (
        <Link
          to={`/teams/${team.id}`}
          className="block bg-f1-surface rounded-lg border border-f1-border p-4 hover:border-f1-text-muted transition-all"
          style={{ borderLeftWidth: '4px', borderLeftColor: team.color }}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-f1-text-muted uppercase tracking-wider">Team</div>
              <div className="text-lg font-bold font-[var(--font-display)] text-f1-text">{team.fullName}</div>
              <div className="text-xs text-f1-text-muted">{team.engine} engine — {team.chassis}</div>
            </div>
            <span className="text-f1-text-muted text-sm">View Team &rarr;</span>
          </div>
        </Link>
      )}

      {/* Season Results placeholder */}
      <div className="bg-f1-surface rounded-lg border border-f1-border p-6 text-center text-f1-text-muted">
        <div className="text-sm font-[var(--font-display)]">2026 Season Results</div>
        <div className="text-xs mt-1">Season has not started yet. Results will appear here after Round 1.</div>
      </div>
    </div>
  );
}
