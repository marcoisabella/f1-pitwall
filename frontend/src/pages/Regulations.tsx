import { REGULATIONS_2026, FIA_REGULATION_DOCUMENTS, FIA_REGULATIONS_SOURCE_URL } from '../data/regulations2026';
import { ENGINE_SUPPLIERS, TEAMS } from '../data/teams2026';

export function Regulations() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-[var(--font-display)] text-f1-text">
          2026 Regulation Changes
        </h1>
        <p className="text-f1-text-muted text-sm mt-1">
          The biggest regulatory shake-up in a decade. New engines, active aero, smaller cars, and more teams.
        </p>
      </div>

      {/* Regulation sections */}
      <div className="space-y-4">
        {REGULATIONS_2026.map((section) => (
          <div key={section.id} className="bg-f1-surface rounded-lg border border-f1-border overflow-hidden">
            <div className="px-4 py-3 border-b border-f1-border flex items-center gap-3">
              <span className="text-xl">{section.icon}</span>
              <div>
                <h2 className="text-sm font-semibold text-f1-text font-[var(--font-display)]">
                  {section.title}
                </h2>
                <p className="text-xs text-f1-text-muted">{section.summary}</p>
              </div>
            </div>

            <div className="p-4">
              <ul className="space-y-2">
                {section.details.map((detail, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-f1-text">
                    <span className="text-f1-red mt-0.5 shrink-0">&#x2022;</span>
                    <span>{detail}</span>
                  </li>
                ))}
              </ul>

              {/* Comparison table */}
              {section.comparison && section.comparison.length > 0 && (
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-xs text-f1-text-muted uppercase tracking-wider border-b border-f1-border">
                        <th className="text-left py-2 pr-4 font-semibold">Change</th>
                        <th className="text-left py-2 px-4 font-semibold">2025</th>
                        <th className="text-left py-2 pl-4 font-semibold">2026</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-f1-border/50">
                      {section.comparison.map((row) => (
                        <tr key={row.label}>
                          <td className="py-2 pr-4 text-f1-text-muted">{row.label}</td>
                          <td className="py-2 px-4 text-f1-text-muted line-through opacity-60">{row.before}</td>
                          <td className="py-2 pl-4 text-f1-green font-semibold">{row.after}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Engine Supplier Map */}
      <div className="bg-f1-surface rounded-lg border border-f1-border overflow-hidden">
        <div className="px-4 py-3 border-b border-f1-border">
          <h2 className="text-xs font-semibold text-f1-text-muted uppercase tracking-wider font-[var(--font-display)]">
            2026 Engine Supplier Map
          </h2>
        </div>
        <div className="p-4 space-y-3">
          {ENGINE_SUPPLIERS.map((supplier) => (
            <div key={supplier.name} className="flex items-start gap-4">
              <div className="w-40 shrink-0">
                <div className="text-sm font-semibold text-f1-text font-[var(--font-display)]">{supplier.name}</div>
                <div className="text-[10px] text-f1-text-muted">{supplier.note}</div>
              </div>
              <div className="flex-1 flex flex-wrap gap-2">
                {supplier.teams.map(teamName => {
                  const team = TEAMS.find(t => t.name === teamName);
                  return (
                    <div
                      key={teamName}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-f1-border"
                      style={{ borderLeftWidth: '3px', borderLeftColor: team?.color ?? '#6B7280' }}
                    >
                      <span className="text-sm text-f1-text font-[var(--font-display)]">{teamName}</span>
                      <span className="font-timing text-[10px] text-f1-text-muted">
                        {team?.drivers.map(d => d.abbreviation).join('/')}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Official FIA Documents */}
      <div className="bg-f1-surface rounded-lg border border-f1-border overflow-hidden">
        <div className="px-4 py-3 border-b border-f1-border flex items-center justify-between">
          <h2 className="text-xs font-semibold text-f1-text-muted uppercase tracking-wider font-[var(--font-display)]">
            Official FIA 2026 Regulation Documents
          </h2>
          <a
            href={FIA_REGULATIONS_SOURCE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-f1-cyan hover:underline"
          >
            FIA Source
          </a>
        </div>
        <div className="divide-y divide-f1-border">
          {FIA_REGULATION_DOCUMENTS.map((doc) => (
            <div key={doc.section} className="px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="font-timing text-sm text-f1-red font-bold w-6">§{doc.section}</span>
                <div>
                  <div className="text-sm text-f1-text font-[var(--font-display)]">{doc.title}</div>
                  <div className="text-[10px] text-f1-text-muted">{doc.issue} — Published {doc.publishedDate}</div>
                </div>
              </div>
              <a
                href={doc.pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1 bg-f1-elevated text-f1-text text-xs font-semibold rounded border border-f1-border hover:bg-f1-border transition-colors shrink-0"
              >
                PDF
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
