# Phase 3: Spiderweb Visualization - Research

**Researched:** 2026-03-02
**Domain:** Force-directed graph visualization with React
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Node Visual Design:**
- Circle nodes (classic force-directed look)
- Size varies by hierarchy level (company largest, tasks smallest) with additional size variation based on activity level
- Name only visible on node (clean look, details on hover)
- Visual states via fill style: solid = complete, pulsing animation = active, outline = pending

**Zoom & Navigation:**
- Single click on node to zoom into children
- Smooth fly-in animation for transitions (camera zooms toward clicked node, old nodes fade)
- Breadcrumb navigation in top left corner (always visible)
- Click empty background to go up one level (plus breadcrumb for jumping multiple levels)

**Graph Physics:**
- Static after settling (nodes settle into position and stay still)
- No node dragging (automatic layout only)
- Expansive spread (maximum space between nodes, sparse feel)
- Thin straight lines for edges (minimal, clean, lets nodes be focus)

**Team Member Display:**
- First names only (no avatars) — small team, keeps it simple
- Names floating near node (positioned outside the node)
- Comma-separated list for multiple assignees ("Miguel, Nida, Arvin")
- Colors by PROJECT, not by team member (Miguel works on all three projects, so coloring by person doesn't work)

### Claude's Discretion

- Exact animation timing and easing curves
- Tooltip content layout and styling
- Loading state during data fetch
- Error handling for missing data

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope

</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| VIZ-01 | User can view force-directed graph showing company → project → sub-unit hierarchy | react-force-graph-2d for rendering, d3-force simulation for layout physics |
| VIZ-02 | User can click on project node to zoom into sub-units | onNodeClick handler + zoom() + centerAt() API methods for smooth transitions |
| VIZ-03 | User can click on sub-unit node to zoom into tasks | Same navigation pattern, hierarchical state management |
| VIZ-04 | User can navigate back up hierarchy via breadcrumb | Location-based breadcrumb pattern (company > project > sub-unit), onClick handlers |
| VIZ-05 | Nodes display team members assigned at that level | nodeCanvasObject custom rendering, text positioning outside circles |
| VIZ-06 | Nodes show visual state (solid = complete, pulsing = active, outline = pending) | Canvas rendering with fill/stroke styles, CSS keyframe animations for pulsing |
| VIZ-07 | Hover on node shows tooltip with last update and owner | onNodeHover handler + nodeLabel prop with HTML formatting |
| VIZ-08 | Nodes are color-coded by team (green = Science, purple = AI, cyan = crossover) | Project-based color mapping in nodeColor prop |

</phase_requirements>

## Summary

Force-directed graph visualization requires react-force-graph-2d (latest version 1.29.1) as the standard React wrapper around d3-force physics engine. The library provides Canvas-based rendering for performance with hierarchical datasets, camera control methods for smooth zoom/pan transitions, and customizable node rendering via nodeCanvasObject callbacks.

The key technical challenge is implementing hierarchical navigation (drill-down and breadcrumb) on top of a force simulation designed for flat graphs. This requires filtering the graph data by hierarchy level, managing zoom state, and stopping the simulation after initial layout (static graphs per user requirement). Performance is excellent for small team tracker scale (estimated <100 nodes per level).

**Primary recommendation:** Use react-force-graph-2d with Canvas renderer, implement static layouts via warmupTicks for pre-computation, manage hierarchy state in React component, and use zoom()/centerAt() for smooth drill-down transitions.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-force-graph-2d | 1.29.1 | Force-directed graph React component | Industry standard React wrapper for d3-force, Canvas rendering, 3000+ GitHub stars, active maintenance |
| d3-force | 7.9.0 | Physics simulation engine | De facto standard for force layouts, Velocity Verlet integration, proven algorithm |
| d3-zoom | 7.9.0 | Zoom/pan behaviors | Official D3 module for smooth zoom transitions, used internally by react-force-graph |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| d3-interpolate | 7.9.0 | Smooth zoom interpolation | For custom zoom animations, provides "Smooth and efficient zooming" algorithm |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| react-force-graph-2d | D3.js direct integration | More control but lose React abstraction, must manage canvas/SVG rendering manually |
| Canvas renderer | SVG renderer | Better for <1000 nodes and need DOM selection, but Canvas 3-10x faster for large graphs |
| react-force-graph | react-flow | react-flow better for flowcharts/diagrams, but force simulation better for organic layouts |

**Installation:**
```bash
npm install react-force-graph-2d
```

Note: d3-force and d3-zoom are peer dependencies, auto-installed.

## Architecture Patterns

### Recommended Project Structure
```
src/
├── components/
│   ├── SpiderwebGraph.tsx       # Main graph component
│   ├── GraphBreadcrumb.tsx      # Navigation breadcrumb
│   └── GraphTooltip.tsx         # Node hover tooltip (optional if using nodeLabel)
├── hooks/
│   └── useGraphData.tsx         # Data fetching and hierarchy filtering
├── lib/
│   └── graph-utils.ts           # Node styling, color mapping, size calculation
└── pages/
    └── Spiderweb.tsx            # Page wrapper
```

### Pattern 1: Hierarchical State Management
**What:** Track current hierarchy level and filter graph data accordingly
**When to use:** Always for drill-down navigation in force graphs

**Example:**
```typescript
// Source: Research synthesis
interface HierarchyState {
  level: 'company' | 'project' | 'sub-unit' | 'task'
  parentId: string | null
  breadcrumb: Array<{ id: string; name: string; level: string }>
}

const [hierarchy, setHierarchy] = useState<HierarchyState>({
  level: 'company',
  parentId: null,
  breadcrumb: [{ id: 'root', name: 'Ex-Venture', level: 'company' }]
})

// Filter graph data based on current level
const graphData = useMemo(() => {
  if (hierarchy.level === 'company') {
    // Show company → projects
    return { nodes: [companyNode, ...projectNodes], links: projectLinks }
  } else if (hierarchy.level === 'project') {
    // Show project → sub-units
    return { nodes: [projectNode, ...subUnitNodes], links: subUnitLinks }
  }
  // ... etc
}, [hierarchy, allData])
```

### Pattern 2: Static Force Simulation
**What:** Pre-compute layout then freeze simulation for static display
**When to use:** When users don't drag nodes (per user requirement)

**Example:**
```typescript
// Source: https://d3js.org/d3-force/simulation
<ForceGraph2D
  graphData={graphData}
  warmupTicks={100}           // Pre-compute 100 ticks before render
  cooldownTime={1000}         // Freeze after 1 second
  d3AlphaDecay={0.05}         // Faster decay = quicker settling
  enableNodeDrag={false}      // No dragging per requirements
  enablePanInteraction={true} // Allow pan but not drag
  enableZoomInteraction={true}
/>
```

### Pattern 3: Smooth Zoom Transitions
**What:** Programmatic zoom/pan on node click for drill-down effect
**When to use:** Implementing hierarchical navigation

**Example:**
```typescript
// Source: https://vasturiano.github.io/react-force-graph/
const fgRef = useRef<any>()

const handleNodeClick = (node: any) => {
  // Update hierarchy state
  setHierarchy(prev => ({
    level: getNextLevel(prev.level),
    parentId: node.id,
    breadcrumb: [...prev.breadcrumb, { id: node.id, name: node.name, level: prev.level }]
  }))

  // Smooth zoom to center node
  const distance = 200
  const distRatio = 1 + distance / Math.hypot(node.x, node.y)

  fgRef.current?.centerAt(node.x, node.y, 1000) // 1000ms transition
  fgRef.current?.zoom(3, 1000)                   // Zoom level 3
}
```

### Pattern 4: Canvas Custom Node Rendering
**What:** Use nodeCanvasObject for full control over node appearance
**When to use:** Custom node styles, animations, or text labels

**Example:**
```typescript
// Source: https://vasturiano.github.io/react-force-graph/
const nodeCanvasObject = (node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
  const label = node.name
  const fontSize = 12 / globalScale
  const nodeRadius = getNodeRadius(node) // Vary by hierarchy level

  // Draw circle with state-based styling
  ctx.beginPath()
  ctx.arc(node.x, node.y, nodeRadius, 0, 2 * Math.PI)

  if (node.status === 'done') {
    ctx.fillStyle = getProjectColor(node.projectId) // Solid fill
    ctx.fill()
  } else if (node.status === 'in_progress') {
    ctx.strokeStyle = getProjectColor(node.projectId) // Pulsing outline
    ctx.lineWidth = 3
    ctx.stroke()
    // Note: Pulsing animation requires canvas redraw on timer
  } else {
    ctx.strokeStyle = getProjectColor(node.projectId) // Outline only
    ctx.lineWidth = 2
    ctx.stroke()
  }

  // Draw label inside node
  ctx.font = `${fontSize}px Sans-Serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = node.status === 'done' ? 'white' : getProjectColor(node.projectId)
  ctx.fillText(label, node.x, node.y)

  // Draw team members outside node
  if (node.assignees && node.assignees.length > 0) {
    const assigneeText = node.assignees.map((a: any) => a.firstName).join(', ')
    ctx.font = `${fontSize * 0.8}px Sans-Serif`
    ctx.fillStyle = '#666'
    ctx.fillText(assigneeText, node.x, node.y + nodeRadius + 10)
  }
}

<ForceGraph2D
  nodeCanvasObject={nodeCanvasObject}
  nodeCanvasObjectMode={() => 'replace'} // Skip default node rendering
/>
```

### Pattern 5: Location-Based Breadcrumb Navigation
**What:** Show hierarchy path, allow clicking to jump to any level
**When to use:** Always for hierarchical drill-down interfaces

**Example:**
```typescript
// Source: https://www.eleken.co/blog-posts/breadcrumbs-ux
const Breadcrumb = ({ items, onNavigate }: BreadcrumbProps) => (
  <div style={{ position: 'absolute', top: 20, left: 20, zIndex: 10 }}>
    {items.map((item, index) => (
      <span key={item.id}>
        {index > 0 && <span style={{ margin: '0 8px', color: '#666' }}>›</span>}
        <button
          onClick={() => onNavigate(item.id, item.level)}
          style={{
            background: 'none',
            border: 'none',
            color: index === items.length - 1 ? '#000' : '#2196F3',
            textDecoration: index === items.length - 1 ? 'none' : 'underline',
            cursor: index === items.length - 1 ? 'default' : 'pointer',
            fontSize: '14px'
          }}
          disabled={index === items.length - 1}
        >
          {item.name}
        </button>
      </span>
    ))}
  </div>
)
```

### Anti-Patterns to Avoid

- **Continuous simulation with static requirement:** Don't leave simulation running indefinitely when users expect static layout. Use warmupTicks + cooldownTime to pre-compute and freeze.
- **SVG for large graphs:** Don't use SVG renderer if dataset could grow beyond 1000 nodes. Canvas is 3-10x faster.
- **Node dragging without reheat:** If enabling node drag, must call d3ReheatSimulation() after drag to re-stabilize layout.
- **Infinite alpha decay:** Don't set cooldownTime to Infinity for static graphs. Wastes CPU and battery.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Force-directed layout algorithm | Custom physics simulation | d3-force | Velocity Verlet integration handles edge cases (overlapping nodes, oscillation damping, convergence) |
| Smooth zoom interpolation | Linear interpolation or CSS transforms | d3-zoom with built-in interpolator | "Smooth and efficient zooming" algorithm (van Wijk & Nuij) handles non-linear camera paths |
| Canvas optimization | Manual dirty-rect tracking | react-force-graph's built-in renderer | Handles requestAnimationFrame, node culling, and interaction tracking |
| Breadcrumb state management | Custom history stack | Standard array with useMemo | Well-understood pattern, avoids circular reference bugs |

**Key insight:** Force simulations are deceptively complex. Alpha decay, velocity damping, force strengths, and convergence criteria have non-obvious interactions. d3-force represents 10+ years of iteration on these parameters.

## Common Pitfalls

### Pitfall 1: Simulation Never Stops (Alpha Decay Too Low)
**What goes wrong:** Graph keeps animating, consuming CPU indefinitely
**Why it happens:** Default alphaDecay (0.0228) takes ~300 iterations to reach alphaMin. For static layouts, this is too slow.
**How to avoid:** Increase d3AlphaDecay to 0.05-0.1 for faster settling, or use warmupTicks to pre-compute layout before render
**Warning signs:** Fan noise increases, battery drains quickly, nodes still jiggling after 5+ seconds

### Pitfall 2: Performance Cliff at ~1000 Nodes (SVG Rendering)
**What goes wrong:** Smooth with 500 nodes, slideshow at 1500 nodes
**Why it happens:** SVG creates DOM elements for each node, browser struggles with thousands of elements during animation
**How to avoid:** Always use Canvas renderer (ForceGraph2D not ForceGraphSVG), or implement pagination/filtering
**Warning signs:** Choppy animation, delayed interactions, browser DevTools shows 100% CPU

### Pitfall 3: Overlapping Labels (Text Collision)
**What goes wrong:** Team member names overlap, making them unreadable
**Why it happens:** Canvas text rendering doesn't auto-adjust position based on neighbors
**How to avoid:** Position labels at calculated offsets (above/below node based on index), or use tooltip-on-hover instead of always-visible labels
**Warning signs:** User feedback about "can't read names", labels stacked on top of each other

### Pitfall 4: Lost Context After Zoom (No Breadcrumb)
**What goes wrong:** User clicks into sub-units, can't remember which project they're viewing
**Why it happens:** Forgetting to implement breadcrumb or hierarchy indicator
**How to avoid:** Always show location-based breadcrumb in fixed position, update on every drill-down
**Warning signs:** User asks "how do I go back?" or "where am I?"

### Pitfall 5: Zoom State Persists Across Level Changes
**What goes wrong:** User drills down, graph appears at wrong zoom level or off-center
**Why it happens:** react-force-graph maintains camera position between data updates
**How to avoid:** Reset zoom to default and center on parent node after hierarchy state changes
**Warning signs:** Nodes appear tiny or off-screen after clicking

### Pitfall 6: Pulsing Animation Requires Continuous Redraw
**What goes wrong:** Pulsing status indicators don't animate after graph settles
**Why it happens:** Static simulation stops calling tick(), so Canvas doesn't redraw
**How to avoid:** Either (1) keep simulation running at low alpha for animations, or (2) implement separate requestAnimationFrame loop for pulsing only
**Warning signs:** Nodes stop pulsing after initial load

### Pitfall 7: Memory Leak with useRef in useEffect
**What goes wrong:** Graph ref changes on every render, causing infinite re-renders
**Why it happens:** Accessing fgRef.current in useEffect dependency array
**How to avoid:** Don't include ref.current in dependencies, or use callback pattern
**Warning signs:** React DevTools shows hundreds of renders per second

## Code Examples

Verified patterns from official sources:

### Basic Force Graph Setup
```typescript
// Source: https://github.com/vasturiano/react-force-graph
import ForceGraph2D from 'react-force-graph-2d'
import { useRef, useState, useEffect } from 'react'

interface Node {
  id: string
  name: string
  level: 'company' | 'project' | 'sub-unit' | 'task'
  status: 'done' | 'in_progress' | 'pending'
  projectId: string
  assignees: Array<{ firstName: string }>
}

interface Link {
  source: string
  target: string
}

const SpiderwebGraph = () => {
  const fgRef = useRef<any>()
  const [graphData, setGraphData] = useState<{ nodes: Node[]; links: Link[] }>({
    nodes: [],
    links: []
  })

  return (
    <ForceGraph2D
      ref={fgRef}
      graphData={graphData}
      width={window.innerWidth}
      height={window.innerHeight}

      // Simulation config for static layout
      warmupTicks={100}
      cooldownTime={2000}
      d3AlphaDecay={0.05}
      d3VelocityDecay={0.4}

      // Interaction config
      enableNodeDrag={false}
      enablePanInteraction={true}
      enableZoomInteraction={true}

      // Force configuration
      d3Force={(forceName) => {
        if (forceName === 'charge') {
          return d3.forceManyBody().strength(-300) // Repulsion for sparse layout
        }
        if (forceName === 'link') {
          return d3.forceLink().distance(100) // Long links
        }
        return null
      }}

      // Event handlers
      onNodeClick={handleNodeClick}
      onBackgroundClick={handleBackgroundClick}
      onNodeHover={handleNodeHover}

      // Node styling
      nodeCanvasObject={renderNode}
      nodeColor={(node) => getProjectColor(node.projectId)}
      nodeVal={(node) => getNodeSize(node.level)}

      // Link styling
      linkColor={() => '#cccccc'}
      linkWidth={1}
      linkDirectionalParticles={0} // No animated particles
    />
  )
}
```

### Alpha Decay Calculation (Static Layout)
```typescript
// Source: https://d3js.org/d3-force/simulation
// Calculate iterations needed for simulation to reach alphaMin
const calculateWarmupTicks = (alphaMin = 0.001, alphaDecay = 0.0228) => {
  return Math.ceil(
    Math.log(alphaMin) / Math.log(1 - alphaDecay)
  )
}

// Default values: ~300 iterations
// Fast settling: calculateWarmupTicks(0.001, 0.05) = ~138 iterations
```

### Expansive Force Configuration
```typescript
// Source: https://www.d3indepth.com/force-layout/
const configureExpansiveForces = (simulation: any) => {
  simulation
    .force('charge', d3.forceManyBody().strength(-400))        // Strong repulsion
    .force('link', d3.forceLink().distance(150).strength(0.5)) // Long, flexible links
    .force('collision', d3.forceCollide().radius(50))          // Prevent overlap
    .force('center', d3.forceCenter())                         // Keep centered
}
```

### Pulsing Animation with Static Graph
```typescript
// Source: Research synthesis (handling animation + static layout conflict)
const [pulsePhase, setPulsePhase] = useState(0)

useEffect(() => {
  // Separate animation loop from simulation
  let animationId: number
  const animate = () => {
    setPulsePhase(prev => (prev + 0.05) % (2 * Math.PI))
    animationId = requestAnimationFrame(animate)
  }
  animationId = requestAnimationFrame(animate)
  return () => cancelAnimationFrame(animationId)
}, [])

const nodeCanvasObject = (node: any, ctx: CanvasRenderingContext2D) => {
  const radius = getNodeRadius(node)

  if (node.status === 'in_progress') {
    // Pulsing effect using separate animation loop
    const pulseRadius = radius + Math.sin(pulsePhase) * 3
    ctx.beginPath()
    ctx.arc(node.x, node.y, pulseRadius, 0, 2 * Math.PI)
    ctx.strokeStyle = getProjectColor(node.projectId)
    ctx.lineWidth = 2 + Math.sin(pulsePhase) * 0.5
    ctx.stroke()
  }
  // ... other rendering
}
```

### Tooltip with HTML Content
```typescript
// Source: https://vasturiano.github.io/react-force-graph/
<ForceGraph2D
  nodeLabel={(node) => {
    const assignees = node.assignees.map(a => a.firstName).join(', ')
    const lastUpdate = new Date(node.updated_at).toLocaleDateString()

    return `
      <div style="background: white; padding: 10px; border-radius: 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.2);">
        <strong>${node.name}</strong><br/>
        <span style="color: #666; font-size: 12px;">
          Owner: ${node.owner || 'Unassigned'}<br/>
          Last update: ${lastUpdate}<br/>
          ${assignees ? `Team: ${assignees}` : ''}
        </span>
      </div>
    `
  }}
  nodePointerAreaPaint={(node, color, ctx) => {
    // Expand hover area for better UX
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.arc(node.x, node.y, getNodeRadius(node) * 1.5, 0, 2 * Math.PI)
    ctx.fill()
  }}
/>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| D3 v3 force layout | D3 v7 force simulation | 2016 (D3 v4) | Modular force composition, separate forces, better performance |
| SVG rendering only | Canvas/WebGL primary | 2018-2020 | 10x performance improvement for large graphs (>1000 nodes) |
| Manual DOM manipulation | React reconciliation | 2020+ (react-force-graph) | Declarative graph updates, automatic re-rendering |
| Global force configuration | Per-force customization | 2016 (D3 v4) | Fine-grained control (different strengths per force type) |

**Deprecated/outdated:**
- **D3 v3 force layout API:** Pre-2016 tutorials use `d3.layout.force()`. Modern: `d3.forceSimulation()`
- **react-force-graph SVG variant:** Still exists but Canvas is now standard for performance
- **forceLink().id() string accessor:** V4+ uses function: `.id(d => d.id)`

## Open Questions

1. **Pulsing animation with static simulation**
   - What we know: Static simulation (warmupTicks + cooldownTime) stops rendering after settle
   - What's unclear: Best pattern for continuous pulsing animation without wasting CPU
   - Recommendation: Implement separate requestAnimationFrame loop that only redraws pulsing nodes, not entire graph. Measure performance impact.

2. **Optimal warmupTicks for team tracker scale**
   - What we know: Calculation exists: `Math.ceil(Math.log(alphaMin) / Math.log(1 - alphaDecay))`
   - What's unclear: Does 100 ticks produce good layout for 5-20 node graphs?
   - Recommendation: Start with 100, adjust based on visual quality. Too few = overlapping nodes, too many = wasted load time.

3. **Team member label positioning algorithm**
   - What we know: Labels should float outside nodes, but Canvas doesn't auto-avoid collisions
   - What's unclear: Should we implement smart positioning or accept occasional overlaps?
   - Recommendation: Start simple (fixed offset below node). If overlaps are problem, implement radial positioning based on neighbor count.

## Sources

### Primary (HIGH confidence)
- [D3 Force Simulation Official Docs](https://d3js.org/d3-force) - API reference, alpha decay, forces
- [D3 Force Simulation Source](https://github.com/d3/d3-force/blob/main/src/simulation.js) - Implementation details
- [react-force-graph Official Docs](https://vasturiano.github.io/react-force-graph/) - API methods, camera control, event handlers
- [react-force-graph GitHub](https://github.com/vasturiano/react-force-graph) - Version 1.29.1, features, examples
- [D3 Zoom Official Docs](https://d3js.org/d3-zoom) - Zoom interpolation, smooth transitions

### Secondary (MEDIUM confidence)
- [D3 Force Layout (D3indepth)](https://www.d3indepth.com/force-layout/) - Force configuration patterns, verified 2025+
- [D3 Zoom and Pan (D3indepth)](https://www.d3indepth.com/zoom-and-pan/) - Zoom behavior implementation
- [How to Implement Force-Directed Graph in 2025 (DEV)](https://dev.to/nigelsilonero/how-to-implement-a-d3js-force-directed-graph-in-2025-5cl1) - Recent tutorial Jan 2026
- [Smooth Zooming (Observable)](https://observablehq.com/@d3/smooth-zooming) - Zoom transition examples
- [Static Force Layout (Katie Schick)](https://kkschick.wordpress.com/2016/04/01/static-and-sticky-force-directed-layout-in-d3/) - Pre-computation pattern
- [Breadcrumbs UX in 2026 (Eleken)](https://www.eleken.co/blog-posts/breadcrumbs-ux) - Location-based breadcrumb patterns
- [React Graph Visualization Guide (Cambridge Intelligence)](https://cambridge-intelligence.com/react-graph-visualization-library/) - React integration best practices 2026
- [CSS Status Indicators with Pulsing (Snippflow)](https://snippflow.com/snippet/css-status-indicators-with-pulsing-animation/) - Pulsing animation patterns

### Tertiary (LOW confidence)
- [D3.js Force Layout Performance Issues (Google Groups)](https://groups.google.com/g/d3-js/c/gzPTH6MgR_Q/m/Rz0KvM4UGQAJ) - Community discussion, anecdotal
- [Large Dataset Filtering Performance (GitHub Gist)](https://gist.github.com/jerrylow/41dc58e78bb76e06c22a8fd7f123fdfd) - User-submitted optimization tips
- [SVG vs Canvas Performance (Visual Cinnamon)](https://www.visualcinnamon.com/2015/11/learnings-from-a-d3-js-addict-on-starting-with-canvas/) - 2015 benchmark, may be outdated

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - react-force-graph-2d is clear industry standard (3000+ stars, active maintenance), d3-force is de facto physics engine
- Architecture: HIGH - Patterns verified from official docs and recent 2025-2026 tutorials, hierarchical state management is standard React pattern
- Pitfalls: MEDIUM-HIGH - Performance cliffs and alpha decay issues verified from official docs and GitHub issues; label collision is inference based on Canvas limitations
- Code examples: HIGH - All examples synthesized from official API docs (vasturiano.github.io, d3js.org) with minor adaptations for project context

**Research date:** 2026-03-02
**Valid until:** ~30 days (D3 ecosystem is stable, react-force-graph updates quarterly but API is stable)

**Notes:**
- Project uses React 19.2.0 + TypeScript 5.9.3 + inline styles for MVP (from package.json and existing components)
- Database schema has companies → projects → sub_units → tasks hierarchy (from database.types.ts)
- Existing components follow pattern: inline styles, type-only imports, Tables<> type helpers (from TaskCard.tsx)
- Team member names available via team_members.name (first name extraction needed for display)
