import { useLiveTiming } from '../../hooks/useLiveTiming';

const SCORING: Record<number, number> = {
  1: 25, 2: 18, 3: 15, 4: 12, 5: 10,
  6: 8, 7: 6, 8: 4, 9: 2, 10: 1,
};

export function LiveScoring() {
  const { drivers, sessionInfo, connectionStatus } = useLiveTiming();

  const scored = drivers
    .filter(d => d.position != null)
    .sort((a, b) => (a.position ?? 99) - (b.position ?? 99))
    .map(d => ({
      ...d,
      fantasyPoints: SCORING[d.position ?? 99] ?? 0,
    }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold font-[var(--font-display)] text-f1-text">Live Scoring</h1>
          <p className="text-xs text-f1-text-muted">
            {sessionInfo ? `${sessionInfo.circuit_short_name} — ${sessionInfo.session_name}` : 'Waiting for session...'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${
            connectionStatus === 'connected' ? 'bg-f1-green' :
            connectionStatus === 'connecting' ? 'bg-f1-yellow' : 'bg-f1-red'
          }`} />
          <span className="text-[10px] text-f1-text-muted uppercase">{connectionStatus}</span>
        </div>
      </div>

      {scored.length === 0 ? (
        <div className="bg-f1-surface rounded-lg border border-f1-border p-8 text-center">
          <p className="text-f1-text-muted text-sm">No live session data. Scoring will appear during a race.</p>
        </div>
      ) : (
        <div className="bg-f1-surface rounded-lg border border-f1-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="text-[10px] text-f1-text-muted uppercase border-b border-f1-border">
                <th className="text-center px-3 py-2 w-10">Pos</th>
                <th className="text-left px-3 py-2">Driver</th>
                <th className="text-left px-3 py-2">Team</th>
                <th className="text-right px-3 py-2">Last Lap</th>
                <th className="text-right px-3 py-2">Pts</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-f1-border">
              {scored.map(d => (
                <tr key={d.driver_number} className="hover:bg-f1-elevated/30 transition-colors">
                  <td className="px-3 py-2 text-center font-timing text-sm text-f1-text">{d.position}</td>
                  <td className="px-3 py-2">
                    <span className="text-sm font-semibold text-f1-text font-[var(--font-display)]">{d.name_acronym}</span>
                    <span className="ml-2 text-xs text-f1-text-muted">{d.full_name}</span>
                  </td>
                  <td className="px-3 py-2 text-xs text-f1-text-muted">{d.team_name}</td>
                  <td className="px-3 py-2 text-right font-timing text-xs text-f1-text-muted">
                    {d.last_lap_time ? (d.last_lap_time / 1000).toFixed(3) : '—'}
                  </td>
                  <td className="px-3 py-2 text-right font-timing text-sm font-bold text-f1-green">
                    {d.fantasyPoints > 0 ? `+${d.fantasyPoints}` : '0'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
