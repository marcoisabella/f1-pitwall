import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ALL_DRIVERS, TEAMS } from '../../data/teams2026';
import { PageHeader } from '../../components/fantasy/PageHeader';
import { DriverPill } from '../../components/fantasy/DriverPill';
import { ConstructorPill } from '../../components/fantasy/ConstructorPill';

// ── Types ───────────────────────────────────────────────────────────

interface MappedDetail {
  type: 'driver' | 'constructor';
  fantasy_id: string;
  name: string;
  mapped_to: number | string;
  tla?: string;
  abbreviation?: string;
  team?: string;
  price: number;
  our_price: number;
  is_captain?: boolean;
  is_mega?: boolean;
}

interface ImportedTeam {
  team_no: number;
  drivers: number[];
  constructors: string[];
  drs_boost_driver: number | null;
  total_price: number;
  mapped_details: MappedDetail[];
  unmapped: { fantasy_id: string; name?: string }[];
  saved?: boolean;
  team_number?: number;
}

// ── Bookmarklet ─────────────────────────────────────────────────────

const BOOKMARKLET_CODE = `javascript:void(navigator.clipboard.writeText(document.cookie).then(function(){alert('Cookie copied! Go back to F1 PitWall and paste it.')}).catch(function(){prompt('Copy this:',document.cookie)}))`;

function BookmarkletButton() {
  const ref = useRef<HTMLAnchorElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.setAttribute('href', BOOKMARKLET_CODE);
  }, []);
  return (
    <a
      ref={ref}
      href="#"
      onClick={e => e.preventDefault()}
      draggable
      className="inline-flex items-center gap-1 bg-f1-red hover:bg-f1-red/80 text-white px-4 py-2 rounded-lg font-bold text-sm font-[var(--font-display)] cursor-grab active:cursor-grabbing select-none transition-colors"
    >
      F1 PitWall Sync
    </a>
  );
}

// ── Team Card ───────────────────────────────────────────────────────

function TeamCard({
  team,
  onImport,
  importing,
  imported,
}: {
  team: ImportedTeam;
  onImport: (teamNo: number, saveSlot: number) => void;
  importing: boolean;
  imported: boolean;
}) {
  const [saveSlot, setSaveSlot] = useState(team.team_no);

  const drivers = team.mapped_details.filter(d => d.type === 'driver');
  const constructors = team.mapped_details.filter(d => d.type === 'constructor');

  return (
    <div className="bg-f1-surface rounded-xl border border-f1-border overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-f1-border flex items-center justify-between">
        <h3 className="text-sm font-bold text-white font-[var(--font-display)]">
          Team {team.team_no}
        </h3>
        <div className="text-right">
          <span className="text-[10px] text-f1-text-muted uppercase tracking-wider">Value</span>
          <div className={`font-timing text-sm font-bold ${team.total_price <= 100 ? 'text-f1-green' : 'text-f1-red'}`}>
            ${team.total_price}M
          </div>
        </div>
      </div>

      {/* Team composition with pills */}
      <div className="px-4 py-4">
        {/* Drivers */}
        <div className="text-[10px] text-f1-text-muted uppercase font-bold tracking-wider mb-2">
          Drivers
        </div>
        <div className="flex flex-wrap items-start gap-3 mb-4">
          {drivers.map(d => {
            const local = ALL_DRIVERS.find(ld => ld.number === d.mapped_to);
            const tla = d.tla || d.abbreviation || local?.abbreviation || '???';
            const teamColor = local?.teamColor || '#666';
            return (
              <DriverPill
                key={d.fantasy_id}
                tla={tla}
                teamColor={teamColor}
                price={d.price}
                chipMultiplier={d.is_captain ? 'x2' : undefined}
                size="md"
              />
            );
          })}
          {drivers.length === 0 && (
            <div className="text-xs text-f1-text-muted py-4 w-full text-center">No drivers found</div>
          )}
        </div>

        {/* Constructors */}
        <div className="text-[10px] text-f1-text-muted uppercase font-bold tracking-wider mb-2">
          Constructors
        </div>
        <div className="flex flex-wrap items-start gap-3">
          {constructors.map(d => {
            const local = TEAMS.find(t => t.id === d.mapped_to);
            const tla = local?.name.slice(0, 3).toUpperCase() || d.name.slice(0, 3).toUpperCase();
            const teamColor = local?.color || '#666';
            return (
              <ConstructorPill
                key={d.fantasy_id}
                tla={tla}
                teamColor={teamColor}
                price={d.price}
                size="md"
              />
            );
          })}
          {constructors.length === 0 && (
            <div className="text-xs text-f1-text-muted py-2 w-full text-center">No constructors found</div>
          )}
        </div>
      </div>

      {/* Unmapped */}
      {team.unmapped.length > 0 && (
        <div className="mx-4 mb-3 px-3 py-2 bg-f1-yellow/5 border border-f1-yellow/20 rounded-lg text-[10px] text-f1-yellow">
          {team.unmapped.length} player(s) could not be mapped
        </div>
      )}

      {/* Import actions */}
      <div className="px-4 py-3 border-t border-f1-border flex items-center gap-3">
        <select
          value={saveSlot}
          onChange={e => setSaveSlot(Number(e.target.value))}
          className="bg-f1-elevated border border-f1-border rounded-lg px-2 py-1.5 text-xs text-f1-text font-timing"
        >
          <option value={1}>Save as Team 1</option>
          <option value={2}>Save as Team 2</option>
          <option value={3}>Save as Team 3</option>
        </select>
        <button
          onClick={() => onImport(team.team_no, saveSlot)}
          disabled={importing || imported || team.drivers.length !== 5}
          className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
            imported ? 'bg-f1-green text-white'
            : importing || team.drivers.length !== 5 ? 'bg-f1-elevated text-f1-text-muted cursor-not-allowed'
            : 'bg-f1-red hover:bg-f1-red/80 text-white'
          }`}
        >
          {importing ? 'Importing...' : imported ? 'Imported!' : 'Import'}
        </button>
        {imported && (
          <Link to="/fantasy/calculator" className="text-xs text-f1-green underline">
            Open in Team Builder
          </Link>
        )}
      </div>
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────────

export function ImportTeam() {
  const { user, token } = useAuth();

  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [teams, setTeams] = useState<ImportedTeam[]>([]);
  const [teamsError, setTeamsError] = useState<string | null>(null);

  // Setup state
  const [cookie, setCookie] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [setupError, setSetupError] = useState<string | null>(null);
  const [showSetup, setShowSetup] = useState(false);

  // Import state
  const [importingTeam, setImportingTeam] = useState<number | null>(null);
  const [importedTeams, setImportedTeams] = useState<Set<number>>(new Set());

  const authFetch = useCallback((url: string, opts?: RequestInit) =>
    fetch(url, { ...opts, headers: { ...opts?.headers, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }),
  [token]);

  // Check connection on mount
  useEffect(() => {
    if (!token) return;
    authFetch('/api/fantasy/f1-status')
      .then(r => r.json())
      .then(data => {
        if (data.connected) {
          setConnected(true);
          loadTeams();
        } else {
          setShowSetup(true);
        }
      })
      .catch(() => setShowSetup(true))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const loadTeams = useCallback(async () => {
    setTeamsError(null);
    try {
      const res = await authFetch('/api/fantasy/f1-sync-team', {
        method: 'POST',
        body: JSON.stringify({ slot: 1 }),
      });
      const data = await res.json();
      if (!res.ok) {
        setTeamsError(data.detail || 'Could not fetch teams');
      } else {
        setTeams(data.teams || []);
      }
    } catch {
      setTeamsError('Network error');
    }
  }, [authFetch]);

  const handleConnect = async () => {
    if (!cookie.trim()) { setSetupError('Paste your cookie first'); return; }
    setConnecting(true);
    setSetupError(null);
    try {
      const res = await authFetch('/api/fantasy/f1-connect', {
        method: 'POST',
        body: JSON.stringify({ cookie: cookie.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSetupError(data.detail || 'Connection failed');
        return;
      }
      setConnected(true);
      setShowSetup(false);
      if (data.teams?.length) {
        setTeams(data.teams);
      } else if (data.teams_error) {
        setTeamsError(data.teams_error);
      } else {
        loadTeams();
      }
    } catch {
      setSetupError('Network error');
    } finally {
      setConnecting(false);
    }
  };

  const handleImport = async (teamNo: number, saveSlot: number) => {
    setImportingTeam(teamNo);
    try {
      const res = await authFetch('/api/fantasy/f1-sync-team', {
        method: 'POST',
        body: JSON.stringify({ slot: teamNo, team_number: saveSlot, save: true }),
      });
      const data = await res.json();
      if (res.ok) {
        setImportedTeams(prev => new Set(prev).add(teamNo));
      } else {
        setTeamsError(data.detail || 'Import failed');
      }
    } catch {
      setTeamsError('Network error');
    } finally {
      setImportingTeam(null);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64 text-f1-text-muted">
        <div className="text-center">
          <div className="text-lg font-[var(--font-display)] mb-2">Sign in to import your team</div>
          <Link to="/login" className="text-f1-cyan hover:underline text-sm">Log in</Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-f1-text-muted text-sm">Checking connection...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Import Team"
        subtitle="Import your team from the official F1 Fantasy game."
      >
        <div className="flex items-center justify-center gap-3">
          {connected && (
            <>
              <button
                onClick={loadTeams}
                className="bg-f1-elevated hover:bg-f1-elevated/80 text-white px-4 py-2 rounded-lg text-sm transition-colors"
              >
                Refresh
              </button>
              <button
                onClick={() => setShowSetup(!showSetup)}
                className="text-xs text-f1-text-muted hover:text-white transition-colors"
              >
                {showSetup ? 'Hide Setup' : 'Reconnect'}
              </button>
            </>
          )}
        </div>
      </PageHeader>

      {/* Connection status */}
      {connected && !showSetup && (
        <div className="flex items-center justify-center gap-2 px-4 py-2.5 bg-f1-green/5 border border-f1-green/20 rounded-xl">
          <div className="w-2 h-2 rounded-full bg-f1-green animate-pulse" />
          <span className="text-xs text-f1-green font-bold">Connected to F1 Fantasy</span>
        </div>
      )}

      {/* Setup panel */}
      {(showSetup || !connected) && (
        <div className="bg-f1-surface rounded-xl border border-f1-border overflow-hidden">
          <div className="px-5 py-4 border-b border-f1-border">
            <h2 className="text-sm font-bold text-white font-[var(--font-display)]">
              Connect to F1 Fantasy
            </h2>
            <p className="text-[10px] text-f1-text-muted mt-1">
              Paste your session cookie from fantasy.formula1.com to import your teams.
            </p>
          </div>

          <div className="p-5 space-y-5">
            {/* Step 1 */}
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-f1-red/10 text-f1-red flex items-center justify-center text-xs font-bold font-timing flex-shrink-0 mt-0.5">
                1
              </span>
              <div className="flex-1 space-y-2">
                <div className="text-xs text-white font-bold">Copy your session cookie</div>
                <div className="flex items-center gap-2 flex-wrap">
                  <BookmarkletButton />
                  <span className="text-[10px] text-f1-text-muted">
                    drag to bookmarks bar, then click on fantasy.formula1.com
                  </span>
                </div>
                <div className="text-[10px] text-f1-text-muted leading-relaxed">
                  Or: open{' '}
                  <a href="https://fantasy.formula1.com" target="_blank" rel="noopener" className="text-f1-cyan hover:underline">
                    fantasy.formula1.com
                  </a>
                  {' '}&rarr; press F12 &rarr; Console &rarr; type:{' '}
                  <code className="font-timing text-f1-cyan bg-f1-elevated px-1.5 py-0.5 rounded select-all">
                    copy(document.cookie)
                  </code>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-f1-red/10 text-f1-red flex items-center justify-center text-xs font-bold font-timing flex-shrink-0 mt-0.5">
                2
              </span>
              <div className="flex-1 space-y-2">
                <div className="text-xs text-white font-bold">Paste it here and connect</div>
                <textarea
                  value={cookie}
                  onChange={e => { setCookie(e.target.value); setSetupError(null); }}
                  placeholder="Paste cookie here..."
                  rows={2}
                  className="w-full bg-f1-elevated border border-f1-border rounded-lg px-3 py-2 text-[10px] text-f1-text placeholder:text-f1-text-muted/40 font-timing focus:outline-none focus:border-f1-cyan/50 resize-none"
                />
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleConnect}
                    disabled={connecting || !cookie.trim()}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
                      connecting || !cookie.trim()
                        ? 'bg-f1-elevated text-f1-text-muted cursor-not-allowed'
                        : 'bg-f1-red hover:bg-f1-red/80 text-white'
                    }`}
                  >
                    {connecting ? 'Connecting...' : 'Connect & Import'}
                  </button>
                  {setupError && <span className="text-xs text-f1-red">{setupError}</span>}
                </div>
                <div className="text-[10px] text-f1-text-muted/50">
                  Your cookie is stored securely on the server and only used to fetch your team data.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Teams error */}
      {teamsError && (
        <div className="px-4 py-3 bg-f1-red/5 border border-f1-red/20 rounded-xl text-xs text-f1-red">
          {teamsError}
        </div>
      )}

      {/* Teams */}
      {connected && !showSetup && teams.length > 0 && (
        <div className="space-y-4">
          <div className="text-xs text-f1-text-muted text-center">
            Found {teams.length} team{teams.length !== 1 ? 's' : ''} on your F1 Fantasy account.
          </div>
          {teams.map(team => (
            <TeamCard
              key={team.team_no}
              team={team}
              onImport={handleImport}
              importing={importingTeam === team.team_no}
              imported={importedTeams.has(team.team_no)}
            />
          ))}
        </div>
      )}

      {/* No teams */}
      {connected && !showSetup && teams.length === 0 && !teamsError && (
        <div className="bg-f1-surface rounded-xl border border-f1-border p-8 text-center">
          <div className="text-f1-text-muted text-sm mb-2">No teams found</div>
          <div className="text-[10px] text-f1-text-muted">
            Make sure you've created a team on{' '}
            <a href="https://fantasy.formula1.com" target="_blank" rel="noopener" className="text-f1-cyan hover:underline">
              fantasy.formula1.com
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
