# Tech Stack

## Frontend
- React (Vite)
- TypeScript
- Charting library (Recharts)
- State: minimal (React state)

---

## Backend
- NestJS
- TypeScript
- REST API

---

## Monorepo
- Turborepo
- pnpm or npm workspaces

---

## Data Storage
- In-memory only
- No database required

---

## Simulation
- Deterministic pseudo-random generator
- Task-based complexity model (easy / medium / hard)
- Agent-specific performance profiles

---

Time Model:
- all events are timestamped
- aggregation is time-window based (daily, monthly)
- simulation runs over virtual time progression

---

## Key Design Principle
The system prioritizes:
- reproducibility
- extensiblity
- simplicity
- analytics clarity over infrastructure complexity
- event-driven design for analytics consistency