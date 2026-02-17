import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export function Login() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(username, password);
      } else {
        await register(username, password);
      }
      navigate('/fantasy');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-full max-w-sm bg-f1-surface border border-f1-border rounded-lg p-6">
        <h2 className="text-center text-f1-red font-bold text-lg mb-6 font-[var(--font-display)] tracking-wider">
          F1 PITWALL
        </h2>

        {/* Mode toggle */}
        <div className="flex mb-6 bg-f1-bg rounded-lg p-1">
          <button
            onClick={() => setMode('login')}
            className={`flex-1 py-2 text-sm rounded-md transition-colors font-[var(--font-display)] ${
              mode === 'login'
                ? 'bg-f1-elevated text-f1-text'
                : 'text-f1-text-muted hover:text-f1-text'
            }`}
          >
            LOGIN
          </button>
          <button
            onClick={() => setMode('register')}
            className={`flex-1 py-2 text-sm rounded-md transition-colors font-[var(--font-display)] ${
              mode === 'register'
                ? 'bg-f1-elevated text-f1-text'
                : 'text-f1-text-muted hover:text-f1-text'
            }`}
          >
            REGISTER
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] text-f1-text-muted uppercase tracking-wider mb-1">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full bg-f1-bg border border-f1-border rounded px-3 py-2 font-timing text-sm text-f1-text focus:outline-none focus:border-f1-red transition-colors"
            />
          </div>
          <div>
            <label className="block text-[10px] text-f1-text-muted uppercase tracking-wider mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-f1-bg border border-f1-border rounded px-3 py-2 font-timing text-sm text-f1-text focus:outline-none focus:border-f1-red transition-colors"
            />
          </div>

          {error && (
            <div className="text-f1-red text-xs font-timing">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-f1-red hover:bg-f1-red/80 text-white py-2 rounded font-[var(--font-display)] font-semibold text-sm tracking-wider transition-colors disabled:opacity-50"
          >
            {loading ? 'LOADING...' : mode === 'login' ? 'SIGN IN' : 'CREATE ACCOUNT'}
          </button>
        </form>
      </div>
    </div>
  );
}
