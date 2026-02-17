import { Link } from 'react-router-dom';
import { TEAMS, ENGINE_SUPPLIERS } from '../data/teams2026';

export function Teams() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold font-[var(--font-display)] text-f1-text">
        2026 Teams — {TEAMS.length} Constructors
      </h1>

      {/* Team cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {TEAMS.map((team) => (
          <Link
            key={team.id}
            to={`/teams/${team.id}`}
            className="group bg-f1-surface rounded-lg border border-f1-border overflow-hidden hover:border-f1-text-muted transition-all"
          >
            {/* Color gradient header */}
            <div
              className="h-2"
              style={{ background: `linear-gradient(90deg, ${team.color}, ${team.secondaryColor})` }}
            />

            <div className="p-4">
              {/* Team name + engine */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-lg font-bold font-[var(--font-display)] text-f1-text group-hover:text-f1-white transition-colors">
                    {team.name}
                  </h3>
                  <div className="text-xs text-f1-text-muted">{team.fullName}</div>
                </div>
                <span
                  className="px-2 py-0.5 rounded text-[10px] font-semibold font-timing"
                  style={{ backgroundColor: `${team.color}20`, color: team.color }}
                >
                  {team.engine}
                </span>
              </div>

              {/* Drivers */}
              <div className="space-y-2 mb-3">
                {team.drivers.map((driver) => (
                  <div key={driver.id} className="flex items-center gap-3">
                    {/* Avatar circle with team color and initials */}
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                      style={{ backgroundColor: team.color }}
                    >
                      {driver.abbreviation.slice(0, 2)}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-f1-text font-[var(--font-display)] truncate">
                        {driver.name}
                      </div>
                      <div className="text-[10px] text-f1-text-muted">
                        #{driver.number} — {driver.abbreviation}
                        {driver.role && <span className="ml-1 text-f1-yellow">({driver.role})</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Team info */}
              <div className="text-xs text-f1-text-muted space-y-1">
                <div className="flex justify-between">
                  <span>Principal</span>
                  <span className="text-f1-text">{team.teamPrincipal}</span>
                </div>
                <div className="flex justify-between">
                  <span>Chassis</span>
                  <span className="font-timing text-f1-text">{team.chassis}</span>
                </div>
                <div className="flex justify-between">
                  <span>Base</span>
                  <span className="text-f1-text text-right truncate ml-4">{team.base}</span>
                </div>
              </div>

              {/* Note badge */}
              {team.note && (
                <div className="mt-3 text-[10px] text-f1-text-muted italic line-clamp-2">
                  {team.note}
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>

      {/* Engine Suppliers */}
      <div className="bg-f1-surface rounded-lg border border-f1-border overflow-hidden">
        <div className="px-4 py-3 border-b border-f1-border">
          <h2 className="text-xs font-semibold text-f1-text-muted uppercase tracking-wider font-[var(--font-display)]">
            2026 Engine Suppliers
          </h2>
        </div>
        <div className="divide-y divide-f1-border">
          {ENGINE_SUPPLIERS.map((supplier) => (
            <div key={supplier.name} className="px-4 py-3 flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-f1-text font-[var(--font-display)]">{supplier.name}</div>
                <div className="text-xs text-f1-text-muted">{supplier.note}</div>
              </div>
              <div className="flex gap-1 flex-wrap justify-end">
                {supplier.teams.map(t => {
                  const team = TEAMS.find(tm => tm.name === t);
                  return (
                    <span
                      key={t}
                      className="px-2 py-0.5 rounded text-[10px] font-semibold"
                      style={{
                        backgroundColor: team ? `${team.color}20` : '#2D2D3D',
                        color: team?.color ?? '#6B7280',
                      }}
                    >
                      {t}
                    </span>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
