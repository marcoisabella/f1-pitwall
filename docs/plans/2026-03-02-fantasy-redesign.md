# Fantasy F1 Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Pull real F1 Fantasy API data (prices, points, selection %), build a manual team entry page, and redesign all ~13 fantasy pages to match f1fantasytools.com's visual language.

**Architecture:** Backend enhances the F1 Fantasy public API integration to serve real player data (cached 15-min TTL). Frontend gets a new shared component library (DriverPill, DataTable, HeatmapCell, etc.) that all pages consume. Each page is rewritten to match the 3-column / 2-column / heatmap layouts from f1fantasytools.com.

**Tech Stack:** FastAPI + httpx (backend), React + TypeScript + Tailwind v4 (frontend), F1 Fantasy public feeds (data source)

**Verification:** `npx tsc -b --noEmit` for type safety after each task. No test infrastructure exists — skip TDD, use type-checking + visual verification.

---

## Phase 1: Backend — Real API Data

### Task 1: Enhance F1 Fantasy API Data Service

**Files:**
- Modify: `backend/app/services/f1_fantasy_import.py` (enhance `get_players`, add `get_statistics`)
- Modify: `backend/app/routers/fantasy.py` (enhance `/f1-players`, add `/f1-stats`)
- Modify: `backend/app/services/fantasy_engine.py` (use real prices in `get_available_drivers` and `get_available_constructors`)
- Modify: `backend/app/fantasy/scoring.py` (make prices a fallback, add `get_live_prices()`)

**Step 1: Enhance `get_players()` in f1_fantasy_import.py**

Add a `get_constraints()` method to fetch current gamedayId, and enhance `get_players()` to auto-fetch gamedayId if not provided. Add `get_driver_statistics()` and `get_constructor_statistics()` methods that hit the statistics feeds.

```python
# In F1FantasyImporter class:

async def get_constraints(self) -> dict | None:
    """Fetch current game constraints (gamedayId, phaseId, deadline, max team value)."""
    url = f"{self.BASE_URL}/feeds/limits/constraints.json"
    data = await self._get(url)
    if data and data.get("Data", {}).get("Value"):
        val = data["Data"]["Value"]
        return {
            "gameday_id": val.get("GamedayId", 1),
            "phase_id": val.get("PhaseId", 1),
            "max_team_value": val.get("MaxTeamValue", 100),
            "deadline": val.get("DeadlineDate"),
        }
    return None

async def get_driver_statistics(self) -> list[dict] | None:
    """Fetch round-by-round driver statistics."""
    url = f"{self.BASE_URL}/feeds/statistics/drivers_{self.TOUR_ID}.json"
    data = await self._get(url)
    if data and data.get("Data", {}).get("Value"):
        return data["Data"]["Value"]
    return None

async def get_constructor_statistics(self) -> list[dict] | None:
    """Fetch round-by-round constructor statistics."""
    url = f"{self.BASE_URL}/feeds/statistics/constructors_{self.TOUR_ID}.json"
    data = await self._get(url)
    if data and data.get("Data", {}).get("Value"):
        return data["Data"]["Value"]
    return None
```

**Step 2: Enhance `/f1-players` endpoint in fantasy.py**

Make it return richer data: price, price change (old vs new), selection %, captain %, gameday points, overall points, projected points. Split into drivers and constructors.

```python
@router.get("/f1-players")
async def f1_players():
    from app.services.f1_fantasy_import import f1_fantasy_importer

    players = await f1_fantasy_importer.get_players()
    if not players:
        raise HTTPException(502, "Could not fetch F1 Fantasy player data.")

    drivers = []
    constructors = []
    for p in players:
        info = f1_fantasy_importer._map_player(p)
        if not info:
            continue
        entry = {
            **info,
            "price": p.get("Value", 0),
            "old_price": p.get("OldPlayerValue", 0),
            "price_change": round(p.get("Value", 0) - p.get("OldPlayerValue", 0), 1),
            "selected_pct": p.get("SelectedPercentage", 0),
            "captain_pct": p.get("CaptainSelectedPercentage", 0),
            "gameday_points": p.get("GamedayPoints", 0),
            "overall_points": p.get("OverallPoints", 0),
            "projected_points": p.get("ProjectedGamedayPoints", 0),
            "status": p.get("Status"),
            "is_active": p.get("IsActive", True),
        }
        if info.get("type") == "constructor":
            constructors.append(entry)
        else:
            drivers.append(entry)

    return {"drivers": drivers, "constructors": constructors}
```

**Step 3: Add `/f1-stats` endpoint**

```python
@router.get("/f1-stats")
async def f1_stats():
    from app.services.f1_fantasy_import import f1_fantasy_importer
    driver_stats = await f1_fantasy_importer.get_driver_statistics()
    constructor_stats = await f1_fantasy_importer.get_constructor_statistics()
    return {
        "drivers": driver_stats or [],
        "constructors": constructor_stats or [],
    }
```

**Step 4: Wire real prices into fantasy_engine.py**

In `get_available_drivers()` and `get_available_constructors()`, try fetching from F1 Fantasy API first, fall back to hardcoded prices.

**Step 5: Verify**

Run: `cd backend && python3 -c "from app.routers.fantasy import router; print('OK')"`

**Step 6: Commit**

```bash
git add backend/app/services/f1_fantasy_import.py backend/app/routers/fantasy.py backend/app/services/fantasy_engine.py backend/app/fantasy/scoring.py
git commit -m "feat: integrate real F1 Fantasy API data for prices, points, and stats"
```

---

## Phase 2: Shared UI Component Library

### Task 2: Create DriverPill and ConstructorPill Components

**Files:**
- Create: `frontend/src/components/fantasy/DriverPill.tsx`
- Create: `frontend/src/components/fantasy/ConstructorPill.tsx`

**Step 1: Build DriverPill**

The core visual element from f1fantasytools.com — a compact colored badge showing driver TLA.

```tsx
// DriverPill.tsx
// Props: tla (string), teamColor (string), points? (number), price? (number),
//        priceChange? (number), chipMultiplier? ('x2'|'x3'), selected? (boolean),
//        onClick? (), size? ('sm'|'md'|'lg')
// Renders: rounded-md box with team-colored background, white TLA text
// Below pill (if provided): points in white, price change in green/red
// If chipMultiplier: small badge above pill ('x2' or 'x3')
```

Key visual details from screenshots:
- Background is team color at ~80% opacity
- Text is white, bold, uppercase
- Size 'sm' ~32x24px (in team rows), 'md' ~48x32px (in tables), 'lg' for standalone
- Price shown in yellow below, price change in green/red
- Points shown below in smaller text

**Step 2: Build ConstructorPill**

Same pattern but uses constructor abbreviation (3 letters: MER, MCL, FER, RED, etc.) with team-colored border instead of background fill.

**Step 3: Verify**

Run: `cd frontend && npx tsc -b --noEmit`

**Step 4: Commit**

```bash
git add frontend/src/components/fantasy/DriverPill.tsx frontend/src/components/fantasy/ConstructorPill.tsx
git commit -m "feat: add DriverPill and ConstructorPill shared components"
```

### Task 3: Create DataTable Component

**Files:**
- Create: `frontend/src/components/fantasy/DataTable.tsx`

**Step 1: Build DataTable**

A reusable sortable table with these features (from screenshots):
- Generic `<T>` typed for any row data
- Column definitions: key, label, width, sortable, render function, color-code function
- Search bar at top: "Find a driver... (e.g. VER+NOR)" — filters by TLA or name
- Sort by clicking column headers (arrow indicator)
- Include/Exclude checkboxes per row (optional)
- "Columns" button to toggle visible columns (optional)
- Compact rows with minimal padding (py-1 px-2)
- Color-coded cells: positive values green, negative red, neutral gray

```tsx
interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string;
  render?: (row: T) => React.ReactNode;
  colorCode?: (value: number) => string; // returns tailwind color class
  align?: 'left' | 'center' | 'right';
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  searchPlaceholder?: string;
  searchKeys?: string[]; // which fields to search
  showIncludeExclude?: boolean;
  onIncludeChange?: (included: Set<string>, excluded: Set<string>) => void;
  showColumnsToggle?: boolean;
  rowKey: (row: T) => string;
  tierSplit?: { key: string; threshold: number; tierALabel: string; tierBLabel: string };
  onRowClick?: (row: T) => void;
  compact?: boolean;
}
```

**Step 2: Verify**

Run: `cd frontend && npx tsc -b --noEmit`

**Step 3: Commit**

```bash
git add frontend/src/components/fantasy/DataTable.tsx
git commit -m "feat: add generic DataTable component with sort, search, and color coding"
```

### Task 4: Create Remaining Shared Components

**Files:**
- Create: `frontend/src/components/fantasy/PageHeader.tsx`
- Create: `frontend/src/components/fantasy/TeamSlotTabs.tsx`
- Create: `frontend/src/components/fantasy/ChipButtons.tsx`
- Create: `frontend/src/components/fantasy/HeatmapCell.tsx`
- Create: `frontend/src/components/fantasy/TeamCard.tsx`
- Create: `frontend/src/components/fantasy/SearchBar.tsx`

**Step 1: PageHeader** — Bold oversized title + subtitle

```tsx
// Big white bold title (text-5xl md:text-7xl font-bold tracking-tight)
// Subtitle in muted gray below (text-sm text-f1-text-muted max-w-2xl mx-auto text-center)
```

**Step 2: TeamSlotTabs** — T1/T2/T3 toggle

```tsx
// Row of 3 buttons: T1, T2, T3
// Active: bg-f1-elevated text-white border border-f1-border
// Inactive: bg-transparent text-f1-text-muted hover:text-white
// Props: activeSlot (1|2|3), onChange (slot) => void
```

**Step 3: ChipButtons** — X3, LL, WC, NN, AP, FF toggles

```tsx
// Row of chip abbreviation buttons
// Active: bg-f1-elevated text-white
// Inactive: bg-transparent text-f1-text-muted border border-f1-border
// Props: chips (string[]), activeChip (string|null), onSelect (chip) => void
```

**Step 4: HeatmapCell** — Color-gradient value cell

```tsx
// Takes a numeric value and a range [min, max]
// Renders cell with background interpolated from red (min) → yellow (mid) → green (max)
// Text is white, tabular-nums font
// Props: value (number), min (number), max (number), format? (v => string)
```

**Step 5: TeamCard** — Compact team row with pills

```tsx
// Horizontal: 2 ConstructorPills + 5 DriverPills, each with points below
// Right side: chip badge, total price change, total points
// Props: team (SavedTeam with points data), chipLabel?, totalDelta, totalPoints
```

**Step 6: SearchBar** — Reusable search input

```tsx
// Dark input with placeholder "Find a driver... (e.g. VER+NOR)"
// Left icon (magnifying glass), clear button on right when has value
// Props: placeholder, value, onChange, className
```

**Step 7: Verify**

Run: `cd frontend && npx tsc -b --noEmit`

**Step 8: Commit**

```bash
git add frontend/src/components/fantasy/PageHeader.tsx frontend/src/components/fantasy/TeamSlotTabs.tsx frontend/src/components/fantasy/ChipButtons.tsx frontend/src/components/fantasy/HeatmapCell.tsx frontend/src/components/fantasy/TeamCard.tsx frontend/src/components/fantasy/SearchBar.tsx
git commit -m "feat: add shared fantasy UI components (PageHeader, TeamSlotTabs, ChipButtons, HeatmapCell, TeamCard, SearchBar)"
```

### Task 5: Redesign FantasySidebar

**Files:**
- Modify: `frontend/src/components/fantasy/FantasySidebar.tsx`

**Step 1: Redesign to match f1fantasytools.com sidebar**

From the screenshots, the sidebar has:
- Logo/brand at top (F1 Fantasy Tools or our "F1 PITWALL")
- Icon-only when collapsed, icon + text label when expanded
- Proper icons (not single letters) — use SVG or unicode symbols that match:
  - Team Calculator → grid/table icon
  - Budget Builder → dollar icon
  - Live Scoring → broadcast/signal icon
  - Season Summary → chart/line icon
  - Elite Data → document icon
  - Statistics → bar chart icon
  - Team Analyzer → magnifying glass icon
  - League Analyzer → people/group icon
  - Hindsight → rewind/backward icon
  - "More..." expandable section for: Chip Strategy, DRS Boost, Import, Enter Team, Settings
- Active page: highlighted bg + left border accent
- User profile avatar at bottom
- Dark theme toggle at bottom

Add the "Enter Team" route to sidebar.

**Step 2: Verify**

Run: `cd frontend && npx tsc -b --noEmit`

**Step 3: Commit**

```bash
git add frontend/src/components/fantasy/FantasySidebar.tsx
git commit -m "feat: redesign fantasy sidebar to match f1fantasytools.com"
```

---

## Phase 3: Core Pages

### Task 6: Build Enter Team Page

**Files:**
- Rewrite: `frontend/src/pages/fantasy/EnterTeam.tsx`
- Modify: `frontend/src/App.tsx` (add route at line ~67)
- Modify: `frontend/src/hooks/useFantasy.ts` (add `useF1Players` hook or integrate API data)

**Step 1: Add route in App.tsx**

Add `<Route path="enter-team" element={<EnterTeam />} />` inside the fantasy routes block.

**Step 2: Create a `useF1Players` hook or extend `useFantasy`**

Fetch from `/api/fantasy/f1-players` to get real driver/constructor data. Return typed arrays:

```tsx
interface F1Player {
  driver_number?: number;
  constructor_id?: string;
  name: string;
  tla: string;
  team_name: string;
  team_color: string;
  price: number;
  price_change: number;
  selected_pct: number;
  captain_pct: number;
  gameday_points: number;
  overall_points: number;
  projected_points: number;
  type: 'driver' | 'constructor';
}
```

**Step 3: Build EnterTeam page**

Layout:
- Top: PageHeader "Enter Team" + subtitle
- TeamSlotTabs to select which slot (T1/T2/T3) to save to
- Two-column grid:
  - Left: Drivers section — SearchBar + scrollable list of driver rows. Each row: DriverPill + price (yellow) + projected points (cyan). Click to select (max 5, max 2 from same constructor). Selected drivers get green highlight.
  - Right: Constructors section — same pattern (max 2)
- Bottom sticky bar: BudgetTracker showing $spent/$100M + remaining + "SAVE TEAM" button (disabled if team incomplete or over budget)

Validation rules (from `scoring.py`):
- Exactly 5 drivers + 2 constructors
- Total price <= $100M
- Max 2 drivers from same constructor

**Step 4: Verify**

Run: `cd frontend && npx tsc -b --noEmit`

**Step 5: Commit**

```bash
git add frontend/src/pages/fantasy/EnterTeam.tsx frontend/src/App.tsx frontend/src/hooks/useFantasy.ts
git commit -m "feat: add Enter Team page with manual team building and real API prices"
```

### Task 7: Redesign Team Calculator

**Files:**
- Rewrite: `frontend/src/pages/fantasy/TeamCalculator.tsx`

**Step 1: Redesign to 3-column layout**

Match screenshot 1:
- **Left column (flex-1):** "Best Teams" header with Filters + Columns buttons. Numbered list (1-10+) of optimized teams. Each row: # rank, ConstructorPills (2), DriverPills (5) with price + price change below each, then total budget, xDelta$, xPts at right.
- **Center column (~300px):** Settings panel:
  - "Select a starting team" dropdown (or "No team selected")
  - "Maximum budget" input (default $100M)
  - "Select a chip" — ChipButtons (X3, LL, WC, NN)
  - "Convert expected price changes" toggle
  - "Full Reset" button + settings gear
  - "Simulation" section with preset dropdown
- **Right column (~350px):**
  - "Drivers" section: SearchBar + Columns button + DataTable with columns DR, $, xDelta$, xPts, Incl/Excl checkboxes
  - "Constructors" section: same pattern with CR column

**Step 2: Verify**

Run: `cd frontend && npx tsc -b --noEmit`

**Step 3: Commit**

```bash
git add frontend/src/pages/fantasy/TeamCalculator.tsx
git commit -m "feat: redesign Team Calculator with 3-column layout matching f1fantasytools.com"
```

### Task 8: Redesign Live Scoring

**Files:**
- Rewrite: `frontend/src/pages/fantasy/LiveScoring.tsx`

**Step 1: Redesign to 2-column layout**

Match screenshot 4:
- **Top bar:** Round navigation — previous round, current round indicators (R24 Q R chevrons), next round (R1 with flag + "Qualifying" + countdown "In 4d 10h")
- **Left column:**
  - "Drivers" header + SearchBar + settings gear
  - DataTable columns: DR (DriverPill), TOT (total points), Delta$ (price change), then grouped Q (POS) and Race (POS, PG position gained, OV overtakes, FL fastest lap, DD driver of the day)
  - Color-coded cells
  - "Constructors" header + SearchBar + settings gear
  - DataTable columns: CR (ConstructorPill), TOT, Delta$, then Q (POS, TW teamwork) and Race (POS, PG, OV, FL, FP finish position)
- **Right column:**
  - "Teams" header + Columns button + settings gear
  - Header row: #, CR, (x3), x2, DR, Delta$, PTS
  - "My Teams" section label
  - Team rows for T1/T2/T3: each showing chip indicator (X3), ConstructorPills with price+priceChange, DriverPills with points+priceChange, total Delta$, total PTS, "..." menu

**Step 2: Wire up `useLiveFantasyScoring` hook**

The existing hook already computes live scores. Integrate it with the new layout.

**Step 3: Verify**

Run: `cd frontend && npx tsc -b --noEmit`

**Step 4: Commit**

```bash
git add frontend/src/pages/fantasy/LiveScoring.tsx
git commit -m "feat: redesign Live Scoring with driver/constructor tables and team cards"
```

### Task 9: Redesign Budget Builder

**Files:**
- Rewrite: `frontend/src/pages/fantasy/BudgetBuilder.tsx`

**Step 1: Redesign to match screenshot 2-3**

Layout:
- PageHeader: "Budget Builder" + description about price change odds
- Controls bar: Simulation preset dropdown + T1/T2/T3 tabs + settings gear
- SearchBar row: "Find a driver..." (left half) + "Find a constructor..." (right half)
- Two-column split:
  - **Left: Drivers**
    - Tier A (>=18.5M) header row
    - Column headers: DR, $, R-1 Pts, R0 Pts, R1 xPts, then price change odds columns (-0.3 red, -0.1 red, +0.1 green, +0.3 green), xDelta$
    - Driver rows sorted by tier, each with DriverPill + data
    - Tier B (<18.5M) section below with same columns but different thresholds (-0.6, -0.2, +0.2, +0.6)
  - **Right: Constructors**
    - Same Tier A/B split with constructor-specific price thresholds

Color coding for odds columns: darker background for higher probability, red tint for negative changes, green tint for positive.

**Step 2: Verify**

Run: `cd frontend && npx tsc -b --noEmit`

**Step 3: Commit**

```bash
git add frontend/src/pages/fantasy/BudgetBuilder.tsx
git commit -m "feat: redesign Budget Builder with tier-split price change odds tables"
```

---

## Phase 4: Analytics Pages

### Task 10: Redesign Statistics Page

**Files:**
- Rewrite: `frontend/src/pages/fantasy/Statistics.tsx`

**Step 1: Build round-by-round heatmap**

Match screenshot 7:
- PageHeader: "Statistics" + description
- Controls: Season dropdown (2025/2026), metric selector (Fantasy Points / specific type), T1/T2/T3 tabs, settings gear
- "Fantasy Points Types" filter bar with count (20/20)
- SearchBar: "Find a driver..."
- Full-width heatmap table:
  - First column: DR (DriverPill) — sticky left
  - R1-R24 columns with country flag emoji in header
  - Each cell: HeatmapCell with fantasy points value
  - Last column: AVG
  - Rows sorted by average descending

**Step 2: Verify**

Run: `cd frontend && npx tsc -b --noEmit`

**Step 3: Commit**

```bash
git add frontend/src/pages/fantasy/Statistics.tsx
git commit -m "feat: redesign Statistics with round-by-round heatmap table"
```

### Task 11: Redesign Elite Data

**Files:**
- Rewrite: `frontend/src/pages/fantasy/EliteData.tsx`

**Step 1: Build 3-column layout**

Match screenshot 6:
- **Left column:** Settings panel
  - "Highlight your team" — T1/T2/T3 tabs
  - "Select datasets" — checkbox options (Global 500, Subscriber 500)
  - "Visual settings" — expandable section
- **Center column:** "Driver Picks"
  - SearchBar + info icon
  - DataTable: DR (DriverPill), P% (selection percentage with color-coded green bg), change (+/-), x2% (captain selection), change
  - Sorted by P% descending
- **Right column:** "Chip Usage"
  - SearchBar: "Find a race... (e.g. 2+R3+BEL+Vegas)"
  - Heatmap table: Race column (round # + flag), then columns for each chip type (LL, X3, NN, AP, FF, WC)
  - Each cell shows usage percentage with color gradient
  - "Total" row at bottom

**Step 2: Verify**

Run: `cd frontend && npx tsc -b --noEmit`

**Step 3: Commit**

```bash
git add frontend/src/pages/fantasy/EliteData.tsx
git commit -m "feat: redesign Elite Data with driver picks and chip usage heatmap"
```

### Task 12: Redesign Team Analyzer

**Files:**
- Rewrite: `frontend/src/pages/fantasy/TeamAnalyzer.tsx`

**Step 1: Build 3-column team timeline**

Match screenshot 8:
- PageHeader: "Team Analyzer" + description
- Controls: Season dropdown, settings buttons
- Three columns: T1, T2, T3 — each with team name header + expand/collapse icon
- Each column: reverse chronological list of rounds:
  - Round header: "R24" label, GP name + country flag, chip badge (X3/LL/NN/etc), round points, cumulative points, expand chevron
  - Expanded: team composition as DriverPills + ConstructorPills with points below each
  - Price change and cumulative shown at round level

**Step 2: Verify**

Run: `cd frontend && npx tsc -b --noEmit`

**Step 3: Commit**

```bash
git add frontend/src/pages/fantasy/TeamAnalyzer.tsx
git commit -m "feat: redesign Team Analyzer with 3-column round-by-round timeline"
```

### Task 13: Redesign Season Summary

**Files:**
- Rewrite: `frontend/src/pages/fantasy/SeasonSummary.tsx`

**Step 1: Build scrollable analytics page**

Match screenshot 5:
- PageHeader: "Season Summary" + description
- Season selector badge
- Sections (vertical scroll):
  1. **Rank Progression** — Line chart showing global rank over rounds (Recharts)
  2. **Transfer Impact** — Donut chart (transfer balance) + bar chart (impact per race)
  3. **Point Distributions** — Bar charts (points by asset, points by season & type)
  4. **Positive Events** — FL/DOTD/FP hit balance donut + impact per race bar
  5. **Negative Events** — DNF/DQ impact donut + per race bar

**Step 2: Verify**

Run: `cd frontend && npx tsc -b --noEmit`

**Step 3: Commit**

```bash
git add frontend/src/pages/fantasy/SeasonSummary.tsx
git commit -m "feat: redesign Season Summary with rank progression, transfers, and distributions"
```

### Task 14: Redesign Hindsight

**Files:**
- Rewrite: `frontend/src/pages/fantasy/Hindsight.tsx`

**Step 1: Build 3-column hindsight view**

Match screenshot 9:
- **Left column:** Best team combos list — numbered rows with DriverPills showing price + price change, total budget, Delta$, Pts
- **Center column:** Settings panel:
  - Season dropdown + Round dropdown (with country flag)
  - "Select a team to analyze" dropdown
  - "Maximum budget" input
  - "Select a chip" — ChipButtons
  - "Convert expected price changes" toggle
  - "Full Reset" + settings
- **Right column:**
  - "Drivers" DataTable: DR, $, Delta$, Pts descending, Incl/Excl checkboxes
  - "Constructors" DataTable: CR, $, Delta$, Pts, Incl/Excl

**Step 2: Verify**

Run: `cd frontend && npx tsc -b --noEmit`

**Step 3: Commit**

```bash
git add frontend/src/pages/fantasy/Hindsight.tsx
git commit -m "feat: redesign Hindsight with 3-column best teams and driver tables"
```

---

## Phase 5: Remaining Pages Restyle

### Task 15: Restyle Chip Strategy, DRS Boost, Settings, Import Team

**Files:**
- Modify: `frontend/src/pages/fantasy/ChipStrategy.tsx`
- Modify: `frontend/src/pages/fantasy/DRSBoost.tsx`
- Modify: `frontend/src/pages/fantasy/Settings.tsx`
- Modify: `frontend/src/pages/fantasy/ImportTeam.tsx`

**Step 1: Restyle each page to use new shared components**

For each page:
- Add PageHeader with bold title
- Replace custom tables with DataTable
- Replace custom driver displays with DriverPill/ConstructorPill
- Use TeamSlotTabs where team selection is needed
- Use ChipButtons where chip selection is needed
- Ensure consistent dark theme styling

These are lighter touch — keep existing logic, swap visual components.

**Step 2: Verify**

Run: `cd frontend && npx tsc -b --noEmit`

**Step 3: Commit**

```bash
git add frontend/src/pages/fantasy/ChipStrategy.tsx frontend/src/pages/fantasy/DRSBoost.tsx frontend/src/pages/fantasy/Settings.tsx frontend/src/pages/fantasy/ImportTeam.tsx
git commit -m "feat: restyle Chip Strategy, DRS Boost, Settings, and Import pages"
```

---

## Phase 6: Types and Integration

### Task 16: Add F1 Player Types and Update useFantasy Hook

**Files:**
- Modify: `frontend/src/types/f1.ts` (add F1Player, F1Stats types)
- Modify: `frontend/src/hooks/useFantasy.ts` (add `useF1Players` function or extend existing)

**Step 1: Add types**

```typescript
export interface F1Player {
  driver_number?: number;
  constructor_id?: string;
  name: string;
  tla: string;
  team_name: string;
  team_color: string;
  price: number;
  old_price: number;
  price_change: number;
  selected_pct: number;
  captain_pct: number;
  gameday_points: number;
  overall_points: number;
  projected_points: number;
  type: 'driver' | 'constructor';
  status?: string;
  is_active: boolean;
}

export interface F1RoundStats {
  round: number;
  gp_name: string;
  country: string;
  country_code: string;
  points: Record<string, number>; // driver_tla -> points
}
```

**Step 2: Add `useF1Players` to useFantasy.ts**

```typescript
export function useF1Players() {
  const [drivers, setDrivers] = useState<F1Player[]>([]);
  const [constructors, setConstructors] = useState<F1Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/fantasy/f1-players')
      .then(r => r.json())
      .then(data => {
        setDrivers(data.drivers || []);
        setConstructors(data.constructors || []);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return { drivers, constructors, loading, error };
}
```

**Step 3: Verify**

Run: `cd frontend && npx tsc -b --noEmit`

**Step 4: Commit**

```bash
git add frontend/src/types/f1.ts frontend/src/hooks/useFantasy.ts
git commit -m "feat: add F1Player types and useF1Players hook for real API data"
```

---

## Task Execution Order

**Critical path (do these first — everything else depends on them):**
1. Task 16 (types + hook) — needed by all pages
2. Task 1 (backend API) — needed by hook
3. Tasks 2-4 (shared components) — needed by all pages
4. Task 5 (sidebar) — needed for navigation

**Then pages in priority order:**
5. Task 6 (Enter Team) — core ask
6. Task 7 (Team Calculator)
7. Task 8 (Live Scoring)
8. Task 9 (Budget Builder)
9. Task 10 (Statistics)
10. Task 11 (Elite Data)
11. Task 12 (Team Analyzer)
12. Task 13 (Season Summary)
13. Task 14 (Hindsight)
14. Task 15 (Restyle remaining)

**Recommended execution:** Task 16 → Task 1 → Tasks 2-5 (parallel) → Tasks 6-9 (parallel by page) → Tasks 10-14 (parallel by page) → Task 15
