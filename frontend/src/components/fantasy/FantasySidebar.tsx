import { NavLink } from 'react-router-dom';
import { useState } from 'react';

const FANTASY_TOOLS = [
  { path: '/fantasy/calculator', label: 'Team Calculator', icon: 'C' },
  { path: '/fantasy/budget', label: 'Budget Builder', icon: 'B' },
  { path: '/fantasy/live', label: 'Live Scoring', icon: 'L' },
  { path: '/fantasy/season', label: 'Season Summary', icon: 'S' },
  { path: '/fantasy/elite', label: 'Elite Data', icon: 'E' },
  { path: '/fantasy/stats', label: 'Statistics', icon: '#' },
  { path: '/fantasy/analyzer', label: 'Team Analyzer', icon: 'A' },
  { path: '/fantasy/league', label: 'League', icon: 'G' },
  { path: '/fantasy/hindsight', label: 'Hindsight', icon: 'H' },
  { path: '/fantasy/drs', label: 'DRS Boost', icon: 'D' },
  { path: '/fantasy/chips', label: 'Chip Strategy', icon: 'P' },
];

export function FantasySidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={`bg-f1-surface border-r border-f1-border flex flex-col shrink-0 transition-all ${collapsed ? 'w-14' : 'w-52'}`}>
      <div className="flex items-center justify-between px-3 py-3 border-b border-f1-border">
        {!collapsed && (
          <span className="text-xs font-semibold text-f1-red uppercase tracking-wider font-[var(--font-display)]">
            Fantasy Tools
          </span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-f1-text-muted hover:text-f1-text text-xs transition-colors"
        >
          {collapsed ? '>' : '<'}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-2">
        {FANTASY_TOOLS.map(tool => (
          <NavLink
            key={tool.path}
            to={tool.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 text-sm transition-colors ${
                isActive
                  ? 'text-f1-red bg-f1-red/5 border-r-2 border-f1-red'
                  : 'text-f1-text-muted hover:text-f1-text hover:bg-f1-elevated/30'
              }`
            }
          >
            <span className="w-6 h-6 rounded bg-f1-elevated flex items-center justify-center text-[10px] font-bold font-timing shrink-0">
              {tool.icon}
            </span>
            {!collapsed && (
              <span className="font-[var(--font-display)] text-xs truncate">{tool.label}</span>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
