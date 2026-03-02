import { useState, useEffect } from 'react';
import { LoadingTelemetry } from '../../components/common/LoadingTelemetry';
import { useAuth } from '../../contexts/AuthContext';
import { useFantasy, type SavedTeam } from '../../hooks/useFantasy';
import { PageHeader } from '../../components/fantasy/PageHeader';
import { TeamSlotTabs } from '../../components/fantasy/TeamSlotTabs';
import { DriverPill } from '../../components/fantasy/DriverPill';
import { getTeamColor } from '../../utils/teamColors';

interface SimDriver {
  driver_number: number;
  name_acronym: string;
  full_name: string;
  team_name: string;
  mean_points: number;
  p10: number;
  p90: number;
  std_dev: number;
  price: number;
  value: number;
}

export function DRSBoost() {
  const { user } = useAuth();
  const { savedTeams, setDrsBoost } = useFantasy();
  const [drivers, setDrivers] = useState<SimDriver[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTeamNumber, setActiveTeamNumber] = useState<1 | 2 | 3>(1);
  const [selectedDrs, setSelectedDrs] = useState<number | null>(null);
  const [applying, setApplying] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/fantasy/simulate')
      .then(r => r.json())
      .then(data => setDrivers(data.drivers ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Load current DRS selection from saved team
  useEffect(() => {
    const team = savedTeams.find((t: SavedTeam) => t.team_number === activeTeamNumber);
    setSelectedDrs(team?.drs_boost_driver ?? null);
  }, [savedTeams, activeTeamNumber]);

  if (loading) return <LoadingTelemetry />;

  const activeTeam = savedTeams.find((t: SavedTeam) => t.team_number === activeTeamNumber);
  const teamDriverNums = new Set(activeTeam?.drivers ?? []);

  const byExpected = [...drivers].sort((a, b) => b.mean_points - a.mean_points);
  const byUpside = [...drivers].sort((a, b) => b.p90 - a.p90);
  const bestPick = byExpected[0];

  const handleApplyDrs = async (driverNumber: number) => {
    if (!user) return;
    setApplying(true);
    setMessage(null);
    try {
      await setDrsBoost(activeTeamNumber, driverNumber);
      setSelectedDrs(driverNumber);
      setMessage('DRS Boost applied!');
      setTimeout(() => setMessage(null), 3000);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Failed to apply');
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="DRS Boost"
        subtitle="Find the best driver to apply your 2x points multiplier this round."
      />

      {/* Team selector + status */}
      {user && savedTeams.length > 0 && (
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <TeamSlotTabs
            activeSlot={activeTeamNumber}
            onChange={setActiveTeamNumber}
          />
          {selectedDrs && (
            <span className="text-xs text-f1-green font-timing font-bold">
              Current: #{selectedDrs} (2x)
            </span>
          )}
          {message && (
            <span className={`text-xs font-bold ${message === 'DRS Boost applied!' ? 'text-f1-green' : 'text-f1-red'}`}>
              {message}
            </span>
          )}
        </div>
      )}

      {/* Recommended DRS Boost */}
      {bestPick && (
        <div className="bg-f1-surface rounded-xl border-2 border-f1-green p-5">
          <div className="text-[10px] text-f1-green uppercase font-bold tracking-wider mb-3">
            Recommended DRS Boost
          </div>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <DriverPill
                tla={bestPick.name_acronym}
                teamColor={getTeamColor(bestPick.team_name)}
                size="lg"
              />
              <div>
                <div className="text-sm text-f1-text-muted">{bestPick.full_name}</div>
                <div className="text-xs text-f1-text-muted">{bestPick.team_name}</div>
              </div>
            </div>
            <div className="text-right flex items-center gap-4">
              <div>
                <div className="text-[10px] text-f1-text-muted">2x Expected Points</div>
                <div className="font-timing text-3xl text-f1-green font-bold">
                  {(bestPick.mean_points * 2).toFixed(1)}
                </div>
              </div>
              {user && teamDriverNums.has(bestPick.driver_number) && (
                <button
                  onClick={() => handleApplyDrs(bestPick.driver_number)}
                  disabled={applying || selectedDrs === bestPick.driver_number}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
                    selectedDrs === bestPick.driver_number
                      ? 'bg-f1-green/20 text-f1-green cursor-default'
                      : 'bg-f1-red hover:bg-f1-red/80 text-white'
                  }`}
                >
                  {selectedDrs === bestPick.driver_number ? 'Applied' : 'Apply'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Safe Picks table */}
      <div className="bg-f1-surface rounded-xl border border-f1-border p-4">
        <h2 className="text-sm font-semibold text-white font-[var(--font-display)] mb-3">
          Safe Picks (Highest Expected)
        </h2>
        <div className="overflow-hidden rounded-lg border border-f1-border">
          <table className="w-full">
            <thead>
              <tr className="text-[10px] text-f1-text-muted uppercase border-b border-f1-border bg-f1-elevated/30">
                <th className="text-center px-3 py-2 w-8">#</th>
                <th className="text-left px-3 py-2">Driver</th>
                <th className="text-right px-3 py-2">Exp. Pts</th>
                <th className="text-right px-3 py-2">2x Pts</th>
                <th className="text-right px-3 py-2">P10 (2x)</th>
                {user && activeTeam && <th className="text-center px-3 py-2 w-16"></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-f1-border">
              {byExpected.slice(0, 10).map((d, i) => {
                const onTeam = teamDriverNums.has(d.driver_number);
                const isCurrentDrs = selectedDrs === d.driver_number;
                return (
                  <tr
                    key={d.driver_number}
                    className={`transition-colors ${
                      isCurrentDrs ? 'bg-f1-green/5' : i === 0 ? 'bg-f1-green/5' : 'hover:bg-f1-elevated/30'
                    }`}
                  >
                    <td className="px-3 py-2.5 text-center font-timing text-xs text-f1-text-muted">{i + 1}</td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <DriverPill
                          tla={d.name_acronym}
                          teamColor={getTeamColor(d.team_name)}
                          size="sm"
                        />
                        <span className="text-xs text-f1-text-muted">{d.team_name}</span>
                        {onTeam && <span className="text-[9px] font-bold text-f1-cyan bg-f1-cyan/10 rounded px-1">MY</span>}
                        {isCurrentDrs && <span className="text-[9px] font-bold text-f1-green bg-f1-green/10 rounded px-1">2x</span>}
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-right font-timing text-xs text-white">{d.mean_points}</td>
                    <td className="px-3 py-2.5 text-right font-timing text-xs text-f1-green font-bold">{(d.mean_points * 2).toFixed(1)}</td>
                    <td className="px-3 py-2.5 text-right font-timing text-xs text-f1-text-muted">{(d.p10 * 2).toFixed(1)}</td>
                    {user && activeTeam && (
                      <td className="px-3 py-2.5 text-center">
                        {onTeam && (
                          <button
                            onClick={() => handleApplyDrs(d.driver_number)}
                            disabled={applying || isCurrentDrs}
                            className={`w-4 h-4 rounded-full border-2 transition-colors ${
                              isCurrentDrs
                                ? 'bg-f1-green border-f1-green'
                                : 'border-f1-border hover:border-f1-green'
                            }`}
                          />
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upside Plays table */}
      <div className="bg-f1-surface rounded-xl border border-f1-border p-4">
        <h2 className="text-sm font-semibold text-white font-[var(--font-display)] mb-3">
          Upside Plays (Highest Ceiling)
        </h2>
        <div className="overflow-hidden rounded-lg border border-f1-border">
          <table className="w-full">
            <thead>
              <tr className="text-[10px] text-f1-text-muted uppercase border-b border-f1-border bg-f1-elevated/30">
                <th className="text-center px-3 py-2 w-8">#</th>
                <th className="text-left px-3 py-2">Driver</th>
                <th className="text-right px-3 py-2">P90</th>
                <th className="text-right px-3 py-2">2x P90</th>
                <th className="text-right px-3 py-2">Std Dev</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-f1-border">
              {byUpside.slice(0, 10).map((d, i) => (
                <tr key={d.driver_number} className="hover:bg-f1-elevated/30 transition-colors">
                  <td className="px-3 py-2.5 text-center font-timing text-xs text-f1-text-muted">{i + 1}</td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <DriverPill
                        tla={d.name_acronym}
                        teamColor={getTeamColor(d.team_name)}
                        size="sm"
                      />
                      <span className="text-xs text-f1-text-muted">{d.team_name}</span>
                      {teamDriverNums.has(d.driver_number) && (
                        <span className="text-[9px] font-bold text-f1-cyan bg-f1-cyan/10 rounded px-1">MY</span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-right font-timing text-xs text-white">{d.p90}</td>
                  <td className="px-3 py-2.5 text-right font-timing text-xs text-f1-cyan font-bold">{(d.p90 * 2).toFixed(1)}</td>
                  <td className="px-3 py-2.5 text-right font-timing text-xs text-f1-text-muted">{d.std_dev}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
