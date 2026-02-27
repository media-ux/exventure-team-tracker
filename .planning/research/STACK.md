# Technology Stack

**Project:** Ex-Venture Engineering Team Tracker v2
**Researched:** 2026-02-27
**Confidence:** HIGH

## Recommended Stack

### Core Framework

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| React | ^19.2.4 | UI framework | Industry standard, hooks-based architecture, excellent TypeScript support, mature ecosystem |
| TypeScript | ^5.7+ | Type safety | Prevents runtime errors, enhances developer experience, required for complex data flows |
| Vite | ^7.3.1 | Build tool & dev server | 40x faster than CRA, instant HMR, optimized production builds via Rollup, official React support |

**Rationale:** React 19 with TypeScript provides type-safe component development. Vite offers near-instant dev startup and sub-second HMR, critical for iteration speed on complex visualizations.

### Database & Real-time Backend

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Supabase (supabase-js) | ^2.98.0 | Backend-as-a-Service | Real-time subscriptions, auto-generated REST API, Row-Level Security, free tier supports MVP, actively maintained (updated daily) |
| PostgreSQL | 15+ (via Supabase) | Relational database | Supabase-managed, handles complex relationships (projects → sub-units → tasks), supports JSON for flexible metadata |

**Rationale:** Supabase eliminates backend development overhead while providing enterprise-grade real-time capabilities. Postgres Changes feature enables live dashboard updates. RLS ensures secure multi-team data access.

### Data Visualization

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| D3.js | ^7.9.0 | Force-directed graph engine | Industry standard for custom network visualizations, full control over physics simulation, SVG-based allows zoom/pan |
| react-force-graph | ^1.44.4 | React wrapper for D3 force layouts | Production-ready (used by Airbnb), handles canvas/WebGL rendering, supports node dragging and zoom out-of-box |

**Rationale:** D3.js provides low-level control for the "zoomable spiderweb" requirement. React-force-graph reduces boilerplate while maintaining D3's physics engine. Alternative (Recharts) is for charts, not network graphs.

### UI Components & Styling

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Tailwind CSS | ^4.0+ | Utility-first CSS | Rapid UI development, tiny production bundle, consistent design system, pairs with shadcn/ui |
| shadcn/ui | latest | Component library | Copy-paste components (no dependencies), built on Radix UI (accessibility), Tailwind-styled, customizable |
| Radix UI | ^1.1+ (via shadcn) | Headless UI primitives | Best-in-class accessibility, keyboard navigation, ARIA support, unstyled (Tailwind handles styling) |

**Rationale:** shadcn/ui provides production-quality components without lock-in (you own the code). Tailwind enables rapid iteration on "beautiful EX Venture brand theme" requirement. Radix ensures accessibility compliance.

### Slack Integration

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| @slack/bolt | ^4.3.0 | Slack app framework | Official SDK, handles OAuth/tokens/rate-limiting automatically, Events API support, CLI for deployment |
| @slack/web-api | ^7.9.2 | Slack API client | Used by Bolt under the hood, direct API access when needed, TypeScript definitions included |

**Rationale:** Slack Bolt is the official framework (replaces deprecated legacy bots by May 2026). Events API enables message processing. Slack CLI simplifies deployment for users unfamiliar with bot hosting.

### AI/LLM Integration

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| openai | ^4.77.0 | OpenAI API client | Official SDK, TypeScript support, structured outputs via Zod schemas, handles message parsing for Slack bot |
| Zod | ^3.24.1 | Schema validation | Runtime validation matches TypeScript types, integrates with OpenAI structured outputs, form validation via react-hook-form |

**Rationale:** OpenAI Structured Outputs (with Zod schemas) ensures reliable parsing of Slack messages into typed data. Zod provides single source of truth for validation across API, forms, and AI responses.

### State Management & Data Fetching

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Zustand | ^5.0.2 | Client state | Minimal boilerplate (1.16KB), no Provider wrapper, perfect for UI state (filters, selected nodes), outperforms Context API |
| TanStack Query (React Query) | ^5.65.0 | Server state & caching | Smart caching, automatic background refetch, optimistic updates, integrates with Supabase real-time |
| @supabase-cache-helpers/postgrest-react-query | ^1.9.4 | Supabase + React Query glue | Auto-generates query keys, handles real-time subscription cache updates, reduces boilerplate |

**Rationale:** Zustand handles local UI state (selected project, zoom level). TanStack Query manages server state with caching. Supabase Cache Helpers bridge real-time subscriptions → query cache invalidation.

### Form Handling

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| react-hook-form | ^7.54.2 | Form management | Uncontrolled inputs (best performance), built-in TypeScript support, Zod resolver for validation, minimal re-renders |

**Rationale:** React Hook Form with Zod provides type-safe forms with runtime validation. Required for manual data entry (tasks, team assignments) when Slack integration is unavailable.

### Deployment & Infrastructure

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Vercel | N/A (platform) | Hosting & serverless functions | Zero-config deployment, GitHub integration for CI/CD, Serverless Functions for Slack webhooks, free tier sufficient |
| Node.js | 20.19+ LTS | Runtime (Vercel functions) | Vercel requires 20.19+, Slack Bolt runs on Node, matches OpenClaw Mac mini environment |

**Rationale:** Vercel provides one-click deploy with GitHub integration. Serverless Functions (NOT Edge Functions—deprecated in 2026) handle Slack event webhooks. Free tier supports internal team tool usage.

### Development Tools

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| ESLint | ^9+ | Linting | Catch bugs, enforce code style, TypeScript-aware rules, Vite includes config |
| Prettier | ^3.4.2 | Code formatting | Consistent formatting, integrates with ESLint via eslint-config-prettier, auto-format on save |
| Vitest | ^3.0+ | Unit testing | Built by Vite team, instant test startup, same config as Vite, supports React components |

**Rationale:** Modern ESLint (flat config), Prettier (no conflicts), and Vitest (Vite-native) provide quality tooling with minimal setup. Vite scaffolding includes these by default.

## Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| date-fns | ^4.1.0 | Date manipulation | Format timestamps from Slack, display "last updated" in dashboard, lighter than Moment.js |
| clsx | ^2.1.1 | Conditional CSS classes | Combine Tailwind classes dynamically, required by shadcn/ui components |
| tailwind-merge | ^2.6.0 | Merge Tailwind classes | Prevent class conflicts when overriding shadcn/ui styles, pairs with clsx |
| lucide-react | ^0.468.0 | Icons | Consistent icon set, tree-shakeable, used by shadcn/ui, MIT licensed |
| @tanstack/react-virtual | ^3.11.1 | Virtual scrolling | Render large lists efficiently (1000+ tasks), only when needed |

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Build Tool | Vite | Create React App (CRA) | CRA is no longer maintained, 40x slower than Vite, poor HMR performance |
| Build Tool | Vite | Next.js | Overkill for SPA, server-side rendering not needed, adds complexity for internal tool |
| Backend | Supabase | Firebase | Firebase Realtime Database less powerful than Postgres, vendor lock-in, Supabase is open-source |
| Backend | Supabase | Custom Node.js + Socket.io | Requires building auth, real-time, API from scratch, delays MVP by weeks |
| Visualization | D3.js + react-force-graph | Recharts | Recharts is for charts (bar, line), not network graphs, no force-directed layout support |
| Visualization | D3.js + react-force-graph | Visx | More code than react-force-graph (60 lines vs 20 for same graph), steeper learning curve |
| Visualization | D3.js + react-force-graph | Cytoscape.js | Focused on biology networks, heavier bundle, less React-friendly |
| State | Zustand + TanStack Query | Redux Toolkit | Redux overkill for internal tool, more boilerplate, Zustand handles 90% of use cases |
| State | Zustand + TanStack Query | Context API | Poor performance for frequent updates (visualization interactions), no caching |
| Slack SDK | @slack/bolt | Legacy custom bots | Deprecated by Slack (May 2026 sunset), no granular permissions, missing modern features |
| Deployment | Vercel | Netlify | Vercel has better serverless functions support, easier GitHub integration, superior DX |
| Deployment | Vercel | Self-hosted (DigitalOcean) | Requires DevOps setup, SSL management, no auto-scaling, delays launch |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Create React App (CRA) | Unmaintained since 2022, slow build times, poor HMR | Vite (official React docs now recommend Vite) |
| Moment.js | Huge bundle size (68KB), no longer maintained | date-fns (2KB tree-shakeable) or native Temporal API |
| Axios | Unnecessary dependency, Fetch API is native and sufficient | Native fetch() with @supabase/supabase-js |
| Chart.js / ApexCharts | Designed for charts, not network graphs | D3.js + react-force-graph for force-directed layouts |
| Slack legacy bot APIs | Being deprecated May 2026, no modern features | @slack/bolt framework (official SDK) |
| Vercel Edge Functions | Deprecated in favor of Serverless Functions with Fluid compute | Serverless Functions (full Node.js runtime) |
| CSS-in-JS (styled-components, Emotion) | Runtime cost, slower than Tailwind, harder to maintain | Tailwind CSS (build-time, no runtime cost) |
| React 18 or earlier | Missing concurrent features, older TypeScript support | React 19.2+ (latest stable) |

## Installation

```bash
# Core dependencies
npm install react@^19.2.4 react-dom@^19.2.4
npm install @supabase/supabase-js@^2.98.0
npm install d3@^7.9.0 react-force-graph@^1.44.4
npm install zustand@^5.0.2 @tanstack/react-query@^5.65.0
npm install @supabase-cache-helpers/postgrest-react-query@^1.9.4
npm install react-hook-form@^7.54.2 zod@^3.24.1
npm install @hookform/resolvers@^3.9.1
npm install date-fns@^4.1.0 clsx@^2.1.1 tailwind-merge@^2.6.0
npm install lucide-react@^0.468.0

# Slack integration (for Vercel serverless functions)
npm install @slack/bolt@^4.3.0 @slack/web-api@^7.9.2

# AI/LLM (for message parsing)
npm install openai@^4.77.0

# Tailwind + shadcn/ui
npm install tailwindcss@^4.0.0 postcss autoprefixer
npm install @radix-ui/react-* # (individual packages via shadcn/ui CLI)

# Development dependencies
npm install -D vite@^7.3.1 @vitejs/plugin-react@^4.3.4
npm install -D typescript@^5.7.2 @types/react@^19.0.6 @types/react-dom@^19.0.6
npm install -D @types/d3@^7.4.3
npm install -D eslint@^9.18.0 @eslint/js@^9.18.0
npm install -D typescript-eslint@^8.21.0 eslint-plugin-react-hooks@^5.1.0
npm install -D prettier@^3.4.2 eslint-config-prettier@^9.1.0
npm install -D vitest@^3.0.8 @testing-library/react@^16.1.0
npm install -D @tanstack/react-virtual@^3.11.1 # Only if virtual scrolling needed
```

## Stack Patterns by Variant

**If building WITHOUT Slack integration (manual data entry only):**
- Skip @slack/bolt and @slack/web-api
- Skip openai (no message parsing needed)
- Add more react-hook-form forms for task creation
- Use Supabase Auth UI components for faster auth setup

**If building WITHOUT D3.js visualization (table view only):**
- Skip d3 and react-force-graph
- Use @tanstack/react-table for sortable/filterable task lists
- Consider shadcn/ui data-table component
- Simpler but loses key differentiator (zoomable spiderweb)

**If targeting VERY large datasets (10K+ nodes):**
- Replace react-force-graph SVG with Canvas renderer
- Add @tanstack/react-virtual for task lists
- Consider pagination for Supabase queries
- Use Postgres views to pre-aggregate counts

**If requiring offline-first capabilities:**
- Add @supabase/realtime for sync when online
- Use IndexedDB (via Dexie.js) for local storage
- Requires conflict resolution strategy (last-write-wins or operational transforms)

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| React 19.2.4 | Vite 7.3.1 | Vite 7 officially supports React 19 |
| React 19.2.4 | TypeScript 5.7+ | React 19 requires TS 5.7+ for proper JSX typing |
| TanStack Query 5.65.0 | React 19 | Fully compatible, no migration needed |
| Zustand 5.0.2 | React 19 | No breaking changes, uses external store API |
| @supabase/supabase-js 2.98.0 | Node.js 20.19+ | Vercel requires Node 20.19+, Supabase compatible |
| @slack/bolt 4.3.0 | Node.js 20.19+ | Bolt supports Node 18+, 20 LTS recommended |
| openai 4.77.0 | Zod 3.24.1 | OpenAI SDK has built-in Zod support for structured outputs |
| Tailwind 4.0 | shadcn/ui (canary) | shadcn/ui v4 support in canary release, stable soon |
| Vitest 3.0 | Vite 7.3.1 | Vitest 3 is first version supporting Vite 6+, works with Vite 7 |

## Critical Notes

**Slack Bot Deployment:**
- User is unfamiliar with bot deployment — provide step-by-step guide
- Use Slack CLI (`slack create`, `slack run`) for local dev
- Deploy webhooks to Vercel serverless functions (NOT edge functions)
- Set SLACK_BOT_TOKEN and SLACK_SIGNING_SECRET as Vercel env vars

**Supabase Setup:**
- Enable Row-Level Security (RLS) on all tables BEFORE deployment
- Use service role key ONLY in Vercel serverless functions (server-side)
- Use anon key in React app (client-side with RLS)
- Create Postgres functions for complex queries (reduces client-side logic)

**D3.js with React:**
- Use `useRef()` to get DOM node for D3 manipulation
- Let React handle data, D3 handle rendering
- Avoid D3 data binding (`.data()`, `.enter()`, `.exit()`) — use React's rendering
- react-force-graph handles this pattern correctly

**Environment Variables:**
- NEVER use `VITE_` prefix for secrets (exposed to browser)
- Use `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (safe to expose)
- Use Vercel env vars for `SUPABASE_SERVICE_ROLE_KEY`, `SLACK_BOT_TOKEN`, `OPENAI_API_KEY`
- Rotate secrets via Vercel dashboard, not Git commits

**Performance Considerations:**
- Supabase real-time: Use private channels with RLS (not public broadcasts)
- D3 force simulation: Stop simulation after graph stabilizes (saves battery)
- TanStack Query: Set staleTime to reduce refetches during active editing
- Debounce Slack message parsing (avoid OpenAI rate limits)

## Sources

**Official Documentation:**
- [Vite Getting Started](https://vite.dev/guide/) — Vite 7.3.1, verified 2026-02-27
- [D3.js Official Site](https://d3js.org/) — D3.js 7.9.0, verified 2026-02-27
- [Supabase Realtime Docs](https://supabase.com/docs/guides/realtime) — Real-time features, verified 2026-02-27
- [Slack Developer Docs](https://docs.slack.dev/) — Bolt framework recommended, verified 2026-02-27
- [React Official Docs](https://react.dev/) — React 19 features, verified 2026-02-27
- [OpenAI Platform Docs](https://platform.openai.com/docs/quickstart) — OpenAI API best practices, verified 2026-02-27
- [Zod Documentation](https://zod.dev/) — Schema validation, verified 2026-02-27
- [shadcn/ui Installation](https://ui.shadcn.com/docs/installation/vite) — Vite setup guide, verified 2026-02-27

**Community Resources & Comparisons:**
- [How to Set Up a Production-Ready React Project with TypeScript and Vite](https://oneuptime.com/blog/post/2026-01-08-react-typescript-vite-production-setup/view) — MEDIUM confidence
- [Vite: The Complete Guide for 2026](https://devtoolbox.dedyn.io/blog/vite-complete-guide) — MEDIUM confidence
- [How to Implement a D3.js Force-directed Graph in 2025](https://dev.to/nigelsilonero/how-to-implement-a-d3js-force-directed-graph-in-2025-5cl1) — MEDIUM confidence
- [Getting Started with Realtime | Supabase Docs](https://supabase.com/docs/guides/realtime/getting_started) — HIGH confidence (official)
- [Top 10 Slack AI Bot Frameworks for Developers 2026](https://fast.io/resources/top-slack-ai-bot-frameworks/) — LOW confidence (third-party blog)
- [Vercel Edge Functions](https://vercel.com/docs/functions/runtimes/edge/edge-functions.rsc) — HIGH confidence (deprecation notice)
- [State Management in 2026: Redux vs Zustand vs Context API](https://medium.com/@abdurrehman1/state-management-in-2026-redux-vs-zustand-vs-context-api-ad5760bfab0b) — MEDIUM confidence
- [How to Use Supabase with TanStack Query (React Query v5)](https://makerkit.dev/blog/saas/supabase-react-query) — MEDIUM confidence
- [Best React chart libraries (2025 update)](https://blog.logrocket.com/best-react-chart-libraries-2025/) — MEDIUM confidence (D3 alternatives)
- [Slack Bolt for JavaScript](https://github.com/slackapi/bolt-js) — HIGH confidence (official)
- [OpenAI Node.js SDK](https://github.com/openai/openai-node) — HIGH confidence (official)
- [React Hook Form + Zod Guide (2026 Edition)](https://dev.to/marufrahmanlive/react-hook-form-with-zod-complete-guide-for-2026-1em1) — MEDIUM confidence
- [Vercel Security Best Practices (2026 Guide)](https://vibeappscanner.com/best-practices/vercel) — MEDIUM confidence

**NPM Package Versions (verified 2026-02-27):**
- [react on npm](https://www.npmjs.com/package/react) — 19.2.4
- [vite on npm](https://www.npmjs.com/package/vite) — 7.3.1
- [d3 on npm](https://www.npmjs.com/package/d3) — 7.9.0
- [@supabase/supabase-js on npm](https://www.npmjs.com/package/@supabase/supabase-js) — 2.98.0

---
*Stack research for: Ex-Venture Engineering Team Tracker v2*
*Researched: 2026-02-27*
*Confidence: HIGH (all core technologies verified via official docs or npm registry)*
