import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

interface DropdownItem {
  label: string;
  to: string;
}

interface NavItem {
  label: string;
  to?: string;
  items?: DropdownItem[];
}

const NAV_ITEMS: NavItem[] = [
  {
    label: 'Season',
    items: [
      { label: 'Schedule', to: '/schedule' },
      { label: 'Standings', to: '/standings' },
      { label: 'Regulations', to: '/regulations' },
    ],
  },
  { label: 'Drivers', to: '/drivers' },
  { label: 'Teams', to: '/teams' },
  {
    label: 'Live',
    items: [
      { label: 'Live Timing', to: '/live' },
      { label: 'Strategy', to: '/strategy' },
    ],
  },
  { label: 'Fantasy', to: '/fantasy' },
];

export function TopNav() {
  const location = useLocation();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  // Close dropdown on route change
  useEffect(() => {
    setOpenDropdown(null);
  }, [location.pathname]);

  function isActive(item: NavItem): boolean {
    if (item.to) return location.pathname === item.to;
    if (item.items) return item.items.some(i => location.pathname === i.to);
    return false;
  }

  return (
    <nav ref={navRef} className="bg-f1-surface nav-stripes border-b border-f1-border sticky top-0 z-50">
      <div className="max-w-[1400px] mx-auto px-4 flex items-center h-12">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 mr-8 shrink-0">
          <span className="text-f1-red font-bold text-lg tracking-tight font-[var(--font-display)]">
            PIT<span className="text-f1-text">WALL</span>
          </span>
        </Link>

        {/* Nav items */}
        <div className="flex items-center gap-1">
          {NAV_ITEMS.map((item) => (
            <div key={item.label} className="relative">
              {item.to ? (
                <Link
                  to={item.to}
                  className={`px-3 py-1.5 text-sm font-semibold font-[var(--font-display)] tracking-wide transition-colors rounded ${
                    isActive(item)
                      ? 'text-f1-text bg-f1-elevated'
                      : 'text-f1-text-muted hover:text-f1-text'
                  }`}
                  style={isActive(item) ? { borderBottom: '2px solid #E10600' } : undefined}
                >
                  {item.label}
                </Link>
              ) : (
                <button
                  onClick={() => setOpenDropdown(openDropdown === item.label ? null : item.label)}
                  className={`px-3 py-1.5 text-sm font-semibold font-[var(--font-display)] tracking-wide transition-colors rounded flex items-center gap-1 ${
                    isActive(item)
                      ? 'text-f1-text bg-f1-elevated'
                      : 'text-f1-text-muted hover:text-f1-text'
                  }`}
                  style={isActive(item) ? { borderBottom: '2px solid #E10600' } : undefined}
                >
                  {item.label}
                  <svg className={`w-3 h-3 transition-transform ${openDropdown === item.label ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              )}

              {/* Dropdown */}
              {item.items && openDropdown === item.label && (
                <div className="absolute top-full left-0 mt-1 bg-f1-elevated border border-f1-border rounded-lg shadow-lg py-1 min-w-[160px] z-50">
                  {item.items.map((sub) => (
                    <Link
                      key={sub.to}
                      to={sub.to}
                      className={`block px-4 py-2 text-sm font-[var(--font-display)] transition-colors ${
                        location.pathname === sub.to
                          ? 'text-f1-red bg-f1-surface'
                          : 'text-f1-text-muted hover:text-f1-text hover:bg-f1-surface'
                      }`}
                    >
                      {sub.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Right side: clock */}
        <div className="ml-auto font-timing text-f1-text-muted text-xs">
          {new Date().getFullYear()} SEASON
        </div>
      </div>
    </nav>
  );
}
