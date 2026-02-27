# Pitfalls Research

**Domain:** Engineering team tracker with Slack integration, D3.js visualization, and distributed AI agent sync
**Researched:** 2026-02-27
**Confidence:** HIGH

## Critical Pitfalls

### Pitfall 1: D3.js Force Graph SVG Element Limit (10k nodes)

**What goes wrong:**
The force-directed graph animation becomes choppy and eventually freezes the browser when rendering more than ~10,000 SVG elements. The bottleneck is SVG rendering, not the force simulation algorithm (O(n log n)). With a hierarchical tracker (company → projects → sub-units → tasks → files), you can hit this limit faster than expected.

**Why it happens:**
Developers underestimate how quickly hierarchical data grows. A company with 5 projects × 4 sub-units × 20 tasks × 5 files = 2,000 nodes just for file-level granularity in a single project. Add team members mapped at every level, and the graph explodes. SVG is fundamentally slower than Canvas for large element counts.

**How to avoid:**
- **Use Canvas rendering for >1,000 nodes**: Canvas-based D3 examples benchmark 10-100x faster than SVG for large graphs
- **Implement progressive disclosure**: Render only the current zoom level (show projects at top level, lazy-load sub-units on zoom, etc.)
- **Set hard limits**: Cap visible nodes at 500-1000 per viewport with culling/virtualization
- **Pre-compute layouts server-side**: For static or slow-changing graphs, compute x/y coordinates on backend and just render positions on frontend

**Warning signs:**
- Browser DevTools shows >50ms frame times during graph updates
- Memory usage steadily increases during force simulation
- Zoom/pan interactions feel sluggish even with alpha=0 (simulation stopped)

**Phase to address:**
Phase 1 (Spiderweb UI). Choose Canvas vs. SVG upfront based on expected scale. Implement progressive disclosure in the initial design to avoid costly rewrites.

---

### Pitfall 2: Supabase Realtime Memory Leaks from Unsubscribed Channels

**What goes wrong:**
Memory usage steadily increases in the browser, eventually causing slowdowns or crashes. The React app subscribes to Realtime channels but doesn't properly unsubscribe when components unmount. Each forgotten subscription maintains an open WebSocket connection and accumulates event handlers.

**Why it happens:**
React's `useEffect` requires explicit cleanup functions, but developers forget to return cleanup or use the wrong pattern. Testing in development with hot-reload masks the issue because subscriptions reset on each reload. The "TooManyChannels" error appears in production when users navigate through the app without page refreshes.

**How to avoid:**
- **Always return cleanup in useEffect**:
  ```javascript
  useEffect(() => {
    const channel = supabase.channel('task-updates')
      .on('postgres_changes', { ... }, handleUpdate)
      .subscribe()

    return () => {
      channel.unsubscribe()
      supabase.removeChannel(channel)
    }
  }, [])
  ```
- **Test with React StrictMode**: Forces double-mounting to catch missing cleanup
- **Monitor channels**: Add logging to track active channel count
- **Use a single channel per connection scope**: Subscribe at app root, not in every component

**Warning signs:**
- Browser memory usage increases over time (check DevTools Memory profiler)
- Console errors: "TooManyChannels" or "Channel already subscribed"
- Network tab shows multiple WebSocket connections to same endpoint
- Supabase dashboard shows connection count spike

**Phase to address:**
Phase 2 (Supabase Setup). Establish cleanup patterns immediately. Write a custom hook (`useRealtimeSubscription`) with guaranteed cleanup built-in.

---

### Pitfall 3: Slack Bot Rate Limit Cascade (1 req/min for conversations.history on non-Marketplace apps)

**What goes wrong:**
Starting March 3, 2026, non-Marketplace Slack apps are limited to **1 request per minute** for `conversations.history` and `conversations.replies`. If the bot tries to backfill message history or catch up after downtime, it hits 429 errors immediately. Without exponential backoff, the bot enters a retry storm, gets disconnected, or misses critical messages.

**Why it happens:**
Developers test with small teams and low message volume, missing the rate limit. The bot architecture processes messages synchronously instead of queuing them. When the bot restarts, it tries to fetch all missed messages at once. The new 2026 limits are drastically lower than previous tiers (20+ req/min for Tier 2).

**How to avoid:**
- **Use Events API instead of polling**: Real-time push eliminates need for `conversations.history` in normal operation
- **Implement request queue with rate limiting**: Use a queue (Bull, BullMQ) with delay matching `retry-after` header
- **Handle 429 properly**: Parse `retry-after` header and pause queue for specified duration
- **Avoid backfilling on startup**: Store cursor/timestamp, only fetch messages since last processed
- **Consider Marketplace approval**: If you need higher limits, submit app for Marketplace approval

**Warning signs:**
- Console logs show HTTP 429 responses
- Slack shows "some messages from your app are not being displayed"
- Events API sends `app_rate_limited` notification (caps at 30k events/workspace/hour)
- Bot appears to "miss" messages during high activity

**Phase to address:**
Phase 3 (Slack Bot). Design queue-first architecture from the start. Never make synchronous API calls from event handlers.

---

### Pitfall 4: Webhook Idempotency Missing (Duplicate Task Creation)

**What goes wrong:**
Slack sends the same event multiple times (retries after timeout, network issues). Without idempotency, the tracker creates duplicate tasks, double-counts progress, and pollutes the database. Users see the same update appear 2-3 times in the spiderweb.

**Why it happens:**
Developers assume webhooks fire exactly once. Slack retries failed webhooks with exponential backoff. If the handler takes >3 seconds to respond with 200 OK, Slack assumes failure and retries. Timeout occurs because the handler does synchronous work (database writes, LLM parsing) before acknowledging.

**How to avoid:**
- **Acknowledge immediately (< 200ms)**: Return 200 OK first, then process asynchronously
- **Use idempotency keys**: Every event has a unique `event_id`. Store first-seen IDs in Redis/Postgres with TTL
  ```javascript
  const eventId = event.event_id
  const exists = await redis.get(`slack:event:${eventId}`)
  if (exists) return res.sendStatus(200) // Already processed

  await redis.setex(`slack:event:${eventId}`, 3600, '1') // 1-hour TTL
  // ... process event
  ```
- **Queue-first pattern**: Webhook writes to queue, worker processes with idempotency check
- **Database constraints**: Use unique constraints on natural keys (`slack_message_id`, `event_id`)

**Warning signs:**
- Duplicate entries in database with identical content but different IDs
- Users report "I only posted once but it appears twice"
- Logs show same `event_id` processed multiple times
- Webhook receives multiple POSTs with identical payload

**Phase to address:**
Phase 3 (Slack Bot). Implement idempotency from day one. Retrofit is risky—duplicates may already exist in production data.

---

### Pitfall 5: D3.js Zoom Transform Order Breaks Centering

**What goes wrong:**
Programmatic zoom (center on node, zoom to project) doesn't work correctly. Calling `d3.zoomIdentity.scale(k).translate(x, y)` centers on the wrong point, while `d3.zoomIdentity.translate(x, y).scale(k)` works. The order of transform operations is non-commutative, but the API doesn't make this obvious.

**Why it happens:**
Matrix transformation order matters: translate-then-scale applies translation first (at scale 1), then scales the result. Scale-then-translate scales first, then translates at the scaled coordinate space. Most tutorials use `translate().scale()` without explaining why.

**How to avoid:**
- **Always use `translate().scale()` for centering**: This is the correct order for zoom-to-point
- **Respect `translateExtent` in code**: `d3.zoomIdentity` transforms bypass `translateExtent` constraints—manually clamp values
- **Use `zoom.transform()` with transitions**:
  ```javascript
  svg.transition()
    .duration(750)
    .call(zoom.transform, d3.zoomIdentity.translate(x, y).scale(k))
  ```
- **Test edge cases**: Zoom to min/max scale, zoom to corners/edges

**Warning signs:**
- "Center on node" feature zooms but centers on wrong point
- Zoom levels work but pan positions are incorrect
- Centering works at scale=1 but breaks at other zoom levels

**Phase to address:**
Phase 1 (Spiderweb UI). Document transform order in code comments. Create helper function `zoomToNode(node)` that encapsulates correct order.

---

### Pitfall 6: LLM Structured Extraction Degrades with Input Quality

**What goes wrong:**
The Slack bot uses an LLM to parse messages into structured task data (assignee, deadline, priority). Parsing works in tests but fails in production. The bot misses tasks, assigns to wrong people, or extracts nonsense dates. Accuracy degrades from 95% in testing to 60% in production.

**Why it happens:**
Training/test data is clean (grammar, formatting, explicit structure). Real Slack messages are messy: typos, abbreviations, emoji, thread context missing, ambiguous pronouns ("can you do this?"), implicit assignments ("Miguel's thing"). LLMs hallucinate when uncertain—inventing assignees or dates that don't exist in the message.

**How to avoid:**
- **Use OpenAI Structured Outputs with `strict: true`**: Guarantees schema compliance, reduces hallucination
- **Handle refusals gracefully**: Check `message.refusal` field—model may refuse ambiguous inputs
- **Provide conversation context**: Pass 3-5 previous messages for pronoun/reference resolution
- **Validate extracted data**: Cross-reference assignees with known team members, validate date formats
- **Fall back to keyword extraction**: For low-confidence parses, use regex/keywords instead of LLM
- **Show confidence scores**: Let users confirm/reject ambiguous parses in UI

**Warning signs:**
- Tasks created with non-existent assignees ("John" when no John on team)
- Dates extracted as "2025" when message says "next week"
- High variance in parsing accuracy across different message styles
- Users frequently edit bot-created tasks immediately after creation

**Phase to address:**
Phase 3 (Slack Bot). Build validation pipeline around LLM extraction. Log low-confidence parses for manual review.

---

### Pitfall 7: Row Level Security (RLS) Testing in SQL Editor Gives False Confidence

**What goes wrong:**
Developer writes RLS policies in Supabase, tests queries in the SQL Editor, sees all data correctly, assumes policies work. Deploys to production. Users see nothing—every query returns empty results. The RLS policies have a bug, but SQL Editor never revealed it because it runs as `postgres` role and **bypasses all RLS policies**.

**Why it happens:**
Supabase SQL Editor uses the `postgres` superuser role for convenience. RLS doesn't apply to superusers. Developers test CRUD operations as superuser, never as the `authenticated` or `anon` roles that real users have.

**How to avoid:**
- **Test RLS with actual roles**: Create test users, authenticate as them via API, run queries
- **Use Supabase Test Suite**: Run integration tests that authenticate and perform operations
- **Check policy coverage**: Every table should have policies for INSERT, SELECT, UPDATE, DELETE for each role
- **Enable RLS on all tables**: Add this to migration scripts:
  ```sql
  ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
  ALTER TABLE tasks FORCE ROW LEVEL SECURITY; -- Even owners obey RLS
  ```
- **Create indexes on policy columns**: Missing indexes on `user_id`, `team_id` cause performance issues

**Warning signs:**
- Queries work in SQL Editor but fail in app with empty results
- Console errors: "new row violates row-level security policy"
- Users report "I can't see any data" immediately after RLS enabled
- Database dashboard shows queries succeeding but returning 0 rows

**Phase to address:**
Phase 2 (Supabase Setup). Write RLS policies before frontend connects to database. Test with throwaway authenticated users.

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Use localStorage instead of Supabase for spiderweb state (zoom level, filters) | No backend setup, instant persistence | State not shared across devices/users; lost on cache clear; no analytics on user behavior | Prototype/demo only, never production |
| Skip webhook signature verification | Faster development, one less thing to configure | Anyone can POST fake events to your endpoint, creating bogus tasks | Never acceptable—5 lines of code to verify |
| Process Slack events synchronously in webhook handler | Simple code flow, easy to debug | Webhooks timeout (>3s), Slack retries, creates duplicates; blocks other events | Never acceptable—use queue from day one |
| Use `any` or loose TypeScript types for LLM extraction schemas | Less TypeScript wrestling, faster iteration | Runtime errors from unexpected data shapes; no autocomplete; hard to refactor | Early experiments only; tighten before production |
| Store OpenClaw agent state in flat files (CONTEXT.md) instead of Supabase | No schema design, easy to read/edit manually | No queries, search, or joins; file conflicts on concurrent writes; no real-time sync | Acceptable for single-agent prototype; must migrate for multi-agent sync |
| Poll Supabase every 10s instead of using Realtime subscriptions | Simpler code, no WebSocket management | Wastes database resources; delayed updates; doesn't scale past 10 users | Acceptable for MVP if <10 users and <100 polls/minute |

---

## Integration Gotchas

Common mistakes when connecting to external services.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| **Slack Events API** | Responding after processing event (3+ seconds) | Respond with 200 OK within 200ms, queue event for async processing |
| **Slack Bot Token** | Using Bot User OAuth Token for all API calls | Use Bot Token for most calls, User Token for user-scoped actions like reactions |
| **Supabase Realtime** | Subscribing to `postgres_changes` on whole table | Subscribe to specific columns or filters: `.on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'tasks', filter: 'team_id=eq.123' })` |
| **Supabase Auth** | Storing JWT in localStorage | Use Supabase client's built-in session management (`supabase.auth.getSession()`) which handles refresh tokens |
| **D3.js Force Simulation** | Restarting simulation on every data change | Set `alphaTarget(0.3)` during updates, return to `0` when done—avoids jarring restarts |
| **OpenAI Structured Outputs** | Assuming JSON is always returned | Check `message.refusal` first—model may refuse unsafe/ambiguous requests |
| **Vercel Edge Functions** | Running heavy computation in Edge Function | Edge Functions have 25ms CPU limit; use serverless functions (10-60s timeout) for webhooks/LLM calls |

---

## Performance Traps

Patterns that work at small scale but fail as usage grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Fetching all tasks on page load | Initial load is slow; browser freezes rendering 1000+ DOM nodes | Paginate or virtualize list; lazy-load on scroll | >500 tasks or >2MB response |
| No indexes on Supabase RLS policy columns | Queries slow down over time; database CPU spikes | Add indexes on `user_id`, `team_id`, `project_id` used in `WHERE` clauses | >10k rows or >50 queries/sec |
| Force simulation runs continuously | Browser uses 100% CPU even when graph is idle | Stop simulation when `alpha < alphaMin`; only reheat on drag/zoom | Always—wastes battery, causes fan noise |
| Subscribing to Realtime at component level | Memory leaks; "TooManyChannels" errors | Subscribe at app root, broadcast updates via React Context | >10 subscriptions or after 10+ navigation cycles |
| Storing full conversation history in webhook payload | Payloads grow to MB size; timeouts; database bloat | Store only last 5 messages; reference older messages by ID | Threads >50 messages or >1MB payload |
| No connection pooling for database | "Too many connections" errors under load | Use Supabase connection pooler (transaction mode for short queries) | >50 concurrent users |
| Rendering all graph nodes even when off-screen | Pan/zoom is laggy; memory usage grows | Cull nodes outside viewport bounds; only render visible nodes | >1000 nodes or >4MB DOM |

---

## Security Mistakes

Domain-specific security issues beyond general web security.

| Mistake | Risk | Prevention |
|---------|------|------------|
| **Forgetting to enable RLS on new tables** | All data publicly accessible via Supabase API, including internal metrics | Add `ENABLE ROW LEVEL SECURITY` to all table creation scripts; audit tables monthly |
| **Using same Supabase service role key in frontend and backend** | Service role bypasses RLS; leaked in browser bundle = full database access | Frontend uses `anon` key only; service role only on backend/Edge Functions |
| **No Slack webhook signature verification** | Attackers POST fake events, create bogus tasks, spam team | Verify `X-Slack-Signature` header using signing secret (5 lines of code) |
| **Storing OpenClaw agent credentials in public GitHub repo** | API keys leaked; unauthorized access to team data and LLM accounts | Use `.env` files with `.gitignore`; rotate keys if exposed; use Vercel env vars |
| **Allowing arbitrary LLM prompts from Slack** | Users could inject prompts that leak system instructions or create malicious tasks | Sanitize input; use structured schemas; validate extracted data against whitelist |
| **No rate limiting on webhook endpoints** | DDoS via spam requests; database overload | Use Vercel rate limiting (100 req/min per IP); queue requests |
| **Assuming internal tools don't need auth** | "It's internal" mentality; anyone on network can access | Require Supabase auth with email/password or SSO; expire sessions |

---

## UX Pitfalls

Common user experience mistakes in this domain.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| **Showing all projects/tasks in graph at once** | Information overload; can't find what they need | Progressive disclosure: zoom from high-level to detail; search/filter |
| **No loading states during LLM parsing** | Users repost messages thinking bot didn't work | Show "Parsing..." message in Slack; post update when task created |
| **Outdated dashboard data (cache too aggressive)** | Users make decisions on stale data; lose trust | Show "Last updated X ago"; refresh every 30s or use Realtime |
| **Graph nodes overlap/unreadable labels** | Can't tell who's assigned to what | Use collision detection; abbreviate labels; show full text on hover |
| **No visual feedback during zoom/pan** | Feels laggy; users don't know if interaction registered | Smooth transitions (750ms); show zoom level indicator |
| **Task appears in multiple places on graph** | Confusion about "source of truth" | Show task in one canonical location; fade in other mentions |
| **No way to undo bot-created tasks** | Users stuck with incorrect parses; manual cleanup | Add "Undo" button in Slack; allow edit/delete in UI within 5 min |
| **Graph resets zoom on data update** | Jarring; users lose context | Maintain zoom/pan transform during updates; only reset on explicit "Fit All" |
| **No indication of real-time updates** | Users don't know data is live; refresh page unnecessarily | Subtle animation on updated nodes; "Live" indicator in header |
| **Mobile users see desktop graph layout** | Pinch-zoom conflicts with graph; tiny labels | Responsive layout: list view on mobile, graph on desktop |

---

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **Force graph visualization**: Often missing zoom extent limits—verify users can't zoom infinitely in/out causing NaN coordinates
- [ ] **Slack bot**: Often missing retry logic on API failures—verify 429/500 responses trigger exponential backoff, not infinite retries
- [ ] **Supabase Realtime**: Often missing subscription cleanup—verify `useEffect` returns cleanup that calls `unsubscribe()` and `removeChannel()`
- [ ] **LLM task extraction**: Often missing validation—verify extracted assignees exist in team, dates are valid, required fields present
- [ ] **Webhook endpoints**: Often missing signature verification—verify `X-Slack-Signature` checked before processing
- [ ] **Row Level Security**: Often missing on new tables—verify `ENABLE ROW LEVEL SECURITY` and policies exist for all CRUD operations
- [ ] **Database queries**: Often missing indexes—verify `EXPLAIN ANALYZE` shows index usage on `WHERE` clause columns
- [ ] **Error boundaries**: Often missing in React tree—verify crashes in graph component don't crash entire app
- [ ] **Loading states**: Often missing for async operations—verify spinners/skeletons shown during LLM parsing, data fetching
- [ ] **Optimistic updates**: Often missing rollback—verify failed mutations revert UI state, not just show error toast

---

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| **Hit 10k SVG element limit** | MEDIUM | 1. Switch to Canvas renderer (d3-force works with both); 2. Implement viewport culling; 3. Add level-of-detail (show fewer nodes when zoomed out) |
| **Memory leak from forgotten Realtime subscriptions** | LOW | 1. Add subscription tracker (Set of channel IDs); 2. Unsubscribe all on unmount; 3. Enable React StrictMode to catch future issues |
| **Rate limited by Slack API** | LOW | 1. Implement queue with retry-after handling; 2. Reduce polling frequency; 3. Use Events API instead of `conversations.history` |
| **Duplicate tasks from missing idempotency** | MEDIUM | 1. Add unique constraint on `slack_message_id`; 2. Dedupe existing data with SQL; 3. Implement idempotency keys going forward |
| **RLS policies block all access** | LOW | 1. Check policies as correct role (not postgres); 2. Add SELECT policy for `authenticated` role; 3. Test with actual auth tokens |
| **LLM extracts wrong data** | MEDIUM | 1. Add validation layer (check assignees, dates); 2. Log low-confidence parses; 3. Add human-in-the-loop review; 4. Fine-tune prompts with examples |
| **Zoom transform breaks centering** | LOW | 1. Swap to `translate().scale()` order; 2. Create helper function; 3. Add test cases for zoom-to-node |
| **Vercel Edge Function timeout** | LOW | 1. Move webhook processing to serverless function; 2. Use Edge Function only for signature verification + queueing |
| **Forgot to enable RLS on table** | HIGH | 1. Enable RLS immediately; 2. Audit who accessed data; 3. Notify team if sensitive data exposed; 4. Add table creation checklist |

---

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| SVG element limit | Phase 1 (Spiderweb UI) | Load test with 10k nodes; measure frame rate (should be >30 FPS) |
| Realtime memory leaks | Phase 2 (Supabase Setup) | Run app for 1 hour with navigation; check memory doesn't grow >10MB |
| Slack rate limits | Phase 3 (Slack Bot) | Simulate 100 messages in 1 minute; verify 429 responses handled gracefully |
| Webhook idempotency | Phase 3 (Slack Bot) | Send duplicate event; verify only one task created |
| Zoom transform order | Phase 1 (Spiderweb UI) | Test "center on node" at scale 0.5x, 1x, 2x; all should center correctly |
| LLM extraction accuracy | Phase 3 (Slack Bot) | Test with 50 real Slack messages; verify >90% accuracy for assignee, date |
| RLS testing blind spot | Phase 2 (Supabase Setup) | Authenticate as test user; perform CRUD operations; verify policies work |
| Missing webhook signatures | Phase 3 (Slack Bot) | Send unsigned POST to endpoint; verify rejected with 401 |
| No indexes on RLS columns | Phase 2 (Supabase Setup) | Run `EXPLAIN ANALYZE` on common queries; verify index scans |
| Edge Function timeout | Phase 3 (Slack Bot) | Send webhook that triggers 5s LLM call; verify doesn't timeout |

---

## Sources

### D3.js Performance & Zoom
- [D3 Force-Directed Graph Performance Discussion](https://groups.google.com/g/d3-js/c/gzPTH6MgR_Q/m/Rz0KvM4UGQAJ)
- [D3-Force Directed Graph Layout Optimization](https://dzone.com/articles/d3-force-directed-graph-layout-optimization-in-neb)
- [D3 Force Layout Node/Link Limits](https://groups.google.com/g/d3-js/c/nwf_Jafk_E8)
- [D3 Zoom — The Missing Manual](https://www.freecodecamp.org/news/get-ready-to-zoom-and-pan-like-a-pro-after-reading-this-in-depth-tutorial-5d963b0a153e/)
- [D3.js zoom.transform() Documentation](https://www.geeksforgeeks.org/d3-js-zoom-transform-function/)
- [D3 Zoom Transform Order Issues](https://github.com/d3/d3-zoom/issues/95)
- [Force-based Label Placement](https://gist.github.com/MoritzStefaner/1377729)
- [D3 Force Simulations Documentation](https://d3js.org/d3-force/simulation)
- [Forcing Functions: Inside D3.v4 Forces](https://stamen.com/forcing-functions-inside-d3-v4-forces-and-layout-transitions-f3e89ee02d12/)

### Slack API & Rate Limits
- [Slack Rate Limits Documentation](https://docs.slack.dev/apis/web-api/rate-limits/)
- [Rate Limit Changes for Non-Marketplace Apps (2026)](https://docs.slack.dev/changelog/2025/05/29/rate-limit-changes-for-non-marketplace-apps/)
- [Handling Rate Limits with Slack APIs](https://medium.com/slack-developer-blog/handling-rate-limits-with-slacks-apis-f6f8a63bdbdc)
- [Slack Message Parser Limitations](https://pocka.github.io/slack-message-parser/)
- [Retrieving Messages from Slack](https://docs.slack.dev/messaging/retrieving-messages/)

### Supabase Realtime & Security
- [Supabase Realtime Client-Side Memory Leak](https://drdroid.io/stack-diagnosis/supabase-realtime-client-side-memory-leak)
- [Supabase Realtime Troubleshooting](https://supabase.com/docs/guides/realtime/troubleshooting)
- [Supabase RLS Complete Guide (2026)](https://designrevision.com/blog/supabase-row-level-security)
- [Postgres RLS Implementation Guide - Common Pitfalls](https://www.permit.io/blog/postgres-rls-implementation-guide)
- [Multi-Tenant Leakage: When RLS Fails](https://medium.com/@instatunnel/multi-tenant-leakage-when-row-level-security-fails-in-saas-da25f40c788c)
- [Row-Level Security for Multi-Tenant SaaS (2026)](https://www.techbuddies.io/2026/02/04/how-to-implement-postgresql-row-level-security-for-multi-tenant-saas-2/)

### Webhooks & Idempotency
- [Node.js Webhooks: Idempotency Patterns (2026)](https://medium.com/@Quaxel/node-js-webhooks-idempotency-patterns-that-save-you-769ae4bb4ebc)
- [How to Implement Webhook Retry Logic](https://latenode.com/blog/integration-api-management/webhook-setup-configuration/how-to-implement-webhook-retry-logic)
- [Handling Payment Webhooks Reliably](https://medium.com/@sohail_saifii/handling-payment-webhooks-reliably-idempotency-retries-validation-69b762720bf5)
- [Top 7 Webhook Reliability Tricks for Idempotency](https://medium.com/@kaushalsinh73/top-7-webhook-reliability-tricks-for-idempotency-a098f3ef5809)

### LLM Structured Outputs
- [LLMs for Structured Data Extraction (2026)](https://unstract.com/blog/comparing-approaches-for-using-llms-for-structured-data-extraction-from-pdfs/)
- [LLMStructBench: Benchmarking LLM Structured Data Extraction](https://arxiv.org/abs/2602.14743)
- [OpenAI Structured Outputs Documentation](https://platform.openai.com/docs/guides/structured-outputs)
- [Structured Output AI Reliability Guide (2025)](https://www.cognitivetoday.com/2025/10/structured-output-ai-reliability/)
- [OpenAI Function Calling Documentation](https://platform.openai.com/docs/guides/function-calling)

### Performance & Scaling
- [React useEffect Cleanup for Memory Leaks](https://blog.logrocket.com/understanding-react-useeffect-cleanup-function/)
- [Preventing Memory Leaks in React with useEffect](https://www.c-sharpcorner.com/article/preventing-memory-leaks-in-react-with-useeffect-hooks/)
- [WebSocket Connection Pool Management (2026)](https://oneuptime.com/blog/post/2026-01-24-websocket-connection-pooling/view)
- [How to Scale WebSocket Connections](https://oneuptime.com/blog/post/2026-01-26-websocket-scaling/view)
- [WebSockets at Scale - Production Architecture](https://websocket.org/guides/websockets-at-scale/)
- [Vercel Functions Timeout Limits](https://vercel.com/docs/functions/limitations)
- [Vercel Edge Function Timeout Documentation](https://vercel.com/docs/errors/EDGE_FUNCTION_INVOCATION_TIMEOUT)

### Security & Auth
- [Security Mistakes Businesses Need to Fix (2026)](https://abc17news.com/news/2025/12/02/the-6-security-mistakes-businesses-need-to-fix-before-2026/)
- [Why Security Basics Still Being Missed (2026)](https://securityboulevard.com/2026/02/its-2026-why-are-the-basics-still-being-missed/)
- [Identity Security Predictions for 2026](https://solutionsreview.com/identity-management/identity-security-predictions-from-industry-experts-for-2026-and-beyond/)

### UX & Dashboard Design
- [Bad Dashboard Examples: Common Mistakes](https://databox.com/bad-dashboard-examples)
- [Dashboard Design Principles for 2025](https://www.uxpin.com/studio/blog/dashboard-design-principles/)
- [UX Strategies For Real-Time Dashboards](https://www.smashingmagazine.com/2025/09/ux-strategies-real-time-dashboards/)
- [Dashboard UI Design Guide 2026](https://www.designstudiouiux.com/blog/dashboard-ui-design-guide/)

### Distributed Systems
- [Eventual Consistency Conflict Resolution](https://davewentzel.com/content/handling-conflicts-with-eventual-consistency-and-distributed-systems/)
- [Consistency Patterns in Distributed Systems](https://www.designgurus.io/blog/consistency-patterns-distributed-systems)
- [Strong vs Eventual Consistency](https://blog.levelupcoding.com/p/strong-vs-eventual-consistency)

---
*Pitfalls research for: Ex-Venture Engineering Team Tracker v2*
*Researched: 2026-02-27*
