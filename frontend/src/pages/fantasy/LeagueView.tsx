import { useState } from 'react';

export function LeagueView() {
  const [tab, setTab] = useState<'create' | 'join'>('join');
  const [leagueName, setLeagueName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [result, setResult] = useState<{ id: number; name: string; invite_code?: string; member_count?: number; already_member?: boolean } | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const createLeague = async () => {
    if (!leagueName.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/fantasy/league', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ name: leagueName }),
      });
      if (!res.ok) throw new Error((await res.json()).detail ?? 'Failed');
      setResult(await res.json());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to create league');
    } finally {
      setLoading(false);
    }
  };

  const joinLeague = async () => {
    if (!inviteCode.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/fantasy/league/${inviteCode}/join`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      if (!res.ok) throw new Error((await res.json()).detail ?? 'League not found');
      setResult(await res.json());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to join league');
    } finally {
      setLoading(false);
    }
  };

  const lookupLeague = async () => {
    if (!inviteCode.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/fantasy/league/${inviteCode}`);
      if (!res.ok) throw new Error('League not found');
      setResult(await res.json());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'League not found');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold font-[var(--font-display)] text-f1-text">League</h1>
      <p className="text-xs text-f1-text-muted">Create or join a fantasy league to compete with friends.</p>

      <div className="flex gap-2">
        <button
          onClick={() => { setTab('join'); setResult(null); setError(''); }}
          className={`px-4 py-2 rounded text-xs font-semibold transition-colors ${
            tab === 'join' ? 'bg-f1-red text-white' : 'bg-f1-surface text-f1-text-muted border border-f1-border'
          }`}
        >
          Join League
        </button>
        <button
          onClick={() => { setTab('create'); setResult(null); setError(''); }}
          className={`px-4 py-2 rounded text-xs font-semibold transition-colors ${
            tab === 'create' ? 'bg-f1-red text-white' : 'bg-f1-surface text-f1-text-muted border border-f1-border'
          }`}
        >
          Create League
        </button>
      </div>

      <div className="bg-f1-surface rounded-lg border border-f1-border p-4">
        {tab === 'create' ? (
          <div className="space-y-3">
            <label className="block">
              <span className="text-xs text-f1-text-muted">League Name</span>
              <input
                type="text"
                value={leagueName}
                onChange={e => setLeagueName(e.target.value)}
                placeholder="e.g. Office F1 League"
                className="mt-1 w-full bg-f1-elevated border border-f1-border rounded px-3 py-2 text-sm text-f1-text placeholder-f1-text-muted/50 focus:outline-none focus:border-f1-red"
              />
            </label>
            <button
              onClick={createLeague}
              disabled={loading || !leagueName.trim()}
              className="px-4 py-2 bg-f1-red text-white rounded text-xs font-semibold disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create League'}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <label className="block">
              <span className="text-xs text-f1-text-muted">Invite Code</span>
              <input
                type="text"
                value={inviteCode}
                onChange={e => setInviteCode(e.target.value)}
                placeholder="Paste invite code"
                className="mt-1 w-full bg-f1-elevated border border-f1-border rounded px-3 py-2 text-sm text-f1-text placeholder-f1-text-muted/50 focus:outline-none focus:border-f1-red"
              />
            </label>
            <div className="flex gap-2">
              <button
                onClick={lookupLeague}
                disabled={loading || !inviteCode.trim()}
                className="px-4 py-2 bg-f1-surface text-f1-text border border-f1-border rounded text-xs font-semibold disabled:opacity-50"
              >
                Look Up
              </button>
              <button
                onClick={joinLeague}
                disabled={loading || !inviteCode.trim()}
                className="px-4 py-2 bg-f1-red text-white rounded text-xs font-semibold disabled:opacity-50"
              >
                {loading ? 'Joining...' : 'Join League'}
              </button>
            </div>
          </div>
        )}

        {error && <p className="mt-3 text-xs text-f1-red">{error}</p>}

        {result && (
          <div className="mt-4 p-3 bg-f1-elevated rounded-lg border border-f1-border">
            <div className="text-sm font-semibold text-f1-text font-[var(--font-display)]">{result.name}</div>
            {result.invite_code && (
              <div className="mt-1 flex items-center gap-2">
                <span className="text-[10px] text-f1-text-muted uppercase">Invite Code:</span>
                <code className="font-timing text-xs text-f1-cyan bg-f1-surface px-2 py-0.5 rounded">{result.invite_code}</code>
              </div>
            )}
            {result.member_count != null && (
              <div className="text-xs text-f1-text-muted mt-1">{result.member_count} member(s)</div>
            )}
            {result.already_member && (
              <div className="text-xs text-f1-yellow mt-1">Already a member</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
