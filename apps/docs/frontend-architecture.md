# Frontend Architecture

## Stack

- React
- Vite
- TypeScript
- Custom CSS
- React Query
- Recharts

---

## Purpose

Build a clean analytics interface for engineering leaders.

The UI should feel fast, credible, and easy to understand.

---

## Folder Structure

src/

- app/
- routes/
- features/
- components/
- services/
- hooks/
- lib/

---

## app/

Application bootstrap:

- providers
- router
- theme
- root shell

---

## routes/

Thin route entry files only.

Examples:

- dashboard
- simulate
- about

Routes compose features but contain little logic.

---

## features/

Business domains.

Examples:

- dashboard/
- organizations/
- simulate/

Each feature may contain:

- components/
- hooks/
- services/
- types.ts

---

## components/

Reusable UI.

### ui/

- Button
- Card
- Table
- Input
- Tabs
- Modal

### layout/

- Sidebar
- Topbar
- AppShell
- PageContainer

---

## Data Fetching

Use React Query for server state.

Examples:

- organizations list
- dashboard metrics
- simulation actions

Prefer feature hooks:

- useOrganizations()
- useDashboardMetrics()
- useSimulation()

---

## Component Principles

- keep components focused
- split large files
- prefer composition
- keep business logic outside presentation
- strong prop typing

---

## UX Expectations

- obvious navigation
- readable tables
- meaningful charts
- responsive layout
- strong empty/loading states

## Anti Patterns

Do not:

- call APIs directly in route files
- duplicate DTOs already defined in shared packages
- create giant page components
- mix unrelated business logic into UI components
- create one-off components when shared primitives exist