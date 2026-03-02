import { NavLink } from 'react-router-dom';
import { useState } from 'react';

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

const MAIN_NAV: NavItem[] = [
  { path: '/fantasy/calculator', label: 'Team Calculator', icon: '\u229E' },
  { path: '/fantasy/budget',     label: 'Budget Builder',  icon: '\uFE69' },
  { path: '/fantasy/live',       label: 'Live Scoring',    icon: '\u25C9' },
  { path: '/fantasy/enter-team', label: 'Enter Team',      icon: '\u270E' },
  { path: '/fantasy/season',     label: 'Season Summary',  icon: '\u2261' },
  { path: '/fantasy/elite',      label: 'Elite Data',      icon: '\u25C6' },
  { path: '/fantasy/stats',      label: 'Statistics',      icon: '\u25A5' },
  { path: '/fantasy/analyzer',   label: 'Team Analyzer',   icon: '\u2295' },
  { path: '/fantasy/league',     label: 'League',          icon: '\u2691' },
  { path: '/fantasy/hindsight',  label: 'Hindsight',       icon: '\u25C1' },
];

const MORE_NAV: NavItem[] = [
  { path: '/fantasy/drs',      label: 'DRS Boost',     icon: '\u26A1' },
  { path: '/fantasy/chips',    label: 'Chip Strategy', icon: '\u265F' },
  { path: '/fantasy/import',   label: 'Import Team',   icon: '\u2193' },
  { path: '/fantasy/settings', label: 'Settings',      icon: '\u2699' },
];

function NavItemLink({ item, collapsed }: { item: NavItem; collapsed: boolean }) {
  return (
    <NavLink
      to={item.path}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-1.5 transition-colors ${
          isActive
            ? 'text-f1-red bg-f1-elevated/50 border-l-2 border-f1-red'
            : 'text-f1-text-muted hover:text-f1-text hover:bg-f1-elevated/30 border-l-2 border-transparent'
        }`
      }
    >
      <span className="w-7 h-7 rounded bg-f1-elevated/50 flex items-center justify-center text-[11px] font-bold shrink-0">
        {item.icon}
      </span>
      {!collapsed && (
        <span className="font-[var(--font-display)] text-xs truncate">{item.label}</span>
      )}
    </NavLink>
  );
}

export function FantasySidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <div
      className={`bg-f1-surface border-r border-f1-border flex flex-col shrink-0 transition-all duration-200 ${
        collapsed ? 'w-14' : 'w-[220px]'
      }`}
    >
      {/* Brand header */}
      <div className="flex items-center justify-between px-3 py-3 border-b border-f1-border">
        {!collapsed ? (
          <span className="text-xs font-bold text-f1-red uppercase tracking-wider font-[var(--font-display)]">
            F1 PITWALL
          </span>
        ) : (
          <span className="text-xs font-bold text-f1-red font-[var(--font-display)]">F1</span>
        )}
        <button
          onClick={() => setCollapsed(c => !c)}
          className="text-f1-text-muted hover:text-f1-text text-xs transition-colors leading-none"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? '\u276F' : '\u276E'}
        </button>
      </div>

      {/* Main navigation */}
      <nav className="flex-1 overflow-y-auto py-2 space-y-0.5">
        {MAIN_NAV.map(item => (
          <NavItemLink key={item.path} item={item} collapsed={collapsed} />
        ))}

        {/* Separator */}
        <div className="mx-3 my-2 border-t border-f1-border" />

        {/* More toggle */}
        <button
          onClick={() => setMoreOpen(o => !o)}
          className="flex items-center gap-3 px-3 py-1.5 w-full text-f1-text-muted hover:text-f1-text hover:bg-f1-elevated/30 transition-colors border-l-2 border-transparent"
        >
          <span className="w-7 h-7 rounded bg-f1-elevated/50 flex items-center justify-center text-[11px] font-bold shrink-0">
            {'\u00B7\u00B7\u00B7'}
          </span>
          {!collapsed && (
            <span className="font-[var(--font-display)] text-xs truncate flex items-center gap-1">
              More
              <span className={`text-[8px] transition-transform duration-200 ${moreOpen ? 'rotate-180' : ''}`}>
                {'\u25BC'}
              </span>
            </span>
          )}
        </button>

        {/* More items */}
        {moreOpen && (
          <div className="space-y-0.5">
            {MORE_NAV.map(item => (
              <NavItemLink key={item.path} item={item} collapsed={collapsed} />
            ))}
          </div>
        )}
      </nav>
    </div>
  );
}
