# Phase 3: Spiderweb Visualization - Context

**Gathered:** 2026-03-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Force-directed graph showing company → project → sub-unit → task hierarchy with zoomable navigation, team member mapping, and visual state indicators. Users can explore the hierarchy by clicking nodes to zoom in, navigate via breadcrumb, and see who's working on what at each level.

</domain>

<decisions>
## Implementation Decisions

### Node Visual Design
- Circle nodes (classic force-directed look)
- Size varies by hierarchy level (company largest, tasks smallest) with additional size variation based on activity level
- Name only visible on node (clean look, details on hover)
- Visual states via fill style: solid = complete, pulsing animation = active, outline = pending

### Zoom & Navigation
- Single click on node to zoom into children
- Smooth fly-in animation for transitions (camera zooms toward clicked node, old nodes fade)
- Breadcrumb navigation in top left corner (always visible)
- Click empty background to go up one level (plus breadcrumb for jumping multiple levels)

### Graph Physics
- Static after settling (nodes settle into position and stay still)
- No node dragging (automatic layout only)
- Expansive spread (maximum space between nodes, sparse feel)
- Thin straight lines for edges (minimal, clean, lets nodes be focus)

### Team Member Display
- First names only (no avatars) — small team, keeps it simple
- Names floating near node (positioned outside the node)
- Comma-separated list for multiple assignees ("Miguel, Nida, Arvin")
- Colors by PROJECT, not by team member (Miguel works on all three projects, so coloring by person doesn't work)

### Claude's Discretion
- Exact animation timing and easing curves
- Tooltip content layout and styling
- Loading state during data fetch
- Error handling for missing data

</decisions>

<specifics>
## Specific Ideas

- Projects should be color-differentiated (Seraph, X150, IntelliBot/OpenClaw as distinct colors)
- Team is small enough that first names are sufficient — no need for avatars or last names
- The "spiderweb" metaphor: clean, structural, not literally web-like in appearance

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 03-spiderweb-visualization*
*Context gathered: 2026-03-01*
