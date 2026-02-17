import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { RACES, getNextRace, PRE_SEASON_TESTING } from '../data/calendar2026';
import { TEAMS } from '../data/teams2026';
import { countryFlag } from '../utils/countryFlags';

function useCountdown(targetDate: string) {
  const [remaining, setRemaining] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    function update() {
      const diff = new Date(targetDate).getTime() - Date.now();
      if (diff <= 0) {
        setRemaining({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      setRemaining({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    }
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [targetDate]);

  return remaining;
}

function CountdownBlock({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="font-timing text-4xl sm:text-5xl font-bold text-f1-text">
        {String(value).padStart(2, '0')}
      </span>
      <span className="text-f1-text-muted text-xs uppercase tracking-wider mt-1">{label}</span>
    </div>
  );
}

export function Home() {
  const nextRace = getNextRace();
  const countdown = useCountdown(nextRace?.raceDay ?? '2026-12-31');
  const totalDrivers = TEAMS.reduce((sum, t) => sum + t.drivers.length, 0);

  return (
    <div className="space-y-8">
      {/* Hero: Next Race Countdown */}
      {nextRace && (
        <div className="relative overflow-hidden rounded-xl border border-f1-border bg-gradient-to-br from-f1-surface to-f1-bg p-8">
          <div className="absolute top-0 right-0 w-64 h-64 opacity-5 text-[200px] leading-none font-bold font-[var(--font-display)] text-f1-red select-none">
            {nextRace.round}
          </div>

          <div className="relative">
            <div className="text-f1-red text-xs font-semibold uppercase tracking-widest font-[var(--font-display)] mb-2">
              Next Race — Round {nextRace.round}
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold font-[var(--font-display)] text-f1-text mb-1">
              {countryFlag(nextRace.country)} {nextRace.name}
            </h1>
            <p className="text-f1-text-muted text-sm mb-6">
              {nextRace.circuit} — {nextRace.city}, {nextRace.countryName}
              {nextRace.sprint && <span className="ml-2 px-2 py-0.5 bg-f1-yellow/20 text-f1-yellow rounded text-xs font-semibold">SPRINT</span>}
            </p>

            <div className="flex gap-6 sm:gap-10">
              <CountdownBlock value={countdown.days} label="Days" />
              <span className="font-timing text-4xl sm:text-5xl text-f1-text-muted">:</span>
              <CountdownBlock value={countdown.hours} label="Hours" />
              <span className="font-timing text-4xl sm:text-5xl text-f1-text-muted">:</span>
              <CountdownBlock value={countdown.minutes} label="Mins" />
              <span className="font-timing text-4xl sm:text-5xl text-f1-text-muted">:</span>
              <CountdownBlock value={countdown.seconds} label="Secs" />
            </div>

            <div className="mt-6 flex gap-3">
              <Link
                to="/schedule"
                className="px-4 py-2 bg-f1-red text-white text-sm font-semibold font-[var(--font-display)] rounded hover:bg-f1-red/80 transition-colors"
              >
                FULL SCHEDULE
              </Link>
              <Link
                to="/live"
                className="px-4 py-2 bg-f1-elevated text-f1-text text-sm font-semibold font-[var(--font-display)] rounded border border-f1-border hover:bg-f1-border transition-colors"
              >
                LIVE TIMING
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Season Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { value: RACES.length, label: 'Races', color: 'text-f1-red' },
          { value: TEAMS.length, label: 'Teams', color: 'text-f1-cyan' },
          { value: totalDrivers, label: 'Drivers', color: 'text-f1-green' },
          { value: RACES.filter(r => r.sprint).length, label: 'Sprints', color: 'text-f1-yellow' },
        ].map(stat => (
          <div key={stat.label} className="bg-f1-surface rounded-lg border border-f1-border p-4 text-center">
            <div className={`font-timing text-3xl font-bold ${stat.color}`}>{stat.value}</div>
            <div className="text-f1-text-muted text-xs uppercase tracking-wider mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Pre-Season Testing */}
      <div className="bg-f1-surface rounded-lg border border-f1-border overflow-hidden">
        <div className="px-4 py-3 border-b border-f1-border">
          <h2 className="text-xs font-semibold text-f1-text-muted uppercase tracking-wider font-[var(--font-display)]">
            Pre-Season Testing
          </h2>
        </div>
        <div className="divide-y divide-f1-border">
          {PRE_SEASON_TESTING.map((test) => (
            <div key={test.event} className="px-4 py-3 flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-f1-text font-[var(--font-display)]">{test.event}</div>
                <div className="text-xs text-f1-text-muted">{test.location}</div>
              </div>
              <div className="font-timing text-xs text-f1-text-muted">{test.dates}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Links: Upcoming Races */}
      <div className="bg-f1-surface rounded-lg border border-f1-border overflow-hidden">
        <div className="px-4 py-3 border-b border-f1-border flex items-center justify-between">
          <h2 className="text-xs font-semibold text-f1-text-muted uppercase tracking-wider font-[var(--font-display)]">
            Upcoming Races
          </h2>
          <Link to="/schedule" className="text-xs text-f1-red hover:text-f1-red/80 font-semibold">
            View All
          </Link>
        </div>
        <div className="divide-y divide-f1-border">
          {RACES.filter(r => new Date(r.raceDay) >= new Date()).slice(0, 5).map((race) => (
            <div key={race.round} className="px-4 py-3 flex items-center gap-4 hover:bg-f1-elevated/30 transition-colors">
              <span className="font-timing text-f1-text-muted text-xs w-8">{String(race.round).padStart(2, '0')}</span>
              <span className="text-lg">{countryFlag(race.country)}</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-f1-text font-[var(--font-display)] truncate">{race.name}</div>
                <div className="text-xs text-f1-text-muted">{race.circuit}</div>
              </div>
              <div className="flex items-center gap-2">
                {race.sprint && <span className="px-1.5 py-0.5 bg-f1-yellow/20 text-f1-yellow rounded text-[10px] font-semibold">SPRINT</span>}
                <span className="font-timing text-xs text-f1-text-muted whitespace-nowrap">
                  {new Date(race.raceDay).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
