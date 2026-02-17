// f1-pitwall/frontend/src/data/calendar2026.ts
// 2026 Race Calendar — Verified against official F1 sources, February 2026

export interface TestEvent {
  event: string;
  location: string;
  dates: string;
  days: number;
}

export interface Race {
  round: number;
  name: string;
  officialName?: string;
  circuit: string;
  city: string;
  country: string; // ISO 2-letter
  countryName: string;
  dateStart: string; // Friday ISO date
  dateEnd: string; // Sunday ISO date
  raceDay: string; // ISO date of the race
  sprint: boolean;
  note?: string;
}

export const SEASON = 2026;

export const PRE_SEASON_TESTING: TestEvent[] = [
  { event: "Private Test (closed)", location: "Circuit de Barcelona-Catalunya, Spain", dates: "Jan 26–30", days: 4 },
  { event: "Pre-Season Test 1", location: "Bahrain International Circuit", dates: "Feb 11–13", days: 3 },
  { event: "Pre-Season Test 2", location: "Bahrain International Circuit", dates: "Feb 18–20", days: 3 },
];

export const RACES: Race[] = [
  { round: 1, name: "Australian Grand Prix", circuit: "Albert Park Circuit", city: "Melbourne", country: "AU", countryName: "Australia", dateStart: "2026-03-06", dateEnd: "2026-03-08", raceDay: "2026-03-08", sprint: false },
  { round: 2, name: "Chinese Grand Prix", circuit: "Shanghai International Circuit", city: "Shanghai", country: "CN", countryName: "China", dateStart: "2026-03-13", dateEnd: "2026-03-15", raceDay: "2026-03-15", sprint: true },
  { round: 3, name: "Japanese Grand Prix", circuit: "Suzuka International Racing Course", city: "Suzuka", country: "JP", countryName: "Japan", dateStart: "2026-03-27", dateEnd: "2026-03-29", raceDay: "2026-03-29", sprint: false },
  { round: 4, name: "Bahrain Grand Prix", circuit: "Bahrain International Circuit", city: "Sakhir", country: "BH", countryName: "Bahrain", dateStart: "2026-04-10", dateEnd: "2026-04-12", raceDay: "2026-04-12", sprint: false },
  { round: 5, name: "Saudi Arabian Grand Prix", circuit: "Jeddah Corniche Circuit", city: "Jeddah", country: "SA", countryName: "Saudi Arabia", dateStart: "2026-04-17", dateEnd: "2026-04-19", raceDay: "2026-04-19", sprint: false },
  { round: 6, name: "Miami Grand Prix", circuit: "Miami International Autodrome", city: "Miami", country: "US", countryName: "United States", dateStart: "2026-05-01", dateEnd: "2026-05-03", raceDay: "2026-05-03", sprint: true },
  { round: 7, name: "Canadian Grand Prix", circuit: "Circuit Gilles Villeneuve", city: "Montreal", country: "CA", countryName: "Canada", dateStart: "2026-05-22", dateEnd: "2026-05-24", raceDay: "2026-05-24", sprint: true },
  { round: 8, name: "Monaco Grand Prix", circuit: "Circuit de Monaco", city: "Monte Carlo", country: "MC", countryName: "Monaco", dateStart: "2026-06-05", dateEnd: "2026-06-07", raceDay: "2026-06-07", sprint: false },
  { round: 9, name: "Spanish Grand Prix", officialName: "Barcelona-Catalunya GP", circuit: "Circuit de Barcelona-Catalunya", city: "Montmeló", country: "ES", countryName: "Spain", dateStart: "2026-06-12", dateEnd: "2026-06-14", raceDay: "2026-06-14", sprint: false },
  { round: 10, name: "Austrian Grand Prix", circuit: "Red Bull Ring", city: "Spielberg", country: "AT", countryName: "Austria", dateStart: "2026-06-26", dateEnd: "2026-06-28", raceDay: "2026-06-28", sprint: false },
  { round: 11, name: "British Grand Prix", circuit: "Silverstone Circuit", city: "Silverstone", country: "GB", countryName: "United Kingdom", dateStart: "2026-07-03", dateEnd: "2026-07-05", raceDay: "2026-07-05", sprint: true },
  { round: 12, name: "Belgian Grand Prix", circuit: "Circuit de Spa-Francorchamps", city: "Stavelot", country: "BE", countryName: "Belgium", dateStart: "2026-07-17", dateEnd: "2026-07-19", raceDay: "2026-07-19", sprint: false },
  { round: 13, name: "Hungarian Grand Prix", circuit: "Hungaroring", city: "Budapest", country: "HU", countryName: "Hungary", dateStart: "2026-07-24", dateEnd: "2026-07-26", raceDay: "2026-07-26", sprint: false },
  // Summer Break: Jul 27 – Aug 20
  { round: 14, name: "Dutch Grand Prix", circuit: "Circuit Zandvoort", city: "Zandvoort", country: "NL", countryName: "Netherlands", dateStart: "2026-08-21", dateEnd: "2026-08-23", raceDay: "2026-08-23", sprint: true, note: "FINAL Dutch GP — Zandvoort leaves calendar after 2026" },
  { round: 15, name: "Italian Grand Prix", circuit: "Autodromo Nazionale Monza", city: "Monza", country: "IT", countryName: "Italy", dateStart: "2026-09-04", dateEnd: "2026-09-06", raceDay: "2026-09-06", sprint: false },
  { round: 16, name: "Madrid Grand Prix", circuit: "Madrid Street Circuit", city: "Madrid", country: "ES", countryName: "Spain", dateStart: "2026-09-12", dateEnd: "2026-09-14", raceDay: "2026-09-14", sprint: false, note: "NEW CIRCUIT — Madrid street circuit debut" },
  { round: 17, name: "Azerbaijan Grand Prix", circuit: "Baku City Circuit", city: "Baku", country: "AZ", countryName: "Azerbaijan", dateStart: "2026-09-24", dateEnd: "2026-09-26", raceDay: "2026-09-26", sprint: false, note: "SATURDAY RACE" },
  { round: 18, name: "Singapore Grand Prix", circuit: "Marina Bay Street Circuit", city: "Singapore", country: "SG", countryName: "Singapore", dateStart: "2026-10-09", dateEnd: "2026-10-11", raceDay: "2026-10-11", sprint: true },
  { round: 19, name: "United States Grand Prix", circuit: "Circuit of the Americas", city: "Austin", country: "US", countryName: "United States", dateStart: "2026-10-23", dateEnd: "2026-10-25", raceDay: "2026-10-25", sprint: false },
  { round: 20, name: "Mexico City Grand Prix", circuit: "Autódromo Hermanos Rodríguez", city: "Mexico City", country: "MX", countryName: "Mexico", dateStart: "2026-10-30", dateEnd: "2026-11-01", raceDay: "2026-11-01", sprint: false },
  { round: 21, name: "São Paulo Grand Prix", circuit: "Interlagos", city: "São Paulo", country: "BR", countryName: "Brazil", dateStart: "2026-11-06", dateEnd: "2026-11-08", raceDay: "2026-11-08", sprint: false },
  { round: 22, name: "Las Vegas Grand Prix", circuit: "Las Vegas Strip Circuit", city: "Las Vegas", country: "US", countryName: "United States", dateStart: "2026-11-20", dateEnd: "2026-11-22", raceDay: "2026-11-21", sprint: false, note: "SATURDAY NIGHT RACE" },
  { round: 23, name: "Qatar Grand Prix", circuit: "Lusail International Circuit", city: "Lusail", country: "QA", countryName: "Qatar", dateStart: "2026-11-27", dateEnd: "2026-11-29", raceDay: "2026-11-29", sprint: false },
  { round: 24, name: "Abu Dhabi Grand Prix", circuit: "Yas Marina Circuit", city: "Abu Dhabi", country: "AE", countryName: "United Arab Emirates", dateStart: "2026-12-04", dateEnd: "2026-12-06", raceDay: "2026-12-06", sprint: false, note: "Season finale" },
];

export const SPRINT_WEEKENDS = ["China", "Miami", "Canada", "Great Britain", "Netherlands", "Singapore"];

export const SUMMER_BREAK = { start: "2026-07-27", end: "2026-08-20" };

export const TOTAL_ROUNDS = 24;
export const TOTAL_SPRINTS = 6;

// Helper: get next upcoming race
export const getNextRace = (): Race | undefined => {
  const now = new Date();
  return RACES.find((r) => new Date(r.raceDay) >= now);
};

// Helper: get race by round number
export const getRace = (round: number): Race | undefined => RACES.find((r) => r.round === round);

// Helper: days until next race
export const daysUntilNextRace = (): number | null => {
  const next = getNextRace();
  if (!next) return null;
  const diff = new Date(next.raceDay).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};
