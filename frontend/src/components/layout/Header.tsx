import { useEffect, useState } from 'react';

export function Header() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-12 bg-f1-surface border-b border-f1-border flex items-center justify-between px-4">
      <div className="flex items-center gap-3">
        <span className="text-f1-red font-bold text-sm tracking-wider font-[var(--font-display)]">
          F1 PITWALL
        </span>
      </div>
      <div className="font-timing text-f1-text-muted text-sm">
        {time.toLocaleTimeString('en-GB', { hour12: false })}
      </div>
    </header>
  );
}
