# Live Session Page Redesign

**Date:** 2026-03-06
**Reference:** f1-dash.com
**Approach:** Side-by-side layout with sub-navigation

## Layout & Navigation

The live page gets a 2-panel layout with a vertical sub-navigation strip on the left edge.

```
+------------------------------------------+
| Session Header Bar (full width)          |
| Circuit | Session | Timer | Temp | Status|
+------+-----------------------------------+
| Nav  | Main Content Area                 |
| ---- |                                   |
| Dash | (changes based on selected view)  |
| Map  |                                   |
| Cond |                                   |
+------+-----------------------------------+
```

**Sub-navigation** (vertical pill tabs, ~48px wide):
- **Dashboard** (default): Side-by-side timing tower + track map
- **Track Map**: Full-screen map with driver list overlay
- **Conditions**: Weather details + race control feed + flag history

**Dashboard view** (default):
- Left (~58%): Timing tower
- Right (~42%): Track map (top ~60%) + Race control feed (bottom ~40%)

## Timing Tower Improvements

1. **Compact rows** — ~22px height, tighter padding, more drivers visible
2. **Color-coded gaps** — Green (<1s), yellow (1-5s), red (>5s/lapped)
3. **Mini sectors** — Colored blocks (purple=session best, green=personal best, yellow=slower), hover for time
4. **Position change indicator** — Arrow or +/- showing gain/loss from grid or previous
5. **DNF/pit status** — Gray out retired drivers, "PIT" badge in pit lane
6. **Sticky header** — Column headers stick to top when scrolling

## Track Map Overhaul

### Session-aware states
- **Live session:** Animated cars with smooth CSS transitions (2s ease)
- **Session ended:** "Session Ended" overlay, cars faded to 30% opacity
- **No session:** Circuit outline only with "Waiting for session..." message

### Car visualization
- Smooth movement via CSS `transition: transform 2s cubic-bezier(...)` on `<g>` elements
- Position number (P1, P2...) inside or next to each dot
- Driver acronym always visible above dot
- Team-colored dot, white stroke for leader, purple stroke for fastest lap holder

### Pit lane indicator
- Dim dot or "PIT" badge when driver coordinates are in pit area

### Expanded view
- Full-screen overlay with driver list panel on the side
- Positions, gaps, tire info in the list
- Click driver in list to highlight on map

## Backend Data Enhancements

1. **Position delta** — `position_change: int` per driver (current vs grid for race, vs previous for practice)
2. **Pit status** — `in_pit: boolean` flag from stint data
3. **Session status** — `session_status: "live" | "ended" | "upcoming"` in WebSocket payload
4. **Location data freshness** — Stop fetching location when session ended
5. **Sector color flags** — `is_personal_best_s1/s2/s3: boolean` per driver to simplify frontend color logic
