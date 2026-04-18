# Testing Strategy

## Purpose

Give an AI agent a concrete, high-signal plan for generating tests in this repo.

The goal is confidence in the platform's analytics correctness and critical user flows — not coverage vanity. Every test should defend a behaviour a reviewer would care about.

---

## Interview-Scale Priorities

Given limited time, tests must demonstrate engineering judgement. Generate tests in this order — stop when the budget is spent:

1. **Aggregation correctness** — `analytics.service` + `store.service` produce the right totals, buckets, and per-agent slices.
2. **Cost & token derivation** — `cost = inputTokens × inputTokenPrice + outputTokens × outputTokenPrice`, rounded consistently, never stored as a flat rate.
3. **Validation / impact metrics** — acceptance rate, validated lines, `acceptedLineRatio`, `costPerAcceptedRun`.
4. **Simulation behaviour** — runs fall inside the window, task distribution roughly matches weights, `generatedLines` only appears for agents with `generatesLines = true`.
5. **Critical UI flows** — dashboard KPI render, loading/empty/error states, date-range filter, organization switch.

Skip trivial getters, presentational markup, library internals, CSS, and wrapper components with no logic.

---

## Coverage Targets

Coverage is a guardrail, not the goal.

| Surface | Statements | Branches |
|---|---|---|
| Default | 80% | 75% |
| `analytics/`, `store/`, `runs/`, `simulate/` | 90%+ | 85%+ |

A meaningful 80% beats a hollow 95%. Do not generate filler tests to hit a number.

---

## Testing Pyramid

1. **Unit** — pure functions, service methods, aggregation math, hooks
2. **Integration** — NestJS modules wired together against the real in-memory store
3. **E2E smoke** — a handful of Playwright flows that prove the app boots and the dashboard renders

Avoid a broad E2E layer. The in-memory store makes integration tests cheap; prefer those over browser tests for business logic.

---

## Tooling

### Backend (`apps/api`)
- **Jest** for unit + integration
- **Supertest** against a Nest `TestingModule` — no real HTTP server needed

### Frontend (`apps/web`)
- **Vitest** + **@testing-library/react**
- Mock React Query with a fresh `QueryClient` per test; mock `fetch`/service layer, not hooks

### E2E
- **Playwright** — smoke only, against a dev build with a seeded organization

### Shared (`packages/types`)
- No tests needed. Type-only package; `tsc --noEmit` in CI is sufficient.

---

## Backend Testing

### Unit Tests — Aggregation (highest priority)

Target: [apps/api/src/analytics/analytics.service.ts](apps/api/src/analytics/analytics.service.ts), [apps/api/src/store/store.service.ts](apps/api/src/store/store.service.ts)

For each of the four metric groups (`UsageMetrics`, `CostMetrics`, `TokenMetrics`, `ImpactMetrics`), seed a deterministic set of runs + validations and assert the exact shape and values of the computed slice.

**Usage**
- `totalCalls` increments per run
- `callsPerDay[YYYY-MM-DD]` bucketed by run timestamp in the org's time frame
- `callsPerAgent[agentId]` split correctly across multiple agents
- `totalActiveUsers` counts distinct users in window, not all-time
- `adoptionPercentage` = avgDau / totalUsers × 100, clamped 0–100
- `windowDays` matches calendar range when `from`+`to` set, else days-with-activity

**Cost**
- `totalCost` = Σ per-run cost
- `costByAgent` and `costPerDay` partition `totalCost` (Σ slices ≈ total within rounding tolerance)
- `costPerRun` = totalCost / totalCalls; `costPerActiveUser` uses in-window DAU
- `inputCost + outputCost = totalCost` (frozen at write time)
- `allTimeTotalCost` ignores the date window

**Tokens**
- `totalInputTokens + totalOutputTokens = totalTokens`
- `inputTokensByAgent[a] + outputTokensByAgent[a] = tokensByAgent[a]`
- `tokensPerRun` = totalTokens / totalCalls
- `avgTokensPerRunByAgent` uses each agent's own call count as denominator

**Impact** ([packages/types/src/metrics.ts:118-165](packages/types/src/metrics.ts#L118-L165))
- `validationRate = totalValidated / totalCalls`
- `acceptanceRate = totalAccepted / totalValidated` (0 when `totalValidated = 0`, not `NaN`)
- `acceptedLineRatio = totalValidatedLines / acceptedGeneratedLines`
- `costPerAcceptedRun = totalAcceptedCost / totalAccepted`
- `acceptanceRatePerDay[d] = accepted[d] / (accepted[d] + rejected[d])` — no NaN on empty days
- `validatedLines` only contributes when the run's agent has `generatesLines = true`

**Division-by-zero guards** — every ratio must be finite (`Number.isFinite`) when the denominator is 0. This is a single shared test helper applied across all metric objects.

### Unit Tests — Cost Math

Target: cost derivation in the run write path.

- Input-only pricing applied
- Output-only pricing applied
- Total = input + output; rounded to a consistent precision (assert the exact helper used by production code)
- Cost is derived at write time — storing a run with mismatched `cost` vs `tokens × price` should be impossible (the service recomputes)

### Unit Tests — Simulation

Target: [apps/api/src/simulate/](apps/api/src/simulate/) (or wherever the simulator lives)

- All generated run timestamps ∈ [from, to]
- Task-level distribution approximates easy 50% / medium 33% / hard 17% over a large N (tolerance ±5%)
- `inputTokens ∈ [profile.inputMin, profile.inputMax]` for sampled (agent, taskLevel)
- `generatedLines` present iff `agent.generatesLines = true`
- Validation: `validatedLines ≤ generatedLines`, only present when `accepted = true`
- Seeded randomness → reproducible output (inject the RNG)

### Integration Tests

Wire the real `AppModule` into a Nest `TestingModule` and drive it with Supertest.

**Run + Validation flow**
1. `POST /run-agent` with a valid payload
2. `POST /validate-output` with `{ runId, accepted: true, validatedLines: N }`
3. `GET /analytics/impact` — assert `totalAccepted`, `totalValidatedLines`, `acceptanceRate` updated
4. `GET /analytics/cost` — assert `totalCost` includes the run

**Organization reset**
1. Simulate data for org A
2. `DELETE /organizations/:id/data`
3. Analytics endpoints return zeroed metrics for A but untouched metrics for B (isolation)

**Date filter**
1. Seed runs across three distinct days
2. `GET /analytics/usage?from=...&to=...` for each sub-range
3. Assert `callsPerDay` keys, `windowDays`, and totals match the filter

**DTO validation**
- Missing required fields → 400
- Unknown agent/org ids → 404 (or documented error)
- Out-of-range `taskLevel` → 400

### What Not To Unit-Test on the Backend

- Nest controllers that only delegate to a service (integration coverage is enough)
- Seed data shape (type-checked)
- `main.ts`, modules, DI wiring

---

## Frontend Testing

### Component Tests

Target high-information components with branching render logic.

- [useDashboardMetrics](apps/web/src/features/dashboard/hooks/useDashboardMetrics.ts) — loading / success / error / empty
- KPI cards — render numbers with the right formatter (currency, tokens, percent)
- Chart sections — empty state when series is empty; render without crashing on sparse data
- Tables — sorting toggles, pagination, profile-pic fallback for `UserUsageRanking`
- Date-range filter — selecting a range updates the query key and triggers a refetch

Do not snapshot-test presentational markup. Assert on visible text and accessible roles.

### Hook Tests

- `useDashboardMetrics` — given a mocked service response, the hook exposes the right `data`, `isLoading`, `isError`
- `useOrganizations` — cached across mounts within the same `QueryClient`
- `useSimulation` — mutation → invalidates the analytics queries

### Formatters & Pure Lib

Target: [apps/web/src/features/dashboard/lib/format.ts](apps/web/src/features/dashboard/lib/format.ts)

- Currency: 0, small, large, negative, null/undefined
- Tokens: thousands separators, `k`/`M` rollover at documented thresholds
- Percent: 0, 1, NaN, >1 (clamped)
- Dates: stable across timezones (use a fixed TZ in vitest config)

### What Not To Test on the Frontend

- Tailwind/CSS classes
- React Query internals
- Recharts rendering details (we trust the library)
- Route-file wiring

---

## E2E Smoke (Playwright)

Three flows. No more.

1. **Boot** — app loads, landing page shows organizations, selecting one navigates to the dashboard with KPIs visible.
2. **Simulate** — open `/simulate`, run a simulation, return to `/dashboard`, assert KPIs changed.
3. **Date filter** — change the dashboard date range, assert charts refresh (loading spinner → new values).

Run E2E against a freshly-booted API with deterministic seed data.

---

## Test Data Principles

- **Deterministic fixtures** in `apps/api/test/fixtures/` — shared between unit and integration tests
- Seeded RNG for anything random (inject via constructor/DI)
- Stable dates: freeze `Date.now()` via `vi.useFakeTimers()` / `jest.useFakeTimers()`
- Explicit token values in fixtures — never "random enough" in an assertion
- Name scenarios after the behaviour they prove (`acceptanceRate_ignoresUnvalidatedRuns`, not `test1`)

---

## CI Expectations

Every PR runs, in order:

1. `lint`
2. `typecheck` (`tsc --noEmit` across workspaces)
3. backend unit + integration (`jest`)
4. frontend unit (`vitest run`)
5. coverage check against the thresholds above
6. `build` for both apps

E2E runs on `main` and on-demand via a label, not on every PR.

---

## Review Checklist (Before Merging Tests)

- Does the test name describe the behaviour, not the implementation?
- Would this test fail for the right reason if the bug returned?
- Is the fixture the minimum needed, or copy-pasted noise?
- Is there a shared helper duplicated inline?
- Any assertion on `toMatchSnapshot` for logic (not markup)? → delete it.
- Any test that only exists to raise coverage? → delete it.
