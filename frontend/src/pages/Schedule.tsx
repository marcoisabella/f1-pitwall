import { useSchedule, type RaceAPI } from '../hooks/useSeasonData';
import { PRE_SEASON_TESTING, SUMMER_BREAK, RACES as SEED_RACES } from '../data/calendar2026';
import { countryFlag } from '../utils/countryFlags';
import { FreshnessIndicator } from '../components/common/FreshnessIndicator';
import { LoadingTelemetry } from '../components/common/LoadingTelemetry';

function getBadge(race: RaceAPI, allRaces: RaceAPI[]): { text: string; className: string } | null {
  const now = new Date();
  const raceDate = new Date(race.raceDay ?? race.date ?? '');
  const nextRace = allRaces.find(r => new Date(r.raceDay ?? r.date ?? '') >= now);
  if (nextRace && nextRace.round === race.round) {
    return { text: 'NEXT', className: 'bg-f1-red text-white' };
  }
  const note = race.note ?? '';
  if (note.includes('NEW CIRCUIT')) return { text: 'NEW', className: 'bg-f1-green/20 text-f1-green' };
  if (note.includes('FINAL')) return { text: 'FINAL', className: 'bg-f1-yellow/20 text-f1-yellow' };
  if (note.includes('SATURDAY')) return { text: 'SAT RACE', className: 'bg-f1-purple/20 text-f1-purple' };
  if (note.includes('Season finale')) return { text: 'FINALE', className: 'bg-f1-red/20 text-f1-red' };
  if (raceDate < now) return { text: 'COMPLETED', className: 'bg-f1-border text-f1-text-muted' };
  return null;
}

export function Schedule() {
  const { data: apiRaces, meta, isLoading } = useSchedule();

  // Use API data, enrich with seed notes/country codes, or fall back to seed
  const races: RaceAPI[] = (apiRaces && apiRaces.length > 0) ? apiRaces.map(r => {
    const seed = SEED_RACES.find(s => s.round === r.round);
    return {
      ...r,
      countryCode: r.countryCode ?? seed?.country ?? '',
      raceDay: r.raceDay ?? r.date ?? seed?.raceDay ?? '',
      dateStart: r.dateStart ?? seed?.dateStart ?? '',
      dateEnd: r.dateEnd ?? seed?.dateEnd ?? '',
      note: r.note ?? seed?.note ?? '',
    };
  }) : SEED_RACES.map(r => ({
    round: r.round,
    name: r.name,
    circuit: r.circuit,
    city: r.city,
    country: r.countryName,
    countryCode: r.country,
    raceDay: r.raceDay,
    dateStart: r.dateStart,
    dateEnd: r.dateEnd,
    sprint: r.sprint,
    note: r.note,
  }));

  if (isLoading) return <LoadingTelemetry />;

  const now = new Date();
  const summerStart = new Date(SUMMER_BREAK.start);
  const summerEnd = new Date(SUMMER_BREAK.end);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-[var(--font-display)] text-f1-text">
          2026 Season Calendar
        </h1>
        {meta && <FreshnessIndicator source={meta.source} fetchedAt={meta.fetched_at} stale={meta.stale} />}
      </div>

      {/* Pre-season testing */}
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
              <span className="font-timing text-xs text-f1-text-muted">{test.dates} ({test.days} days)</span>
            </div>
          ))}
        </div>
      </div>

      {/* Race calendar */}
      <div className="space-y-2">
        {races.map((race, i) => {
          const badge = getBadge(race, races);
          const isPast = new Date(race.raceDay ?? '') < now;
          const isNext = badge?.text === 'NEXT';
          const showBreak = i > 0 && races[i - 1].round === 13 && race.round === 14;

          return (
            <div key={race.round}>
              {showBreak && (
                <div className="flex items-center gap-4 py-3 px-4">
                  <div className="flex-1 h-px bg-f1-border" />
                  <span className="text-xs text-f1-text-muted font-[var(--font-display)] uppercase tracking-wider">
                    Summer Break — {summerStart.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })} to {summerEnd.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })}
                  </span>
                  <div className="flex-1 h-px bg-f1-border" />
                </div>
              )}

              <div
                className={`flex items-center gap-4 px-4 py-3 rounded-lg border transition-colors ${
                  isNext
                    ? 'border-f1-red bg-f1-red/5'
                    : isPast
                    ? 'border-f1-border/50 bg-f1-surface/50 opacity-60'
                    : 'border-f1-border bg-f1-surface hover:bg-f1-elevated/30'
                }`}
              >
                <span className={`font-timing text-sm w-8 text-center ${isNext ? 'text-f1-red font-bold' : 'text-f1-text-muted'}`}>
                  {String(race.round).padStart(2, '0')}
                </span>
                <span className="text-xl w-8 text-center">{countryFlag(race.countryCode ?? '')}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold font-[var(--font-display)] truncate text-f1-text">
                      {race.name}
                    </span>
                    {race.sprint && (
                      <span className="px-1.5 py-0.5 bg-f1-yellow/20 text-f1-yellow rounded text-[10px] font-semibold shrink-0">
                        SPRINT
                      </span>
                    )}
                    {badge && (
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold shrink-0 ${badge.className}`}>
                        {badge.text}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-f1-text-muted truncate">
                    {race.circuit} — {race.city}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-timing text-xs text-f1-text">
                    {race.raceDay ? new Date(race.raceDay).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' }) : ''}
                  </div>
                  <div className="font-timing text-[10px] text-f1-text-muted">
                    {race.dateStart ? new Date(race.dateStart).toLocaleDateString('en-GB', { weekday: 'short' }) : ''}–{race.dateEnd ? new Date(race.dateEnd).toLocaleDateString('en-GB', { weekday: 'short' }) : ''}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="text-center text-f1-text-muted text-xs font-timing py-4">
        {races.length} Races — {races.filter(r => r.sprint).length} Sprint Weekends — {PRE_SEASON_TESTING.length} Test Sessions
      </div>
    </div>
  );
}
