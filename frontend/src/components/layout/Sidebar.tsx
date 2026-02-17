import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const navItems = [
  { to: '/', label: 'Live Timing', icon: '⏱' },
  { to: '/strategy', label: 'Strategy', icon: '📊' },
  { to: '/conditions', label: 'Conditions', icon: '🌤' },
  { to: '/fantasy', label: 'Fantasy', icon: '🏆' },
];

export function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <nav className="w-16 bg-f1-surface border-r border-f1-border flex flex-col items-center py-4 gap-2">
      <div className="text-f1-red font-bold text-xs mb-4 font-[var(--font-display)]">
        PIT
      </div>
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            `w-10 h-10 flex items-center justify-center rounded-lg text-lg transition-colors ${
              isActive
                ? 'bg-f1-elevated text-f1-text'
                : 'text-f1-text-muted hover:bg-f1-elevated/50 hover:text-f1-text'
            }`
          }
          title={item.label}
        >
          {item.icon}
        </NavLink>
      ))}

      <div className="flex-1" />

      {/* Auth button at bottom */}
      {user ? (
        <button
          onClick={logout}
          className="w-10 h-10 flex items-center justify-center rounded-lg text-lg text-f1-text-muted hover:bg-f1-elevated/50 hover:text-f1-text transition-colors"
          title={`Logout (${user.username})`}
        >
          👤
        </button>
      ) : (
        <button
          onClick={() => navigate('/login')}
          className="w-10 h-10 flex items-center justify-center rounded-lg text-lg text-f1-text-muted hover:bg-f1-elevated/50 hover:text-f1-text transition-colors"
          title="Login"
        >
          🔒
        </button>
      )}
    </nav>
  );
}
