# F1 PitWall — Claude Code Project Prompt

## Project Overview

Build **F1 PitWall**, a comprehensive Formula 1 platform combining three pillars:

1. **F1 Info Hub** — A formula1.com-style section with the current 2026 season info: schedule, teams, drivers, standings, regulations, and news feed
2. **Live Analytics Dashboard** — Real-time timing, ML predictions, weather, and strategy analysis during race weekends (design inspired by f1-dash.com)
3. **Fantasy Optimizer** — A full fantasy toolkit cloning f1fantasytools.com's feature set: team calculator, budget builder, live scoring, elite data, statistics, team analyzer, league analyzer, hindsight, and more

---

## ⚠️ CRITICAL: 2026 Season Data — HARDCODE ALL OF THIS

The app MUST launch with 100% accurate 2026 season data on first load. **Do NOT rely on any API to populate teams, drivers, or the calendar.** This data is static for the season and must be embedded directly in the codebase as constants/seed data. The app should look fully populated and professional the moment it opens — no empty states, no placeholder data, no "loading" for basic season info.

Every driver name, team name, engine supplier, race date, and regulation detail below has been verified against official F1 sources as of February 2026. Use this as the single source of truth.

### 2026 Teams, Drivers & Engine Suppliers (11 teams, 22 drivers)

```json
{
  "season": 2026,
  "teams": [
    {
      "id": "mclaren",
      "name": "McLaren",
      "full_name": "McLaren-Mercedes",
      "engine": "Mercedes",
      "color": "#FF8000",
      "secondary_color": "#47C7FC",
      "base": "Woking, United Kingdom",
      "team_principal": "Andrea Stella",
      "chassis": "MCL60",
      "drivers": [
        {
          "id": "norris", "name": "Lando Norris", "abbreviation": "NOR", "number": 1,
          "country": "GB", "country_name": "United Kingdom", "date_of_birth": "1999-11-13",
          "role": "Reigning World Drivers' Champion",
          "note": "Won his maiden title in 2025. 7th F1 season."
        },
        {
          "id": "piastri", "name": "Oscar Piastri", "abbreviation": "PIA", "number": 81,
          "country": "AU", "country_name": "Australia", "date_of_birth": "2001-04-06",
          "note": "4th F1 season. Led 2025 championship for most of the season before finishing 3rd."
        }
      ],
      "note": "Reigning Constructors' Champions (2024, 2025 — back-to-back). Entered 2026 as favourites."
    },
    {
      "id": "ferrari",
      "name": "Ferrari",
      "full_name": "Scuderia Ferrari",
      "engine": "Ferrari",
      "color": "#E8002D",
      "secondary_color": "#FFEB3B",
      "base": "Maranello, Italy",
      "team_principal": "Frédéric Vasseur",
      "chassis": "SF-26",
      "drivers": [
        {
          "id": "leclerc", "name": "Charles Leclerc", "abbreviation": "LEC", "number": 16,
          "country": "MC", "country_name": "Monaco", "date_of_birth": "1997-10-16",
          "note": "Contract through 2029. Ferrari's lead driver."
        },
        {
          "id": "hamilton", "name": "Lewis Hamilton", "abbreviation": "HAM", "number": 44,
          "country": "GB", "country_name": "United Kingdom", "date_of_birth": "1985-01-07",
          "note": "7-time World Champion. Second season at Ferrari. Multi-year contract."
        }
      ],
      "note": "Only team to have competed in every F1 season since 1950."
    },
    {
      "id": "red_bull",
      "name": "Red Bull Racing",
      "full_name": "Red Bull Racing-Ford",
      "engine": "Red Bull Powertrains/Ford",
      "color": "#3671C6",
      "secondary_color": "#FFD700",
      "base": "Milton Keynes, United Kingdom",
      "team_principal": "Christian Horner",
      "chassis": "RB22",
      "drivers": [
        {
          "id": "verstappen", "name": "Max Verstappen", "abbreviation": "VER", "number": 33,
          "country": "NL", "country_name": "Netherlands", "date_of_birth": "1997-09-30",
          "note": "4-time World Champion (2021-2024). Contracted through 2028."
        },
        {
          "id": "hadjar", "name": "Isack Hadjar", "abbreviation": "HAD", "number": 6,
          "country": "FR", "country_name": "France", "date_of_birth": "2004-09-28",
          "note": "Promoted from Racing Bulls after strong rookie 2025 season."
        }
      ],
      "note": "Debuting their own Red Bull/Ford power unit for the first time in 2026. Ford's return to F1 after 22 years."
    },
    {
      "id": "mercedes",
      "name": "Mercedes",
      "full_name": "Mercedes-AMG Petronas",
      "engine": "Mercedes",
      "color": "#27F4D2",
      "secondary_color": "#000000",
      "base": "Brackley, United Kingdom",
      "team_principal": "Toto Wolff",
      "chassis": "W17",
      "drivers": [
        {
          "id": "russell", "name": "George Russell", "abbreviation": "RUS", "number": 63,
          "country": "GB", "country_name": "United Kingdom", "date_of_birth": "1998-02-15",
          "note": "Contract renewed for 2026. Bookies' favourite for 2026 title."
        },
        {
          "id": "antonelli", "name": "Kimi Antonelli", "abbreviation": "ANT", "number": 12,
          "country": "IT", "country_name": "Italy", "date_of_birth": "2006-08-25",
          "note": "Second season. Scored 3 podiums in rookie 2025 campaign. Mercedes junior product."
        }
      ],
      "note": "Supplies engines to McLaren, Williams, and Alpine (4 customer teams total)."
    },
    {
      "id": "aston_martin",
      "name": "Aston Martin",
      "full_name": "Aston Martin Aramco-Honda",
      "engine": "Honda",
      "color": "#229971",
      "secondary_color": "#FFFFFF",
      "base": "Silverstone, United Kingdom",
      "team_principal": "Adrian Newey",
      "chassis": "AMR26",
      "drivers": [
        {
          "id": "alonso", "name": "Fernando Alonso", "abbreviation": "ALO", "number": 14,
          "country": "ES", "country_name": "Spain", "date_of_birth": "1981-07-29",
          "note": "23rd F1 season. 2-time World Champion. Most experienced driver on the grid."
        },
        {
          "id": "stroll", "name": "Lance Stroll", "abbreviation": "STR", "number": 18,
          "country": "CA", "country_name": "Canada", "date_of_birth": "1998-10-29",
          "note": "10th F1 season."
        }
      ],
      "note": "Switched from Mercedes to Honda engines for 2026. Adrian Newey joined as Team Principal — his first year designing the car."
    },
    {
      "id": "alpine",
      "name": "Alpine",
      "full_name": "Alpine-Mercedes",
      "engine": "Mercedes",
      "color": "#0093CC",
      "secondary_color": "#FF69B4",
      "base": "Enstone, United Kingdom",
      "team_principal": "Flavio Briatore (Managing)",
      "chassis": "A526",
      "drivers": [
        {
          "id": "gasly", "name": "Pierre Gasly", "abbreviation": "GAS", "number": 10,
          "country": "FR", "country_name": "France", "date_of_birth": "1996-02-07",
          "note": "Multi-year contract through 2028. Team leader."
        },
        {
          "id": "colapinto", "name": "Franco Colapinto", "abbreviation": "COL", "number": 43,
          "country": "AR", "country_name": "Argentina", "date_of_birth": "2003-05-27",
          "note": "Second full F1 season."
        }
      ],
      "note": "Renault ended F1 engine programme. Alpine switched to Mercedes customer engines for 2026 (deal through 2030)."
    },
    {
      "id": "williams",
      "name": "Williams",
      "full_name": "Williams-Mercedes",
      "engine": "Mercedes",
      "color": "#64C4FF",
      "secondary_color": "#041E42",
      "base": "Grove, United Kingdom",
      "team_principal": "James Vowles",
      "chassis": "FW48",
      "drivers": [
        {
          "id": "albon", "name": "Alex Albon", "abbreviation": "ALB", "number": 23,
          "country": "TH", "country_name": "Thailand", "date_of_birth": "1996-03-23",
          "note": "5th season with Williams. Long-term contract."
        },
        {
          "id": "sainz", "name": "Carlos Sainz", "abbreviation": "SAI", "number": 55,
          "country": "ES", "country_name": "Spain", "date_of_birth": "1994-09-01",
          "note": "Joined Williams in 2025. Contract through 2028. Considered top 4 driver."
        }
      ],
      "note": "Longest continuous Mercedes customer partnership (since 2014). Finished 5th in 2025."
    },
    {
      "id": "racing_bulls",
      "name": "Racing Bulls",
      "full_name": "Racing Bulls-Red Bull Ford",
      "engine": "Red Bull Powertrains/Ford",
      "color": "#6692FF",
      "secondary_color": "#1E41FF",
      "base": "Faenza, Italy",
      "team_principal": "Laurent Mekies",
      "chassis": "VCARB 02",
      "drivers": [
        {
          "id": "lawson", "name": "Liam Lawson", "abbreviation": "LAW", "number": 30,
          "country": "NZ", "country_name": "New Zealand", "date_of_birth": "2002-02-11",
          "note": "Was promoted to Red Bull briefly in 2025, then back to Racing Bulls."
        },
        {
          "id": "lindblad", "name": "Arvid Lindblad", "abbreviation": "LIN", "number": 2,
          "country": "GB", "country_name": "United Kingdom", "date_of_birth": "2006-10-11",
          "note": "ROOKIE — The only rookie on the 2026 grid. Red Bull Junior. Youngest F2 race winner in history."
        }
      ],
      "note": "Red Bull's sister team. Same Red Bull/Ford engine as the senior team."
    },
    {
      "id": "haas",
      "name": "Haas",
      "full_name": "Haas-Ferrari",
      "engine": "Ferrari",
      "color": "#B6BABD",
      "secondary_color": "#E60012",
      "base": "Kannapolis, USA",
      "team_principal": "Ayao Komatsu",
      "chassis": "VF-26",
      "drivers": [
        {
          "id": "ocon", "name": "Esteban Ocon", "abbreviation": "OCO", "number": 31,
          "country": "FR", "country_name": "France", "date_of_birth": "1996-09-17",
          "note": "Second season at Haas."
        },
        {
          "id": "bearman", "name": "Oliver Bearman", "abbreviation": "BEA", "number": 87,
          "country": "GB", "country_name": "United Kingdom", "date_of_birth": "2005-05-08",
          "note": "Second season. Multi-year deal. Impressive rookie year."
        }
      ],
      "note": "Ferrari engine customer since debut in 2016. Technical partnership with Toyota expanded for 2026."
    },
    {
      "id": "audi",
      "name": "Audi",
      "full_name": "Audi F1 Team",
      "engine": "Audi",
      "color": "#00594F",
      "secondary_color": "#C0C0C0",
      "base": "Hinwil, Switzerland (chassis) / Neuburg, Germany (PU)",
      "team_principal": "Mattia Binotto (COO)",
      "chassis": "AUD26",
      "drivers": [
        {
          "id": "hulkenberg", "name": "Nico Hülkenberg", "abbreviation": "HUL", "number": 27,
          "country": "DE", "country_name": "Germany", "date_of_birth": "1987-08-19",
          "note": "Senior driver guiding Audi through debut season."
        },
        {
          "id": "bortoleto", "name": "Gabriel Bortoleto", "abbreviation": "BOR", "number": 5,
          "country": "BR", "country_name": "Brazil", "date_of_birth": "2004-10-14",
          "note": "Second season. Multi-year deal."
        }
      ],
      "note": "NEW WORKS TEAM — Formerly Kick Sauber, now full Audi takeover with own power unit."
    },
    {
      "id": "cadillac",
      "name": "Cadillac",
      "full_name": "Cadillac F1 Team",
      "engine": "Ferrari",
      "color": "#1E1E1E",
      "secondary_color": "#D4A96A",
      "base": "Silverstone, UK (HQ) / Indianapolis & Charlotte, USA",
      "team_principal": "Graeme Lowdon",
      "chassis": "CAD26",
      "drivers": [
        {
          "id": "bottas", "name": "Valtteri Bottas", "abbreviation": "BOT", "number": 77,
          "country": "FI", "country_name": "Finland", "date_of_birth": "1989-08-28",
          "note": "Returns after 1 year absence. Was Mercedes reserve in 2025. 200+ race starts."
        },
        {
          "id": "perez", "name": "Sergio Pérez", "abbreviation": "PER", "number": 11,
          "country": "MX", "country_name": "Mexico", "date_of_birth": "1990-01-26",
          "note": "Returns after 1 year absence. Left Red Bull end of 2024."
        }
      ],
      "note": "BRAND NEW 11th TEAM — First new F1 team since Haas in 2016. Originally Andretti bid, now Cadillac/GM. Ferrari engines initially, own GM PU planned for 2029."
    }
  ],
  "engine_suppliers": {
    "Mercedes": {"teams": ["Mercedes", "McLaren", "Williams", "Alpine"], "note": "Supplies the most teams (4)."},
    "Ferrari": {"teams": ["Ferrari", "Haas", "Cadillac"], "note": "3 customer teams including new entry Cadillac."},
    "Red Bull Powertrains/Ford": {"teams": ["Red Bull Racing", "Racing Bulls"], "note": "Red Bull's first in-house engine. Ford returns after 22 years."},
    "Honda": {"teams": ["Aston Martin"], "note": "Exclusive supply to Aston Martin."},
    "Audi": {"teams": ["Audi"], "note": "Brand new PU. Only supplies own team."}
  }
}
```

### 2026 Race Calendar (24 rounds + 6 sprints)

```json
{
  "pre_season_testing": [
    {"event": "Private Test (closed)", "location": "Barcelona-Catalunya, Spain", "dates": "Jan 26-30"},
    {"event": "Pre-Season Test 1", "location": "Bahrain International Circuit", "dates": "Feb 11-13"},
    {"event": "Pre-Season Test 2", "location": "Bahrain International Circuit", "dates": "Feb 18-20"}
  ],
  "races": [
    {"round": 1, "name": "Australian Grand Prix", "circuit": "Albert Park Circuit", "city": "Melbourne", "country": "AU", "dates": "Mar 6-8"},
    {"round": 2, "name": "Chinese Grand Prix", "circuit": "Shanghai International Circuit", "city": "Shanghai", "country": "CN", "dates": "Mar 13-15", "sprint": true},
    {"round": 3, "name": "Japanese Grand Prix", "circuit": "Suzuka International Racing Course", "city": "Suzuka", "country": "JP", "dates": "Mar 27-29"},
    {"round": 4, "name": "Bahrain Grand Prix", "circuit": "Bahrain International Circuit", "city": "Sakhir", "country": "BH", "dates": "Apr 10-12"},
    {"round": 5, "name": "Saudi Arabian Grand Prix", "circuit": "Jeddah Corniche Circuit", "city": "Jeddah", "country": "SA", "dates": "Apr 17-19"},
    {"round": 6, "name": "Miami Grand Prix", "circuit": "Miami International Autodrome", "city": "Miami", "country": "US", "dates": "May 1-3", "sprint": true},
    {"round": 7, "name": "Canadian Grand Prix", "circuit": "Circuit Gilles Villeneuve", "city": "Montreal", "country": "CA", "dates": "May 22-24", "sprint": true},
    {"round": 8, "name": "Monaco Grand Prix", "circuit": "Circuit de Monaco", "city": "Monte Carlo", "country": "MC", "dates": "Jun 5-7"},
    {"round": 9, "name": "Spanish Grand Prix (Barcelona)", "circuit": "Circuit de Barcelona-Catalunya", "city": "Montmeló", "country": "ES", "dates": "Jun 12-14"},
    {"round": 10, "name": "Austrian Grand Prix", "circuit": "Red Bull Ring", "city": "Spielberg", "country": "AT", "dates": "Jun 26-28"},
    {"round": 11, "name": "British Grand Prix", "circuit": "Silverstone Circuit", "city": "Silverstone", "country": "GB", "dates": "Jul 3-5", "sprint": true},
    {"round": 12, "name": "Belgian Grand Prix", "circuit": "Circuit de Spa-Francorchamps", "city": "Stavelot", "country": "BE", "dates": "Jul 17-19"},
    {"round": 13, "name": "Hungarian Grand Prix", "circuit": "Hungaroring", "city": "Budapest", "country": "HU", "dates": "Jul 24-26"},
    {"round": "BREAK", "name": "Summer Break", "dates": "Jul 27 - Aug 20"},
    {"round": 14, "name": "Dutch Grand Prix", "circuit": "Circuit Zandvoort", "city": "Zandvoort", "country": "NL", "dates": "Aug 21-23", "sprint": true, "note": "FINAL Dutch GP — Zandvoort leaves calendar after 2026"},
    {"round": 15, "name": "Italian Grand Prix", "circuit": "Autodromo Nazionale Monza", "city": "Monza", "country": "IT", "dates": "Sep 4-6"},
    {"round": 16, "name": "Madrid Grand Prix", "circuit": "Madrid Street Circuit", "city": "Madrid", "country": "ES", "dates": "Sep 12-14", "note": "NEW CIRCUIT — Madrid street circuit debut"},
    {"round": 17, "name": "Azerbaijan Grand Prix", "circuit": "Baku City Circuit", "city": "Baku", "country": "AZ", "dates": "Sep 24-26", "note": "SATURDAY RACE"},
    {"round": 18, "name": "Singapore Grand Prix", "circuit": "Marina Bay Street Circuit", "city": "Singapore", "country": "SG", "dates": "Oct 9-11", "sprint": true},
    {"round": 19, "name": "United States Grand Prix", "circuit": "Circuit of the Americas", "city": "Austin", "country": "US", "dates": "Oct 23-25"},
    {"round": 20, "name": "Mexico City Grand Prix", "circuit": "Autódromo Hermanos Rodríguez", "city": "Mexico City", "country": "MX", "dates": "Oct 30-Nov 1"},
    {"round": 21, "name": "São Paulo Grand Prix", "circuit": "Interlagos", "city": "São Paulo", "country": "BR", "dates": "Nov 6-8"},
    {"round": 22, "name": "Las Vegas Grand Prix", "circuit": "Las Vegas Strip Circuit", "city": "Las Vegas", "country": "US", "dates": "Nov 20-22", "note": "SATURDAY NIGHT RACE"},
    {"round": 23, "name": "Qatar Grand Prix", "circuit": "Lusail International Circuit", "city": "Lusail", "country": "QA", "dates": "Nov 27-29"},
    {"round": 24, "name": "Abu Dhabi Grand Prix", "circuit": "Yas Marina Circuit", "city": "Abu Dhabi", "country": "AE", "dates": "Dec 4-6", "note": "Season finale"}
  ],
  "sprint_weekends": ["China", "Miami", "Canada", "Great Britain", "Netherlands", "Singapore"]
}
```

### 2026 Key Regulation Changes

**Power Unit Revolution (biggest engine change since 2014):**
- ~1,000 bhp total — now ~50/50 split between ICE and electric (was ~80/20)
- MGU-H REMOVED. MGU-K output TRIPLED: 120kW → 350kW (470 bhp from electric)
- 100% advanced sustainable fuels mandatory
- 5 engine manufacturers: Mercedes, Ferrari, Red Bull/Ford (new), Honda, Audi (new)
- Battery management is critical: drivers must manage charge/deploy carefully

**Active Aerodynamics (DRS is DEAD):**
- DRS eliminated after 13 years. Replaced by active front AND rear wings:
  - **Z-Mode (low drag)**: Driver-activated in designated zones when within 1s of car ahead
  - **X-Mode (high downforce)**: Default cornering mode
- **Boost Button**: Manual electrical energy deploy. Can use all at once or spread across a lap.
- **Recharge modes**: Harvest energy braking, coasting, or "super clipping" (harvesting at full throttle)

**Smaller, Lighter Cars:** Wheelbase 360→340cm, Width 200→190cm, 30kg lighter

**Grid Expansion:** 11 teams / 22 drivers. Cadillac joins. Audi replaces Sauber as works team.

**Financial:** Cost cap $135M → $215M (operations), $95M → $130M (PU)

---

## App Navigation Structure

### Top Navigation Bar (F1.com-style — see uploaded screenshot)

Dark background with diagonal stripe pattern. F1 red accent on active items:

```
[PitWall Logo]   Season ▾   Results ▾   News ▾   Drivers ▾   Teams ▾   |   Fantasy ▾   Live ▾   [Settings ⚙]
```

- **Season** → Schedule, Standings, Regulations, About 2026
- **Results** → Latest Race Results, All Race Results, Sprint Results
- **News** → News feed page
- **Drivers** → All 22 drivers grid view with profiles
- **Teams** → All 11 teams with drivers, car info, engine, stats
- **Fantasy** → Opens fantasy section with sidebar navigation
- **Live** → Live Timing Board (main dashboard during active sessions)

### Fantasy Sidebar Navigation (f1fantasytools.com-style — see uploaded screenshot)

When in Fantasy section, vertical left sidebar:
```
🧮  Team Calculator      💰  Budget Builder        📡  Live Scoring
📊  Season Summary       👑  Elite Data            📈  Statistics
🔍  Team Analyzer        🏆  League Analyzer       ⏪  Hindsight
•••  More
```
Collapsible — icons-only when collapsed.

---

## Section A: F1 Info Hub (formula1.com-style)

This section provides comprehensive 2026 season information. It should be the app's landing page and work perfectly with just the hardcoded data above — no API calls needed.

### A.1 — Schedule Page
- Calendar view of all 24 races: country flag + circuit + city + date range
- Sprint badge for sprint weekends, "NEXT" indicator with countdown timer
- Special badges: "NEW CIRCUIT" (Madrid), "FINAL" (Zandvoort), "SATURDAY RACE" (Baku/Las Vegas)
- Race detail view (click in): circuit map, session schedule with local times, circuit stats, previous winners, weather forecast
- Pre-season testing section at top

### A.2 — Teams Page
- Grid of 11 team cards: team color gradient background, full constructor name, engine badge, both drivers, team principal, base, key note ("Reigning Champions", "New Team", etc.)
- Team detail page: full info, both driver profiles, car placeholder in team colors, season results, engine supplier info

### A.3 — Drivers Page
- 22 driver cards (4 columns desktop, 2 mobile): large driver number + abbreviation, full name, country flag, team color accent, team name, headshot placeholder (team color circle with initials)
- Driver detail page: bio, DOB, nationality, number, career stats, 2026 results, form chart (points per race line graph)

### A.4 — Standings Pages
Two tabs: **Drivers Championship** and **Constructors Championship**
- Tables with position, name, team color badge, points, wins, podiums
- Charts: Points progression over races (line chart per driver/team)
- Pre-season: "Season not started" state. During season: live updated from results.

### A.5 — Regulations Page
Hardcoded reference explaining 2026 rules with visual callouts:
- Power Units (50/50 split, boost button, fuel)
- Active Aero (Z-Mode/X-Mode replacing DRS)
- Car Design (smaller dimensions)
- New Teams (Cadillac, Audi)
- Engine Map visual (which manufacturer supplies which teams)
- Comparison tables: 2025 vs 2026

### A.6 — News Feed
- Card-based layout: headline, image placeholder, source, timestamp
- Categories: Race Weekend, Technical, Fantasy, Teams, Drivers
- Pull from RSS feeds when available, or show links to formula1.com, motorsport.com, the-race.com

---

## Section B: Live Analytics Dashboard (Design inspired by f1-dash.com)

### B.1 — Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + Vite + TypeScript |
| UI Styling | Tailwind CSS + custom CSS (F1 TV dark aesthetic) |
| Backend | Python FastAPI |
| ML/Data | FastF1, scikit-learn, XGBoost, pandas, numpy |
| Real-time | OpenF1 API (https://api.openf1.org/v1) — free, no auth |
| Database | SQLite (dev) → PostgreSQL (prod) |
| Auth | JWT token-based |
| Deployment | Docker + docker-compose on Unraid |
| WebSocket | FastAPI WebSocket + React hook |

### B.2 — OpenF1 API Client
Robust async client with endpoints: sessions, drivers, position, intervals, laps, car_data, stints, pit, weather, race_control, team_radio. Polling (5s default) + WebSocket relay to frontend.

### B.3 — FastF1 Historical Data
Load 2019–2025 sessions. Extract lap times, tire data, weather, positions, pit stops, safety car periods. Store in SQLite. Pipeline script for model retraining.

### B.4 — ML Prediction Engine
**Models** (XGBoost):
1. Position Change Predictor — gain/lose positions in next N laps
2. Pit Stop Window Predictor — optimal pit window, tire cliff, undercut/overcut
3. Overtake Opportunity Detector — probability when gap + tire delta align
4. Gap Breakdown Predictor — gap trajectory over next 5-10 laps

**Pre-Race Mode**: Predicted finishing order, key battles, strategy calls.
**Live Race Mode**: Update every lap. Alert on gap breakdowns, pit windows, overtakes, safety car impact.

### B.5 — Live Timing Board (Heart of the App — f1-dash.com style)

**Study f1-dash.com/dashboard and their GitHub repo (https://github.com/slowlydev/f1-dash) for design patterns:**
- Their clean dark UI with generous spacing and minimal borders
- Color-coded sector times: green (personal best), purple (overall fastest), yellow (standard)
- Tire compound indicators with lap count
- Their sidebar navigation pattern (Dashboard, Track Map, Standings, Weather)
- Their `compose.yaml` for Docker deployment reference

**Our timing board columns:**
- Position + up/down arrows for changes
- Driver abbreviation + team color badge + number
- Gap to leader / gap to car ahead (toggle)
- Last lap with sector color coding (green/purple/yellow)
- Sector times S1, S2, S3
- Tire compound icon + stint age
- Pit stop count
- **PitWall Exclusive**: Prediction indicator (spark-line showing position trajectory)
- **Overtake alert**: Cyan highlight when overtake probability is high

### B.6 — Strategy Panel
Pit window timeline per driver, undercut/overcut analysis, tire degradation curves with projected cliff, safety car probability, Monte Carlo race simulation.

### B.7 — Weather & Track Panel (Reference: f1-dash.com/dashboard/weather)
- Current conditions: air temp, track temp, humidity, wind direction, rain probability
- Forecast timeline
- Track map (SVG/canvas): approximate car positions via mini-sector data (same approach as f1-dash), Z-mode zones, marshal flags, sector boundaries

---

## Section C: Fantasy F1 Optimizer (Clone f1fantasytools.com)

Each sidebar item from f1fantasytools.com becomes a full page/tool.

### C.1 — Fantasy Rules Engine (Configurable)

```json
{
  "season": "2025",
  "budget_cap": 100.0,
  "team_size": {"drivers": 5, "constructors": 2},
  "scoring": {
    "race": {
      "P1": 25, "P2": 18, "P3": 15, "P4": 12, "P5": 10, "P6": 8, "P7": 6, "P8": 4, "P9": 2, "P10": 1,
      "positions_gained_per_position": 2, "positions_lost_per_position": -2,
      "overtake_bonus_per_overtake": 1, "not_classified": -10,
      "disqualified_constructor_only": -20, "driver_of_the_day": 10
    },
    "qualifying": { "Q1_beaten_teammate": 2, "Q2_reached": 2, "Q3_reached": 3, "pole_position": 10 },
    "sprint": {
      "P1": 8, "P2": 7, "P3": 6, "P4": 5, "P5": 4, "P6": 3, "P7": 2, "P8": 1,
      "positions_gained_per_position": 2, "positions_lost_per_position": -2, "overtake_bonus_per_overtake": 1
    },
    "constructor": {
      "fastest_pit_stop_of_race": 5, "pit_stop_under_2_00s": 20, "pit_stop_2_00_to_2_19s": 10,
      "pit_stop_2_20_to_2_49s": 5, "pit_stop_2_50_to_2_99s": 2, "pit_stop_world_record_bonus": 15,
      "both_cars_q3": 5, "qualifying_disqualification": -5, "race_disqualification": -20
    },
    "streak_bonuses": { "consecutive_points_3_races": 5, "consecutive_points_5_races": 10 },
    "chips": {
      "drs_boost": {"multiplier": 2.0, "usage": "Weekly — one driver each raceweek"},
      "extra_drs": {"multiplier": 3.0, "usage": "One-time — one driver 3x, plus regular DRS boost 2x on another"},
      "wildcard": {"usage": "Unlimited transfers for one raceweek"},
      "limitless": {"usage": "Unlimited budget for one raceweek"},
      "autopilot": {"usage": "AI picks your team for one raceweek"}
    },
    "transfers": { "per_raceweek": 2, "rollover_max": 1, "extra_transfer_penalty": -10 }
  }
}
```

**Key 2025 changes:** Pit stop scoring overhauled (tiered by time, up to 20pts). DSQ penalties on constructors only. Update config when 2026 rules published — engine works with any config.

### C.2 — Team Calculator (Flagship Tool)
**Monte Carlo Simulation**: N=10,000 simulations per race. Sample from ML distributions. Include DNF, team orders, safety car. Score per fantasy rules. Output: xPts (mean), floor (10th pct), ceiling (90th pct).

**Optimal Team Finder**: Knapsack optimization within $100M budget. Top 10 teams ranked. "Highlight Team Changes" visual diff vs current team. Manual xPts override. Scoring category breakdown. Card View + Table View toggle. Search bar.

**Race Importance Slider**: Weight historical races by track similarity. Presets: Power circuits, Street circuits, High downforce, Equal weight.

### C.3 — Budget Builder
Price change projections chart, "Buy Low" / "Sell High" alerts, budget trajectory, transfer efficiency analysis.

### C.4 — Live Scoring
Real-time fantasy points during sessions. Running total + category breakdown. Compare to theoretical optimal. "What if" mode.

### C.5 — Season Summary
Points per gameweek chart, cumulative season points, best/worst gameweeks, rank progression, season stats.

### C.6 — Elite Data
Top 500 global players' picks, ownership percentages, differential picks (low ownership + high xPts), consensus team, DRS Boost choices.

### C.7 — Statistics
Points per driver/team across races, scoring category breakdowns, "Value" metric (pts per million budget), circuit-specific historical scoring.

### C.8 — Team Analyzer
Select any 5 drivers + 2 constructors → projected points, risk assessment, budget analysis, comparison to optimal, improvement suggestions.

### C.9 — League Analyzer
Leaderboard, gameweek rankings, head-to-head, differential analysis, projected final standings.

### C.10 — Hindsight
Post-race optimal team calculation. Compare your team: "You left X points on the table." Season-long hindsight. Backtest optimizer accuracy.

### C.11 — DRS Boost Recommender & Chip Strategy
**Boost**: Recommend weekly 2x driver. Flag high-variance differentials.
**Chips**: Track remaining chips. Recommend deployment weekends. Visual timeline with chip markers.

---

## Design System (F1 TV Aesthetic)

### Color Palette
```css
:root {
  --bg-primary: #0F0F13;      /* Near-black */
  --bg-surface: #1A1A24;      /* Card backgrounds */
  --bg-elevated: #232333;     /* Hover/modals */
  --f1-red: #E10600;          /* Alerts, key CTAs */
  --timing-green: #00FF7F;    /* Personal best */
  --timing-purple: #A855F7;   /* Overall fastest */
  --timing-yellow: #FDE047;   /* Sector yellows */
  --gap-closing: #22D3EE;     /* Closing gaps */
  --text-primary: #F0F0F0;
  --text-secondary: #6B7280;
  --tire-soft: #FF0000; --tire-medium: #FFDD00; --tire-hard: #FFFFFF;
  --tire-intermediate: #40B040; --tire-wet: #3080FF;
}
```

### Typography
- Headers: `"Titillium Web"` bold (F1 official font) from Google Fonts
- Timing data: `"JetBrains Mono"` or `"IBM Plex Mono"` — monospace critical for pit wall feel
- Body: `"Titillium Web"` regular
- `font-feature-settings: "tnum"` for tabular numbers

### Visual Language (Study f1-dash.com for reference)
- Dark background with subtle scan-line/noise overlay
- Glowing borders on active elements (team color box-shadows)
- Smooth number transitions on timing data
- Team color left-border on every driver row
- Diagonal stripe pattern in nav bar (like F1.com header)
- Cards with subtle gradient borders matching team colors
- Micro-animations: pulse on position changes, smooth gap updates

---

## Project Structure
```
f1-pitwall/
├── docker-compose.yml
├── frontend/
│   ├── Dockerfile, package.json, vite.config.ts, tailwind.config.js
│   └── src/
│       ├── App.tsx, main.tsx
│       ├── data/
│       │   ├── teams2026.ts         ← HARDCODED team/driver data
│       │   ├── calendar2026.ts      ← HARDCODED race calendar
│       │   ├── regulations2026.ts   ← HARDCODED regulations
│       │   └── fantasyRules.ts      ← Fantasy scoring rules
│       ├── components/
│       │   ├── layout/ (TopNav, FantasySidebar, Layout, Footer)
│       │   ├── hub/ (ScheduleCalendar, RaceCard, TeamCard, DriverCard, StandingsTable, RegulationsPage, EngineMap, NewsFeed + Detail variants)
│       │   ├── timing/ (LiveTimingBoard, DriverRow, GapIndicator, SectorTimes)
│       │   ├── strategy/ (PitStopPredictor, TireStrategy, PositionPredictor, OvertakeOpportunity)
│       │   ├── conditions/ (WeatherPanel, TrackConditions, TrackMap)
│       │   ├── fantasy/ (TeamCalculator, BudgetBuilder, LiveScoring, SeasonSummary, EliteData, Statistics, TeamAnalyzer, LeagueAnalyzer, Hindsight, ChipStrategy, DRSBoostRecommender, RaceImportanceSlider, DriverCard, ConstructorCard, OptimalTeamDisplay, ScoringBreakdown)
│       │   └── common/ (TeamColorBadge, CountryFlag, DeltaDisplay, TireIcon, LoadingTelemetry)
│       ├── hooks/ (useWebSocket, useLiveTiming, useRacePredictions, useFantasy)
│       ├── pages/ (Home, Schedule, Teams, TeamDetail, Drivers, DriverDetail, Standings, Regulations, Results, News, LiveDashboard, Strategy, Fantasy, Login)
│       ├── styles/f1-theme.css
│       ├── types/f1.ts
│       └── utils/ (teamColors, formatters)
├── backend/
│   ├── Dockerfile, requirements.txt
│   └── app/
│       ├── main.py, config.py, auth.py
│       ├── routers/ (timing, predictions, weather, fantasy, season, websocket)
│       ├── services/ (openf1_client, fastf1_service, prediction_engine, fantasy_engine)
│       ├── ml/ (models/, features/, training/, saved_models/)
│       ├── fantasy/ (rules_config.json, optimizer.py, scoring.py)
│       ├── models/database.py
│       └── data/season_2026.json
└── nginx/ (Dockerfile, nginx.conf)
```

---

## Implementation Order

### Phase 1: Foundation + F1 Info Hub (GET THIS RIGHT FIRST)
1. Scaffold — docker-compose, FastAPI + React running
2. **Hardcode 2026 data** — `teams2026.ts`, `calendar2026.ts`, `regulations2026.ts` with ALL data above
3. Top navigation (F1.com-style)
4. Schedule page — calendar with countdown
5. Teams page — 11 team cards + detail pages
6. Drivers page — 22 driver cards + detail pages
7. Standings page — WDC + WCC tables
8. Regulations page — 2026 rules reference
9. Home/Landing — hero with next race countdown

### Phase 2: Live Dashboard (f1-dash.com style)
10. OpenF1 client + WebSocket relay
11. Live timing board with team colors
12. Weather panel
13. Track map (SVG, mini-sector positions)

### Phase 3: ML Pipeline
14. FastF1 data loading → 15. Feature engineering → 16. Model training → 17. Predictions UI

### Phase 4: Strategy
18. Pit stop predictor → 19. Tire degradation → 20. Overtake radar

### Phase 5: Fantasy Toolkit
21. Rules engine → 22. Fantasy sidebar → 23. Team Calculator → 24. Budget Builder
25. Hindsight → 26. Live Scoring → 27. Statistics → 28. Team Analyzer
29. Season Summary → 30. Elite Data → 31. League Analyzer → 32. Chip Strategy

### Phase 6: Infrastructure
33. JWT Auth → 34. Docker → 35. Polish (animations, responsive, error handling)

---

## Docker & Deployment

```yaml
services:
  frontend:
    build: ./frontend
  backend:
    build: ./backend
    volumes:
      - ./backend/data:/app/data
      - ./backend/app/ml/saved_models:/app/ml/saved_models
    environment:
      - ADMIN_USERNAME=${ADMIN_USERNAME}
      - ADMIN_PASSWORD=${ADMIN_PASSWORD}
      - JWT_SECRET=${JWT_SECRET}
      - DATABASE_URL=sqlite:///data/pitwall.db
  nginx:
    build: ./nginx
    ports: ["8780:80"]
    depends_on: [frontend, backend]
```

Nginx routes: `/` → frontend, `/api/*` → backend, `/ws/*` → WebSocket

**Unraid**: Port 8780, volumes for DB/models/FastF1 cache, works behind Tailscale.

---

## Reference Sites to Study

### formula1.com (F1 Info Hub Reference)
- Navigation structure, schedule page, team/driver profiles, standings
- Dark nav bar with diagonal stripe background and F1 red accents
- Team/driver card grid layouts

### f1fantasytools.com (Fantasy Optimizer Reference)
- Team Calculator, Budget Builder, Live Scoring, Season Summary, Elite Data, Statistics, Team Analyzer, League Analyzer, Hindsight
- Sidebar navigation (icons + labels, collapsible)
- Card View + Table View toggle
- Monte Carlo simulation (~10,000 runs)
- Race Importance Slider for track similarity weighting
- Scoring Category Breakdown per driver

### f1-dash.com + GitHub (Live Timing & Design Reference)
- **Live site**: https://f1-dash.com/dashboard
- **Source code**: https://github.com/slowlydev/f1-dash (1.6k stars, AGPL-3.0)
- **Tech**: Next.js frontend + Rust backend (TypeScript 75% / Rust 24%)
- **Study their repo for**:
  - Dashboard layout: leaderboard with gaps, tires, laps, mini-sectors
  - Track map: SVG circuit rendering with mini-sector car positions
  - Weather panel: clean data presentation
  - Standings view
  - `compose.yaml` for Docker patterns
  - Sidebar nav: Dashboard, Track Map, Standings, Weather
- **Design language**: Clean dark theme, minimal borders, generous spacing, color-coded sectors (green/purple/yellow), tire colors, smooth updates
- **We go further**: ML predictions, fantasy integration, strategy panels, unified experience

---

## Key API References
- **OpenF1 API**: https://openf1.org — Free, no auth. Docs: https://openf1.org/#api-methods
- **FastF1 Python**: `pip install fastf1` — Docs: https://docs.fastf1.dev/
- **f1-dash Source**: https://github.com/slowlydev/f1-dash — Reference for timing board + track map design

## Non-Functional Requirements
- **Performance**: Sub-100ms UI updates during live sessions
- **Resilience**: Graceful API downtime handling — "no live data" state
- **Caching**: Aggressive FastF1 caching — historical data doesn't change
- **Mobile**: Desktop-first but functional on tablet/phone
- **Error handling**: Never crash on bad API data
- **First impression**: App MUST look complete and professional on first load with hardcoded 2026 data

---

## Official FIA 2026 Regulation Documents

Source: https://www.fia.com/regulation/category/110

All current 2026 regulations published December 10, 2025:

| Section | Document | PDF |
|---------|----------|-----|
| **A** — General Regulatory Provisions | Issue 01 | [Download](https://www.fia.com/system/files/documents/fia_2026_f1_regulations_-_section_a_general_regulatory_provisions_-_iss_01_-_2025-12-10_0.pdf) |
| **B** — Sporting Regulations | Issue 04 | [Download](https://www.fia.com/system/files/documents/fia_2026_f1_regulations_-_section_b_sporting_-_iss_04_-_2025-12-10_0.pdf) |
| **C** — Technical Regulations | Issue 15 | [Download](https://www.fia.com/system/files/documents/fia_2026_f1_regulations_-_section_c_technical_-_iss_15_-_2025-12-10_0.pdf) |
| **D** — Financial Regulations (F1 Teams) | Issue 04 | [Download](https://www.fia.com/system/files/documents/fia_2026_f1_regulations_-_section_d_financial_regulations_-_f1_teams_iss_04_-_2025-12-10_0.pdf) |
| **E** — Financial Regulations (PU Manufacturers) | Issue 03 | [Download](https://www.fia.com/system/files/documents/fia_2026_f1_regulations_-_section_e_financial_regulations_-_power_unit_manufacturers_-_iss_03_-_2025-12-10_0.pdf) |
| **F** — Operational Regulations | Issue 05 | [Download](https://www.fia.com/system/files/documents/fia_2026_f1_regulations_-_section_f_operational_-_iss_05_-_2025-12-10_1.pdf) |

The Regulations page in the app (Section A.5) should link to these official PDFs and summarize the key changes in a user-friendly format. The regulations2026.ts data file contains the summarized version for display.
