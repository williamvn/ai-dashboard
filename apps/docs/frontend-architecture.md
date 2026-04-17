# Frontend Architecture

Framework: React + Vite + TypeScript

## Core Principles

- Use component-based architecture
- Use feature folders by business domain
- Keep routes/pages thin
- Keep business logic outside UI components
- Reuse shared UI primitives
- Strong typing

---

## Folder Structure

src/
  app/
  routes/
  features/
    dashboard/
    organizations/
    simulate/
    about/
  components/
    ui/
    layout/
  services/
  hooks/
  lib/

---

## Meaning of Folders

### app/

Application bootstrap:

- providers
- router setup
- theme
- root shell

### routes/

Route entry files only.

Examples:

- /landing
- /dashboard
- /simulate
- /about

Routes compose features but contain little logic.

### features/

Business modules.

Each feature may contain:

- components/
- hooks/
- services/
- types.ts

Examples:

features/dashboard/
features/organizations/
features/simulate/

### components/ui/

Reusable primitives:

- Button
- Card
- Table
- Modal
- Input

### components/layout/

Shared layouts:

- Sidebar
- Topbar
- AppShell
- PageContainer

### services/

Shared API/http clients.

### hooks/

Reusable generic hooks.

### lib/

Utilities and helpers.

---

## Data Fetching

Use TanStack Query (React Query) for server state.

Examples:

- dashboard metrics
- organizations list
- simulation requests

Do not fetch directly inside components when avoidable.

Prefer hooks such as:

- useOrganizations()
- useDashboardMetrics()
- useRunSimulation()

---

## Component Rules

- Keep components focused
- Split large files
- Presentational components should receive props
- Avoid deeply nested state
- Prefer composition

---

## Styling Rules

- Consistent spacing
- Clean analytics UI
- Responsive layouts
- Reuse shared components first

---

## Anti Patterns

Do not:

- call APIs directly in route files
- duplicate DTOs already defined in shared packages
- create giant page components
- mix unrelated business logic into UI components
- create one-off components when shared primitives exist