# Live Session Page Redesign — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redesign the live session page with a side-by-side layout, sub-navigation, improved timing tower, and overhauled track map inspired by f1-dash.com.

**Architecture:** The live page becomes a mini-app with 3 views (Dashboard, Track Map, Conditions) controlled by local state. Backend WebSocket payload is enriched with session status, position deltas, pit status, and sector best flags. Frontend components are refactored for compactness and interactivity.

**Tech Stack:** React + TypeScript + Tailwind v4, FastAPI WebSocket, OpenF1 API

**Design Doc:** `docs/plans/2026-03-06-live-page-redesign-design.md`

---

### Task 1: Backend — Add session_status, position_change, in_pit, sector flags

**Files:**
- Modify: `backend/app/routers/websocket.py`
- Modify: `frontend/src/types/f1.ts`

**Step 1: Add session_status to WebSocket payload**

In `websocket.py`, in `fetch_live_state()`, after line 59 (`session = await openf1.get_latest_session()`), compute session status:

```python
from datetime import datetime, timezone

now = datetime.now(timezone.utc)
session_end_str = session.get("date_end", "")
session_start_str = session.get("date_start", "")
try:
    session_end = datetime.fromisoformat(session_end_str)
    session_start = datetime.fromisoformat(session_start_str)
except (ValueError, TypeError):
    session_end = None
    session_start = None

if session_end and now > session_end:
    session_status = "ended"
elif session_start and now < session_start:
    session_status = "upcoming"
else:
    session_status = "live"
```

Add `"session_status": session_status` to the return dict (alongside `"session"`, `"drivers"`, etc.).

**Step 2: Add position_change per driver**

In the driver map building section (around line 135), add `"position_change": None` to the initial driver dict.

After the practice/race sorting (around line 290), compute position change:

```python
for d in sorted_drivers:
    num = d["driver_number"]
    grid = _grid_positions.get(num)
    if grid is not None and d["position"] is not None:
        d["position_change"] = grid - d["position"]  # positive = gained positions
    else:
        d["position_change"] = None
```

**Step 3: Add in_pit flag per driver**

In the driver map building, add `"in_pit": False` to the initial driver dict.

After the stint processing (around line 225), detect pit status:

```python
for num, stint in driver_stints.items():
    if num in driver_map:
        # ... existing compound/tire_age code ...
        # Pit detection: if stint has no lap_end, driver might be on a new stint (just pitted)
        if stint.get("lap_end") is None and stint.get("stint_number", 1) > 1:
            driver_map[num]["in_pit"] = True
```

**Step 4: Add sector personal best flags**

After the sector bests enrichment (around line 260), add:

```python
for num, d in driver_map.items():
    pb = driver_sector_bests.get(num, {"s1": None, "s2": None, "s3": None})
    d["is_pb_s1"] = (d.get("sector_1_time") is not None and pb["s1"] is not None
                     and abs(d["sector_1_time"] - pb["s1"]) < 0.001)
    d["is_pb_s2"] = (d.get("sector_2_time") is not None and pb["s2"] is not None
                     and abs(d["sector_2_time"] - pb["s2"]) < 0.001)
    d["is_pb_s3"] = (d.get("sector_3_time") is not None and pb["s3"] is not None
                     and abs(d["sector_3_time"] - pb["s3"]) < 0.001)
```

**Step 5: Skip location fetch when session ended**

Wrap the entire location fetch block (car_positions) with:

```python
if session_status == "live":
    # ... existing location fetch code ...
else:
    car_positions = _last_car_positions if _last_car_positions else []
```

**Step 6: Update TypeScript types**

In `frontend/src/types/f1.ts`, add to `Driver` interface:

```typescript
position_change?: number | null;
in_pit?: boolean;
is_pb_s1?: boolean;
is_pb_s2?: boolean;
is_pb_s3?: boolean;
```

Add to `LiveTimingState` interface:

```typescript
session_status?: 'live' | 'ended' | 'upcoming';
```

**Step 7: Commit**

```bash
git add backend/app/routers/websocket.py frontend/src/types/f1.ts
git commit -m "feat: enrich WebSocket payload with session_status, position_change, in_pit, sector flags"
```

---

### Task 2: Frontend — LiveDashboard layout with sub-navigation

**Files:**
- Modify: `frontend/src/pages/LiveDashboard.tsx`
- Modify: `frontend/src/hooks/useLiveTiming.ts`

**Step 1: Add sessionStatus to useLiveTiming hook**

In `frontend/src/hooks/useLiveTiming.ts`, add state and propagation:

```typescript
const [sessionStatus, setSessionStatus] = useState<'live' | 'ended' | 'upcoming' | null>(null);

// In onMessage callback, add:
if (state.session_status) setSessionStatus(state.session_status);

// Add to return:
return { ..., sessionStatus };
```

**Step 2: Rewrite LiveDashboard with sub-navigation**

Replace the `LiveDashboard` component in `frontend/src/pages/LiveDashboard.tsx`:

```tsx
type LiveView = 'dashboard' | 'trackmap' | 'conditions';

const NAV_ITEMS: { id: LiveView; label: string; icon: string }[] = [
  { id: 'dashboard', label: 'Dash', icon: '▦' },
  { id: 'trackmap', label: 'Map', icon: '◎' },
  { id: 'conditions', label: 'Cond', icon: '☁' },
];

export function LiveDashboard() {
  const [activeView, setActiveView] = useState<LiveView>('dashboard');
  const {
    drivers, weather, raceControl, sessionInfo, carPositions,
    sectorBests, connectionStatus, sessionStatus,
  } = useLiveTiming();

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Session header bar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-f1-border flex-shrink-0">
        {/* ... existing session info, timer, weather, connection status ... */}
      </div>

      {/* Main area: sub-nav + content */}
      <div className="flex flex-1 min-h-0">
        {/* Sub-navigation */}
        <nav className="w-12 flex-shrink-0 border-r border-f1-border flex flex-col items-center py-2 gap-1">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`w-10 h-10 rounded-lg flex flex-col items-center justify-center text-[10px] transition-colors ${
                activeView === item.id
                  ? 'bg-f1-elevated text-f1-cyan'
                  : 'text-f1-text-muted hover:text-f1-text hover:bg-f1-elevated/50'
              }`}
              title={item.label}
            >
              <span className="text-base">{item.icon}</span>
              <span className="font-[var(--font-display)]">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Content area */}
        <div className="flex-1 min-w-0 overflow-auto p-3">
          {activeView === 'dashboard' && (
            <DashboardView
              drivers={drivers} sectorBests={sectorBests}
              carPositions={carPositions} sessionInfo={sessionInfo}
              raceControl={raceControl} sessionStatus={sessionStatus}
            />
          )}
          {activeView === 'trackmap' && (
            <TrackMapView
              carPositions={carPositions} sessionInfo={sessionInfo}
              drivers={drivers} sessionStatus={sessionStatus}
            />
          )}
          {activeView === 'conditions' && (
            <ConditionsView weather={weather} raceControl={raceControl} />
          )}
        </div>
      </div>
    </div>
  );
}
```

**Step 3: Create DashboardView (side-by-side)**

In the same file or a new component:

```tsx
function DashboardView({ drivers, sectorBests, carPositions, sessionInfo, raceControl, sessionStatus }) {
  return (
    <div className="flex gap-3 h-full">
      {/* Left: Timing tower */}
      <div className="flex-[58] min-w-0 overflow-auto">
        <LiveTimingBoard drivers={drivers} sectorBests={sectorBests} />
      </div>
      {/* Right: Track map + race control */}
      <div className="flex-[42] flex flex-col gap-3 min-w-0">
        <div className="flex-[60]">
          <TrackMap
            carPositions={carPositions}
            circuitKey={sessionInfo?.circuit_key}
            drivers={drivers}
            sessionStatus={sessionStatus}
          />
        </div>
        <div className="flex-[40] overflow-auto">
          <RaceControlFeed messages={raceControl} />
        </div>
      </div>
    </div>
  );
}
```

**Step 4: Create TrackMapView (full-screen map)**

```tsx
function TrackMapView({ carPositions, sessionInfo, drivers, sessionStatus }) {
  return (
    <div className="h-full">
      <TrackMap
        carPositions={carPositions}
        circuitKey={sessionInfo?.circuit_key}
        drivers={drivers}
        sessionStatus={sessionStatus}
        fullPage
      />
    </div>
  );
}
```

**Step 5: Create ConditionsView**

```tsx
function ConditionsView({ weather, raceControl }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <EnhancedWeather weather={weather} />
      <RaceControlFeed messages={raceControl} expanded />
    </div>
  );
}
```

**Step 6: Commit**

```bash
git add frontend/src/pages/LiveDashboard.tsx frontend/src/hooks/useLiveTiming.ts
git commit -m "feat: add sub-navigation and 3-view layout to live page"
```

---

### Task 3: Frontend — Timing tower redesign

**Files:**
- Modify: `frontend/src/components/timing/LiveTimingBoard.tsx`
- Modify: `frontend/src/components/timing/DriverRow.tsx`

**Step 1: Redesign LiveTimingBoard with sticky header and compact layout**

Rewrite `LiveTimingBoard.tsx` with:
- Sticky column headers (`sticky top-0 z-10 bg-f1-surface`)
- Simplified columns: P, Driver, Tire, INT, Best, Last, Gap, S1, S2, S3
- Drop best sectors to save space (they're redundant with the mini-sector coloring)
- `min-w-[700px]` instead of `900px` for the reduced columns

**Step 2: Redesign DriverRow with mini sectors, position delta, pit/DNF status**

Rewrite `DriverRow.tsx` with:

- **Compact height:** `py-0.5` instead of `py-1` (~22px rows)
- **Position change:** Small colored text next to position (green `↑2`, red `↓1`, gray `—` if 0)
- **DNF styling:** Entire row gets `opacity-40` and strikethrough on name if `driver.is_dnf`
- **PIT badge:** Small "PIT" pill next to tire compound if `driver.in_pit`
- **Mini sectors:** Replace raw sector time display with colored blocks:

```tsx
function MiniSector({ time, sessionBest, isPersonalBest }: {
  time: number | null;
  sessionBest: number | null;
  isPersonalBest?: boolean;
}) {
  if (time === null) return <div className="w-3 h-3 rounded-sm bg-f1-border/30" />;

  const isSessionBest = sessionBest !== null && Math.abs(time - sessionBest) < 0.001;
  const bg = isSessionBest ? 'bg-purple-500' : isPersonalBest ? 'bg-green-500' : 'bg-yellow-500/60';

  return (
    <div
      className={`w-3 h-3 rounded-sm ${bg} cursor-help`}
      title={formatSectorTime(time)}
    />
  );
}
```

- **Color-coded gaps:** In the interval column:

```tsx
function gapColor(gap: number | string | null): string {
  if (gap === null || gap === 0) return 'text-f1-text';
  if (typeof gap === 'string') return 'text-f1-red'; // lapped
  if (gap < 1) return 'text-f1-green';
  if (gap < 5) return 'text-f1-yellow';
  return 'text-f1-red';
}
```

**Step 3: Commit**

```bash
git add frontend/src/components/timing/LiveTimingBoard.tsx frontend/src/components/timing/DriverRow.tsx
git commit -m "feat: compact timing tower with mini sectors, position delta, gap colors"
```

---

### Task 4: Frontend — Track map session awareness and polish

**Files:**
- Modify: `frontend/src/components/live/TrackMap.tsx`

**Step 1: Add sessionStatus prop and session-aware rendering**

Add `sessionStatus?: 'live' | 'ended' | 'upcoming' | null` and `fullPage?: boolean` to `TrackMapProps`.

**Step 2: Session-ended state**

When `sessionStatus === 'ended'`:
- Show a semi-transparent overlay with "SESSION ENDED" text centered on the SVG
- Fade all car dots to 30% opacity
- Stop the expand button pulse animation

```tsx
{sessionStatus === 'ended' && (
  <g>
    <rect x={0} y={0} width={bounds.width} height={bounds.height} fill="#0F0F13" opacity={0.6} />
    <text
      x={bounds.width / 2} y={bounds.height / 2}
      textAnchor="middle" fill="#6B7280"
      fontSize={s * 12} fontFamily="var(--font-display)" fontWeight="700"
    >
      SESSION ENDED
    </text>
  </g>
)}
```

**Step 3: Add position numbers to car dots**

Below the driver acronym label, add a small position number:

```tsx
{d?.position && (
  <text
    x={0} y={dotR + s * 4}
    textAnchor="middle" fill="#fff"
    fontSize={s * 3.5} fontFamily="var(--font-mono)"
    fontWeight="600" opacity={0.6}
    style={{ pointerEvents: 'none' }}
  >
    P{d.position}
  </text>
)}
```

**Step 4: Purple stroke for fastest lap holder**

Modify the dot stroke logic:

```tsx
stroke={isSel ? '#fff' : isLeader ? '#fff' : d?.has_fastest_lap ? '#A855F7' : 'none'}
strokeWidth={isSel || isLeader || d?.has_fastest_lap ? s * 0.8 : 0}
```

**Step 5: Dim in-pit drivers**

```tsx
<g
  key={pos.driver_number}
  style={{ ... }}
  opacity={d?.in_pit ? 0.3 : 1}
>
```

**Step 6: Full-page mode support**

When `fullPage` prop is true, render without the card wrapper (no bg-f1-surface, no border), and set SVG to fill available height:

```tsx
const containerClass = fullPage
  ? 'h-full flex flex-col'
  : 'bg-f1-surface rounded-lg border border-f1-border relative group';
```

**Step 7: Expanded view driver list**

When in expanded mode, add a side panel with driver list:

```tsx
{isExpanded && (
  <div className="w-56 flex-shrink-0 overflow-auto border-l border-f1-border bg-f1-surface/80">
    {drivers.sort((a, b) => (a.position ?? 99) - (b.position ?? 99)).map(d => (
      <button
        key={d.driver_number}
        onClick={() => setSelectedDriver(d.driver_number)}
        className={`w-full px-2 py-1 text-left text-xs flex items-center gap-2 hover:bg-f1-elevated/50 ${
          d.driver_number === selectedDriver ? 'bg-f1-elevated' : ''
        }`}
      >
        <span className="font-timing w-5">{d.position ?? '—'}</span>
        <span className="w-1.5 h-4 rounded-full flex-shrink-0"
          style={{ backgroundColor: getTeamColorFromHex(d.team_colour) }} />
        <span className="font-bold font-[var(--font-display)] text-[11px]">{d.name_acronym}</span>
        <span className="ml-auto font-timing text-f1-text-muted text-[10px]">
          {d.gap_to_leader ? `+${typeof d.gap_to_leader === 'number' ? d.gap_to_leader.toFixed(1) : d.gap_to_leader}` : ''}
        </span>
      </button>
    ))}
  </div>
)}
```

**Step 8: Commit**

```bash
git add frontend/src/components/live/TrackMap.tsx
git commit -m "feat: track map session awareness, position labels, pit dimming, expanded driver list"
```

---

### Task 5: Polish and integration

**Files:**
- Modify: `frontend/src/components/live/RaceControlFeed.tsx` (add `expanded` prop for full-height view)
- Modify: `frontend/src/components/live/EnhancedWeather.tsx` (larger layout for conditions view)
- Run: `npx tsc -b --noEmit` to verify no type errors
- Visual check in browser

**Step 1: Add expanded prop to RaceControlFeed**

```tsx
interface RaceControlFeedProps {
  messages: RaceControl[];
  expanded?: boolean;
}

// Change max-height:
className={expanded ? 'space-y-1' : 'max-h-48 overflow-y-auto space-y-1'}
```

**Step 2: Type-check and fix any issues**

```bash
cd frontend && npx tsc -b --noEmit
```

Fix any type errors that arise from the new props.

**Step 3: Final commit**

```bash
git add -A
git commit -m "feat: live page redesign — polished layout, conditions view, type fixes"
```

---

## Summary

| Task | What | Files |
|------|------|-------|
| 1 | Backend enrichment (session_status, position_change, in_pit, sector flags) | websocket.py, f1.ts |
| 2 | LiveDashboard layout + sub-navigation + 3 views | LiveDashboard.tsx, useLiveTiming.ts |
| 3 | Timing tower redesign (compact, mini sectors, gap colors, position delta) | LiveTimingBoard.tsx, DriverRow.tsx |
| 4 | Track map overhaul (session states, position labels, pit dimming, driver list) | TrackMap.tsx |
| 5 | Polish and integration (expanded views, type-check) | RaceControlFeed.tsx, EnhancedWeather.tsx |
