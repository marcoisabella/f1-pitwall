# Fantasy F1 Redesign — Live Data + Manual Team Saving + Full UI Overhaul

**Date:** 2026-03-02
**Status:** Approved

## Goals

1. Pull real driver/constructor data (prices, points, selection %) from F1 Fantasy public API
2. Build a dedicated "Enter Team" page for manual team saving (5 drivers + 2 constructors)
3. Redesign all ~13 fantasy pages to match f1fantasytools.com visual language

## Data Layer

### F1 Fantasy API Integration (Public Feeds — No Auth)

| Feed | URL | Data |
|------|-----|------|
| Players | `/feeds/drivers/{gamedayId}_en.json` | All 33 players: prices, selection %, gameday/overall/projected points |
| Constraints | `/feeds/limits/constraints.json` | Current gamedayId, phaseId, deadline, max team value |
| Driver Stats | `/feeds/statistics/drivers_4.json` | Round-by-round historical data |
| Constructor Stats | `/feeds/statistics/constructors_4.json` | Round-by-round historical data |

**Backend changes:**
- Enhance `/api/fantasy/f1-players` endpoint to fetch + cache real player data (15-min TTL in SeasonCache)
- Add `/api/fantasy/f1-stats` endpoint for round-by-round historical stats
- All existing endpoints (simulate, optimize, etc.) use real API prices as input, fall back to hardcoded `scoring.py` if API unavailable
- Required header: `entity: Wh@t$|_||>`

### Manual Team Saving

Backend CRUD already exists:
- `POST /api/fantasy/team` — save team (up to 3 slots)
- `GET /api/fantasy/teams` — get all saved teams
- `GET /api/fantasy/team?team_number=N` — get specific team
- `PUT /api/fantasy/settings` — set active team slot

No backend changes needed. Frontend Enter Team page calls these endpoints.

## Shared UI Components

Built as reusable components under `frontend/src/components/fantasy/`:

### DriverPill
- 3-letter TLA in team-colored rounded rect
- Optional: points below, price below, chip indicator (x2/x3) above
- States: default, selected (green border), disabled (opacity)

### DataTable
- Compact sortable table with column headers + sort arrows
- Color-coded cells (green positive, red negative, neutral gray)
- Search/filter bar: "Find a driver... (e.g. VER+NOR)"
- Include/Exclude checkboxes per row
- "Columns" button to toggle visible columns
- Tier A/B section headers

### TeamSlotTabs
- T1 / T2 / T3 toggle group, used across pages

### ChipButtons
- X3, LL, WC, NN, AP, FF pill-style toggle buttons

### PageHeader
- Bold oversized title (matching f1fantasytools.com massive headings)
- Subtitle description text in muted color

### HeatmapCell
- Numeric value with background gradient: red (negative) → yellow (neutral) → green (high positive)

### TeamCard
- Horizontal row: constructors (2 pills) + drivers (5 pills) with points
- Chip indicator badge, total price change (delta), total points
- Used in Live Scoring "My Teams" section and Team Analyzer timeline

## Page Designs

### 1. Enter Team (NEW)
- **Route:** `/fantasy/enter-team`
- **Layout:** Two halves — Drivers grid (left) + Constructors grid (right)
- **Flow:** Browse all drivers/constructors with real API prices → tap to select → budget tracker updates → save to T1/T2/T3
- **Components:** DriverPill grid, ConstructorPill grid, BudgetTracker bar, TeamSlotTabs, Save button
- **Data:** Fetches from `/api/fantasy/f1-players`

### 2. Team Calculator (REDESIGN)
- **Layout:** 3-column (matching screenshot 1)
  - Left: "Best Teams" numbered list with DriverPills + budget + xPts
  - Center: Settings panel (starting team, max budget, chip selection, simulation preset)
  - Right: Drivers table + Constructors table with search, sort, include/exclude
- **Columns:** DR, $, xDelta$, xPts, Incl/Excl checkboxes
- **Data:** `/api/fantasy/simulate` + `/api/fantasy/f1-players`

### 3. Budget Builder (REDESIGN)
- **Layout:** 2-column split — Drivers (left) + Constructors (right)
- **Each side:** Tier A + Tier B sections
- **Columns:** DR/$, R-1 Pts, R0 Pts, R1 xPts, price change odds (-0.3/-0.1/+0.1/+0.3 for drivers, -0.6/-0.2/+0.2/+0.6 for constructors), xDelta$
- **Color coding:** Red headers for drops, green headers for rises, cell backgrounds by probability
- **Data:** `/api/fantasy/f1-players` + `/api/fantasy/price-predictions`

### 4. Live Scoring (REDESIGN)
- **Layout:** 2-column
  - Left: Drivers table (DR, TOT, Delta$, Q POS, Race POS/PG/OV/FL/DD) + Constructors table
  - Right: My Teams cards (T1/T2/T3) with round info header (R24 Q R → R1 countdown)
- **Components:** DataTable, TeamCard, round navigation bar
- **Data:** `/api/fantasy/f1-players` + `useLiveFantasyScoring` hook

### 5. Statistics (REDESIGN)
- **Layout:** Full-width heatmap
- **Controls:** Season dropdown, metric selector (Fantasy Points / specific type), T1/T2/T3 tabs, Fantasy Points Types filter
- **Table:** DR column + R1-R24 columns (with country flags), AVG column
- **Color coding:** HeatmapCell for each value — red (negative) through yellow to green (high)
- **Data:** `/api/fantasy/f1-stats` (round-by-round historical from F1 Fantasy API)

### 6. Season Summary (REDESIGN)
- **Layout:** Full-width scrollable sections
- **Sections:** Rank Progression (line chart), Transfer Impact (donut + bar), Point Distributions (bar charts), Positive Events, Negative Events
- **Data:** `/api/fantasy/historical/{season}`

### 7. Elite Data (REDESIGN)
- **Layout:** 3-column
  - Left: Settings (highlight team T1/T2/T3, dataset toggles)
  - Center: Driver Picks (DR, P%, change, x2%, change) — color-coded percentages
  - Right: Chip Usage heatmap (round × chip type matrix)
- **Data:** `/api/fantasy/f1-players` (selection %, captain selection %)

### 8. Team Analyzer (REDESIGN)
- **Layout:** 3-column (T1 | T2 | T3)
- **Each column:** Team name header, round-by-round rows showing: round label + GP name + flag, chip used, round points + cumulative, team composition as DriverPills with points
- **Data:** `/api/fantasy/teams` + `/api/fantasy/scores`

### 9. Hindsight (REDESIGN)
- **Layout:** 3-column (matching screenshot 9)
  - Left: Best team combos list with DriverPills
  - Center: Settings (season/round selector, team to analyze, max budget, chip selection)
  - Right: Drivers + Constructors tables with include/exclude
- **Data:** `/api/fantasy/best-team/{round}` + `/api/fantasy/f1-players`

### 10-13. Chip Strategy, DRS Boost, Settings, Import Team
- Keep existing functionality, restyle to match new design system (dark theme, DataTable, PageHeader, etc.)

## Sidebar

Matches f1fantasytools.com pattern:
- Collapsible: icons only (collapsed) → icons + text labels (expanded)
- Pages: Team Calculator, Budget Builder, Live Scoring, Season Summary, Elite Data, Statistics, Team Analyzer, League Analyzer, Hindsight, "More..." (Chip Strategy, DRS Boost, Import, Settings, Enter Team)
- Active page: highlighted background + accent border
- User profile at bottom with dark theme toggle
