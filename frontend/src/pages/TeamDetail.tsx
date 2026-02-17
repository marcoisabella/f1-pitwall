import { useParams, Link } from 'react-router-dom';
import { getTeam } from '../data/teams2026';
import { countryFlag } from '../utils/countryFlags';

export function TeamDetail() {
  const { teamId } = useParams<{ teamId: string }>();
  const team = getTeam(teamId ?? '');

  if (!team) {
    return (
      <div className="text-center py-20 text-f1-text-muted">
        <div className="text-lg font-[var(--font-display)]">Team not found</div>
        <Link to="/teams" className="text-f1-red text-sm mt-2 inline-block">Back to Teams</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-f1-text-muted">
        <Link to="/teams" className="hover:text-f1-text transition-colors">Teams</Link>
        <span>/</span>
        <span className="text-f1-text">{team.name}</span>
      </div>

      {/* Team header */}
      <div className="relative overflow-hidden rounded-xl border border-f1-border bg-f1-surface">
        <div className="h-2" style={{ background: `linear-gradient(90deg, ${team.color}, ${team.secondaryColor})` }} />
        <div className="p-6">
          <h1 className="text-3xl font-bold font-[var(--font-display)] text-f1-text">{team.fullName}</h1>
          <p className="text-f1-text-muted text-sm mt-1">{team.note}</p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
            {[
              { label: 'Engine', value: team.engine },
              { label: 'Team Principal', value: team.teamPrincipal },
              { label: 'Chassis', value: team.chassis },
              { label: 'Base', value: team.base },
            ].map(item => (
              <div key={item.label}>
                <div className="text-xs text-f1-text-muted uppercase tracking-wider">{item.label}</div>
                <div className="text-sm font-semibold text-f1-text mt-0.5 font-[var(--font-display)]">{item.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Drivers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {team.drivers.map((driver) => (
          <Link
            key={driver.id}
            to={`/drivers/${driver.id}`}
            className="bg-f1-surface rounded-lg border border-f1-border p-6 hover:border-f1-text-muted transition-all group"
            style={{ borderLeftWidth: '4px', borderLeftColor: team.color }}
          >
            <div className="flex items-center gap-4">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold text-white shrink-0"
                style={{ backgroundColor: team.color }}
              >
                {driver.abbreviation}
              </div>
              <div>
                <div className="font-timing text-f1-text-muted text-sm">#{driver.number}</div>
                <h3 className="text-xl font-bold font-[var(--font-display)] text-f1-text group-hover:text-f1-white transition-colors">
                  {driver.name}
                </h3>
                <div className="text-sm text-f1-text-muted">
                  {countryFlag(driver.country)} {driver.countryName}
                </div>
                {driver.role && (
                  <div className="text-xs text-f1-yellow mt-1 font-semibold">{driver.role}</div>
                )}
              </div>
            </div>
            <p className="text-xs text-f1-text-muted mt-3 italic">{driver.note}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
