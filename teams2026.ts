// f1-pitwall/frontend/src/data/teams2026.ts
// 2026 Season Data — Verified against official F1 sources, February 2026
// DO NOT fetch this from an API. This is static season data.

export interface Driver {
  id: string;
  name: string;
  abbreviation: string;
  number: number;
  country: string;
  countryName: string;
  dateOfBirth: string;
  role?: string;
  note: string;
}

export interface Team {
  id: string;
  name: string;
  fullName: string;
  engine: string;
  color: string;
  secondaryColor: string;
  base: string;
  teamPrincipal: string;
  chassis: string;
  drivers: [Driver, Driver];
  note: string;
}

export interface EngineSupplier {
  name: string;
  teams: string[];
  note: string;
}

export const SEASON = 2026;

export const TEAMS: Team[] = [
  {
    id: "mclaren",
    name: "McLaren",
    fullName: "McLaren-Mercedes",
    engine: "Mercedes",
    color: "#FF8000",
    secondaryColor: "#47C7FC",
    base: "Woking, United Kingdom",
    teamPrincipal: "Andrea Stella",
    chassis: "MCL60",
    drivers: [
      {
        id: "norris",
        name: "Lando Norris",
        abbreviation: "NOR",
        number: 1,
        country: "GB",
        countryName: "United Kingdom",
        dateOfBirth: "1999-11-13",
        role: "Reigning World Drivers' Champion",
        note: "Won his maiden title in 2025. 7th F1 season.",
      },
      {
        id: "piastri",
        name: "Oscar Piastri",
        abbreviation: "PIA",
        number: 81,
        country: "AU",
        countryName: "Australia",
        dateOfBirth: "2001-04-06",
        note: "4th F1 season. Led 2025 championship for most of the season before finishing 3rd.",
      },
    ],
    note: "Reigning Constructors' Champions (2024, 2025 — back-to-back). Entered 2026 as favourites.",
  },
  {
    id: "ferrari",
    name: "Ferrari",
    fullName: "Scuderia Ferrari",
    engine: "Ferrari",
    color: "#E8002D",
    secondaryColor: "#FFEB3B",
    base: "Maranello, Italy",
    teamPrincipal: "Frédéric Vasseur",
    chassis: "SF-26",
    drivers: [
      {
        id: "leclerc",
        name: "Charles Leclerc",
        abbreviation: "LEC",
        number: 16,
        country: "MC",
        countryName: "Monaco",
        dateOfBirth: "1997-10-16",
        note: "Contract through 2029. Ferrari's lead driver.",
      },
      {
        id: "hamilton",
        name: "Lewis Hamilton",
        abbreviation: "HAM",
        number: 44,
        country: "GB",
        countryName: "United Kingdom",
        dateOfBirth: "1985-01-07",
        note: "7-time World Champion. Second season at Ferrari. Multi-year contract.",
      },
    ],
    note: "Only team to have competed in every F1 season since 1950.",
  },
  {
    id: "red_bull",
    name: "Red Bull Racing",
    fullName: "Red Bull Racing-Ford",
    engine: "Red Bull Powertrains/Ford",
    color: "#3671C6",
    secondaryColor: "#FFD700",
    base: "Milton Keynes, United Kingdom",
    teamPrincipal: "Christian Horner",
    chassis: "RB22",
    drivers: [
      {
        id: "verstappen",
        name: "Max Verstappen",
        abbreviation: "VER",
        number: 33,
        country: "NL",
        countryName: "Netherlands",
        dateOfBirth: "1997-09-30",
        note: "4-time World Champion (2021-2024). Contracted through 2028.",
      },
      {
        id: "hadjar",
        name: "Isack Hadjar",
        abbreviation: "HAD",
        number: 6,
        country: "FR",
        countryName: "France",
        dateOfBirth: "2004-09-28",
        note: "Promoted from Racing Bulls after strong rookie 2025 season.",
      },
    ],
    note: "Debuting their own Red Bull/Ford power unit for the first time in 2026. Ford's return to F1 after 22 years.",
  },
  {
    id: "mercedes",
    name: "Mercedes",
    fullName: "Mercedes-AMG Petronas",
    engine: "Mercedes",
    color: "#27F4D2",
    secondaryColor: "#000000",
    base: "Brackley, United Kingdom",
    teamPrincipal: "Toto Wolff",
    chassis: "W17",
    drivers: [
      {
        id: "russell",
        name: "George Russell",
        abbreviation: "RUS",
        number: 63,
        country: "GB",
        countryName: "United Kingdom",
        dateOfBirth: "1998-02-15",
        note: "Contract renewed for 2026. Bookies' favourite for 2026 title.",
      },
      {
        id: "antonelli",
        name: "Kimi Antonelli",
        abbreviation: "ANT",
        number: 12,
        country: "IT",
        countryName: "Italy",
        dateOfBirth: "2006-08-25",
        note: "Second season. Scored 3 podiums in rookie 2025 campaign. Mercedes junior product.",
      },
    ],
    note: "Supplies engines to McLaren, Williams, and Alpine (4 customer teams total).",
  },
  {
    id: "aston_martin",
    name: "Aston Martin",
    fullName: "Aston Martin Aramco-Honda",
    engine: "Honda",
    color: "#229971",
    secondaryColor: "#FFFFFF",
    base: "Silverstone, United Kingdom",
    teamPrincipal: "Adrian Newey",
    chassis: "AMR26",
    drivers: [
      {
        id: "alonso",
        name: "Fernando Alonso",
        abbreviation: "ALO",
        number: 14,
        country: "ES",
        countryName: "Spain",
        dateOfBirth: "1981-07-29",
        note: "23rd F1 season. 2-time World Champion. Most experienced driver on the grid.",
      },
      {
        id: "stroll",
        name: "Lance Stroll",
        abbreviation: "STR",
        number: 18,
        country: "CA",
        countryName: "Canada",
        dateOfBirth: "1998-10-29",
        note: "10th F1 season.",
      },
    ],
    note: "Switched from Mercedes to Honda engines for 2026. Adrian Newey joined as Team Principal — his first year designing the car.",
  },
  {
    id: "alpine",
    name: "Alpine",
    fullName: "Alpine-Mercedes",
    engine: "Mercedes",
    color: "#0093CC",
    secondaryColor: "#FF69B4",
    base: "Enstone, United Kingdom",
    teamPrincipal: "Flavio Briatore (Managing)",
    chassis: "A526",
    drivers: [
      {
        id: "gasly",
        name: "Pierre Gasly",
        abbreviation: "GAS",
        number: 10,
        country: "FR",
        countryName: "France",
        dateOfBirth: "1996-02-07",
        note: "Multi-year contract through 2028. Team leader.",
      },
      {
        id: "colapinto",
        name: "Franco Colapinto",
        abbreviation: "COL",
        number: 43,
        country: "AR",
        countryName: "Argentina",
        dateOfBirth: "2003-05-27",
        note: "Second full F1 season.",
      },
    ],
    note: "Renault ended F1 engine programme. Alpine switched to Mercedes customer engines for 2026 (deal through 2030).",
  },
  {
    id: "williams",
    name: "Williams",
    fullName: "Williams-Mercedes",
    engine: "Mercedes",
    color: "#64C4FF",
    secondaryColor: "#041E42",
    base: "Grove, United Kingdom",
    teamPrincipal: "James Vowles",
    chassis: "FW48",
    drivers: [
      {
        id: "albon",
        name: "Alex Albon",
        abbreviation: "ALB",
        number: 23,
        country: "TH",
        countryName: "Thailand",
        dateOfBirth: "1996-03-23",
        note: "5th season with Williams. Long-term contract.",
      },
      {
        id: "sainz",
        name: "Carlos Sainz",
        abbreviation: "SAI",
        number: 55,
        country: "ES",
        countryName: "Spain",
        dateOfBirth: "1994-09-01",
        note: "Joined Williams in 2025. Contract through 2028. Considered top 4 driver.",
      },
    ],
    note: "Longest continuous Mercedes customer partnership (since 2014). Finished 5th in 2025.",
  },
  {
    id: "racing_bulls",
    name: "Racing Bulls",
    fullName: "Racing Bulls-Red Bull Ford",
    engine: "Red Bull Powertrains/Ford",
    color: "#6692FF",
    secondaryColor: "#1E41FF",
    base: "Faenza, Italy",
    teamPrincipal: "Laurent Mekies",
    chassis: "VCARB 02",
    drivers: [
      {
        id: "lawson",
        name: "Liam Lawson",
        abbreviation: "LAW",
        number: 30,
        country: "NZ",
        countryName: "New Zealand",
        dateOfBirth: "2002-02-11",
        note: "Was promoted to Red Bull briefly in 2025, then back to Racing Bulls.",
      },
      {
        id: "lindblad",
        name: "Arvid Lindblad",
        abbreviation: "LIN",
        number: 2,
        country: "GB",
        countryName: "United Kingdom",
        dateOfBirth: "2006-10-11",
        note: "ROOKIE — The only rookie on the 2026 grid. Red Bull Junior. Youngest F2 race winner in history.",
      },
    ],
    note: "Red Bull's sister team. Same Red Bull/Ford engine as the senior team.",
  },
  {
    id: "haas",
    name: "Haas",
    fullName: "Haas-Ferrari",
    engine: "Ferrari",
    color: "#B6BABD",
    secondaryColor: "#E60012",
    base: "Kannapolis, USA",
    teamPrincipal: "Ayao Komatsu",
    chassis: "VF-26",
    drivers: [
      {
        id: "ocon",
        name: "Esteban Ocon",
        abbreviation: "OCO",
        number: 31,
        country: "FR",
        countryName: "France",
        dateOfBirth: "1996-09-17",
        note: "Second season at Haas.",
      },
      {
        id: "bearman",
        name: "Oliver Bearman",
        abbreviation: "BEA",
        number: 87,
        country: "GB",
        countryName: "United Kingdom",
        dateOfBirth: "2005-05-08",
        note: "Second season. Multi-year deal. Impressive rookie year.",
      },
    ],
    note: "Ferrari engine customer since debut in 2016. Technical partnership with Toyota expanded for 2026.",
  },
  {
    id: "audi",
    name: "Audi",
    fullName: "Audi F1 Team",
    engine: "Audi",
    color: "#00594F",
    secondaryColor: "#C0C0C0",
    base: "Hinwil, Switzerland (chassis) / Neuburg, Germany (PU)",
    teamPrincipal: "Mattia Binotto (COO)",
    chassis: "AUD26",
    drivers: [
      {
        id: "hulkenberg",
        name: "Nico Hülkenberg",
        abbreviation: "HUL",
        number: 27,
        country: "DE",
        countryName: "Germany",
        dateOfBirth: "1987-08-19",
        note: "Senior driver guiding Audi through debut season.",
      },
      {
        id: "bortoleto",
        name: "Gabriel Bortoleto",
        abbreviation: "BOR",
        number: 5,
        country: "BR",
        countryName: "Brazil",
        dateOfBirth: "2004-10-14",
        note: "Second season. Multi-year deal.",
      },
    ],
    note: "NEW WORKS TEAM — Formerly Kick Sauber, now full Audi takeover with own power unit.",
  },
  {
    id: "cadillac",
    name: "Cadillac",
    fullName: "Cadillac F1 Team",
    engine: "Ferrari",
    color: "#1E1E1E",
    secondaryColor: "#D4A96A",
    base: "Silverstone, UK (HQ) / Indianapolis & Charlotte, USA",
    teamPrincipal: "Graeme Lowdon",
    chassis: "CAD26",
    drivers: [
      {
        id: "bottas",
        name: "Valtteri Bottas",
        abbreviation: "BOT",
        number: 77,
        country: "FI",
        countryName: "Finland",
        dateOfBirth: "1989-08-28",
        note: "Returns after 1 year absence. Was Mercedes reserve in 2025. 200+ race starts.",
      },
      {
        id: "perez",
        name: "Sergio Pérez",
        abbreviation: "PER",
        number: 11,
        country: "MX",
        countryName: "Mexico",
        dateOfBirth: "1990-01-26",
        note: "Returns after 1 year absence. Left Red Bull end of 2024.",
      },
    ],
    note: "BRAND NEW 11th TEAM — First new F1 team since Haas in 2016. Originally Andretti bid, now Cadillac/GM. Ferrari engines initially, own GM PU planned for 2029.",
  },
];

export const ENGINE_SUPPLIERS: EngineSupplier[] = [
  { name: "Mercedes", teams: ["Mercedes", "McLaren", "Williams", "Alpine"], note: "Supplies the most teams (4)." },
  { name: "Ferrari", teams: ["Ferrari", "Haas", "Cadillac"], note: "3 customer teams including new entry Cadillac." },
  { name: "Red Bull Powertrains/Ford", teams: ["Red Bull Racing", "Racing Bulls"], note: "Red Bull's first in-house engine. Ford returns after 22 years." },
  { name: "Honda", teams: ["Aston Martin"], note: "Exclusive supply to Aston Martin." },
  { name: "Audi", teams: ["Audi"], note: "Brand new PU. Only supplies own team." },
];

// Helper: get all 22 drivers as a flat array
export const ALL_DRIVERS: (Driver & { teamId: string; teamName: string; teamColor: string })[] =
  TEAMS.flatMap((team) =>
    team.drivers.map((driver) => ({
      ...driver,
      teamId: team.id,
      teamName: team.name,
      teamColor: team.color,
    }))
  );

// Helper: get team by ID
export const getTeam = (id: string): Team | undefined => TEAMS.find((t) => t.id === id);

// Helper: get driver by ID
export const getDriver = (id: string) => ALL_DRIVERS.find((d) => d.id === id);

// Helper: team color map for quick lookups
export const TEAM_COLORS: Record<string, string> = Object.fromEntries(
  TEAMS.map((t) => [t.id, t.color])
);
