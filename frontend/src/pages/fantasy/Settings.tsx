import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useFantasy, type SavedTeam } from '../../hooks/useFantasy';
import { PageHeader } from '../../components/fantasy/PageHeader';
import { TeamSlotTabs } from '../../components/fantasy/TeamSlotTabs';
import { DriverPill } from '../../components/fantasy/DriverPill';
import { ConstructorPill } from '../../components/fantasy/ConstructorPill';
import { ALL_DRIVERS, TEAMS } from '../../data/teams2026';

const CHIP_INFO: Record<string, { name: string; description: string; color: string; bg: string }> = {
  autopilot: { name: 'Autopilot', description: 'Automatically applies your 2x Boost to the highest-scoring driver.', color: 'text-f1-green', bg: 'bg-f1-green' },
  extra_drs: { name: '3x Boost', description: 'Triples one driver\'s weekend score. Cannot be same driver as 2x Boost.', color: 'text-f1-yellow', bg: 'bg-f1-yellow' },
  no_negative: { name: 'No Negative', description: 'Any driver or constructor scoring negative is set to zero.', color: 'text-f1-cyan', bg: 'bg-f1-cyan' },
  wildcard: { name: 'Wildcard', description: 'Unlimited transfers within the $100M budget cap.', color: 'text-f1-purple', bg: 'bg-f1-purple' },
  limitless: { name: 'Limitless', description: 'Unlimited transfers with no budget cap for one round.', color: 'text-f1-red', bg: 'bg-f1-red' },
  final_fix: { name: 'Final Fix', description: 'One free transfer after qualifying, before race start.', color: 'text-f1-text', bg: 'bg-f1-text' },
};

export function Settings() {
  const { user } = useAuth();
  const { savedTeams, settings, updateSettings, activateChip } = useFantasy();
  const [chipRound, setChipRound] = useState<Record<string, number>>({});
  const [chipError, setChipError] = useState<string | null>(null);

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64 text-f1-text-muted">
        <div className="text-center">
          <div className="text-lg font-[var(--font-display)] mb-2">Sign in to manage settings</div>
          <Link to="/login" className="text-f1-cyan hover:underline text-sm">Log in</Link>
        </div>
      </div>
    );
  }

  const activeTeamNumber = (settings?.active_team_number ?? 1) as 1 | 2 | 3;
  const chipsUsed = settings?.chips_used ?? {};

  const handleActivateChip = async (chip: string) => {
    const round = chipRound[chip];
    if (!round) return;
    setChipError(null);
    try {
      await activateChip(chip, round);
    } catch (e) {
      setChipError(e instanceof Error ? e.message : 'Failed to activate chip');
    }
  };

  // Get team composition for preview
  const activeTeam = savedTeams.find((t: SavedTeam) => t.team_number === activeTeamNumber);

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" />

      {/* Active Team */}
      <div className="bg-f1-surface rounded-xl border border-f1-border p-4 space-y-4">
        <h2 className="text-sm font-semibold text-white font-[var(--font-display)]">Active Team</h2>
        <div className="flex items-center justify-center">
          <TeamSlotTabs
            activeSlot={activeTeamNumber}
            onChange={(slot) => updateSettings(slot)}
          />
        </div>
        <div className="grid grid-cols-3 gap-2">
          {([1, 2, 3] as const).map(n => {
            const team = savedTeams.find((t: SavedTeam) => t.team_number === n);
            const isActive = activeTeamNumber === n;
            return (
              <button
                key={n}
                onClick={() => updateSettings(n)}
                className={`rounded-xl border p-3 text-left transition-all ${
                  isActive
                    ? 'border-f1-green bg-f1-green/5'
                    : 'border-f1-border hover:border-f1-text-muted'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-white font-[var(--font-display)]">
                    Team {n}
                  </span>
                  {isActive && (
                    <span className="text-[9px] font-bold text-f1-green bg-f1-green/10 rounded px-1.5 py-0.5">ACTIVE</span>
                  )}
                </div>
                {team ? (
                  <>
                    <div className="text-[10px] text-f1-text-muted">{team.name || 'Unnamed'}</div>
                    <div className="text-[10px] text-f1-text-muted mt-0.5">
                      {team.drivers.length} drivers, {team.constructors.length} constructors
                    </div>
                    <div className="font-timing text-xs text-f1-yellow mt-0.5">
                      ${(team.total_price ?? 0).toFixed(1)}M
                    </div>
                  </>
                ) : (
                  <div className="text-[10px] text-f1-text-muted">No team saved</div>
                )}
              </button>
            );
          })}
        </div>

        {/* Team composition preview */}
        {activeTeam && (activeTeam.drivers.length > 0 || activeTeam.constructors.length > 0) && (
          <div className="pt-3 border-t border-f1-border">
            <div className="text-[10px] text-f1-text-muted uppercase tracking-wider mb-2">Team Composition</div>
            <div className="flex flex-wrap items-center gap-2">
              {activeTeam.drivers.map((driverNum: number) => {
                const local = ALL_DRIVERS.find(d => d.number === driverNum);
                return local ? (
                  <DriverPill
                    key={driverNum}
                    tla={local.abbreviation}
                    teamColor={local.teamColor}
                    size="sm"
                  />
                ) : null;
              })}
              {activeTeam.constructors.map((cId: string) => {
                const local = TEAMS.find(t => t.id === cId);
                return local ? (
                  <ConstructorPill
                    key={cId}
                    tla={local.name.slice(0, 3).toUpperCase()}
                    teamColor={local.color}
                    size="sm"
                  />
                ) : null;
              })}
            </div>
          </div>
        )}
      </div>

      {/* Chip Management */}
      <div className="bg-f1-surface rounded-xl border border-f1-border p-4 space-y-3">
        <h2 className="text-sm font-semibold text-white font-[var(--font-display)]">Chip Management</h2>
        {chipError && (
          <div className="text-xs text-f1-red bg-f1-red/10 rounded-lg px-3 py-2 border border-f1-red/20">{chipError}</div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {Object.entries(CHIP_INFO).map(([key, { name, description, color, bg }]) => {
            const usedRound = chipsUsed[key];
            const isUsed = usedRound !== undefined;
            return (
              <div
                key={key}
                className={`rounded-xl border p-3 transition-opacity ${isUsed ? 'border-f1-border opacity-50' : 'border-f1-border'}`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className={`w-2 h-2 rounded-full ${bg}`} />
                  <span className={`text-xs font-bold ${color}`}>{name}</span>
                </div>
                <div className="text-[10px] text-f1-text-muted mt-0.5 leading-relaxed">{description}</div>
                {isUsed ? (
                  <div className="text-[10px] text-f1-text-muted mt-2 font-timing">Used in R{usedRound}</div>
                ) : (
                  <div className="flex items-center gap-1.5 mt-2">
                    <select
                      value={chipRound[key] ?? ''}
                      onChange={e => setChipRound(prev => ({ ...prev, [key]: Number(e.target.value) }))}
                      className="bg-f1-elevated border border-f1-border rounded-lg px-2 py-1 text-[10px] text-f1-text w-16 font-timing"
                    >
                      <option value="">Round</option>
                      {Array.from({ length: 24 }, (_, i) => (
                        <option key={i + 1} value={i + 1}>R{i + 1}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => handleActivateChip(key)}
                      disabled={!chipRound[key]}
                      className="bg-f1-red hover:bg-f1-red/80 text-white px-4 py-2 rounded-lg font-bold text-sm transition-colors disabled:opacity-40"
                    >
                      Activate
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Transfer Tracker */}
      <div className="bg-f1-surface rounded-xl border border-f1-border p-4 space-y-3">
        <h2 className="text-sm font-semibold text-white font-[var(--font-display)]">Transfer Tracker</h2>
        <div className="flex items-center gap-6">
          <div>
            <span className="text-[10px] text-f1-text-muted uppercase tracking-wider">Free Transfers</span>
            <div className="font-timing text-2xl text-white font-bold">
              {settings?.free_transfers_remaining ?? 3}
              <span className="text-f1-text-muted text-sm"> / 3</span>
            </div>
          </div>
          <div className="h-8 w-px bg-f1-border" />
          <div>
            <span className="text-[10px] text-f1-text-muted uppercase tracking-wider">Total Used</span>
            <div className="font-timing text-2xl text-white font-bold">{settings?.transfers_used ?? 0}</div>
          </div>
        </div>
        {(settings?.free_transfers_remaining ?? 3) === 0 && (
          <div className="text-[10px] text-f1-yellow bg-f1-yellow/10 rounded-lg px-3 py-2 border border-f1-yellow/20">
            No free transfers remaining. Additional transfers cost -10 points each.
          </div>
        )}
      </div>

      {/* DRS Boost Status */}
      <div className="bg-f1-surface rounded-xl border border-f1-border p-4 space-y-3">
        <h2 className="text-sm font-semibold text-white font-[var(--font-display)]">DRS Boost</h2>
        <div className="space-y-2">
          {savedTeams.map((t: SavedTeam) => (
            <div key={t.team_number} className="flex items-center justify-between rounded-lg bg-f1-elevated/30 px-3 py-2">
              <span className="text-xs text-f1-text-muted font-timing">Team {t.team_number}</span>
              {t.drs_boost_driver ? (
                <span className="text-xs font-bold text-f1-green font-timing">#{t.drs_boost_driver} (2x)</span>
              ) : (
                <span className="text-xs text-f1-text-muted">Not set</span>
              )}
            </div>
          ))}
        </div>
        <Link
          to="/fantasy/drs"
          className="inline-block bg-f1-elevated hover:bg-f1-elevated/80 text-white px-4 py-2 rounded-lg text-sm transition-colors"
        >
          Go to DRS Boost page
        </Link>
      </div>
    </div>
  );
}
