# Architecture

## Overview
The system is an event-driven in-memory analytics platform.

It simulates AI agent usage across multiple engineering organizations and aggregates metrics for a dashboard.

---

## Core Entities

### Organization
```ts
{
  id: string;
  name: string;
}
```

### User
```ts
{
  id: string;
  organizationId: string;
  name: string;
}
```

### Agent
```ts
{
  id: string;
  name: string;
  generatesLines: boolean;
  prices: Record<TaskLevel, number>;
  latency: Record<TaskLevel, number>;
}
```

### AgentRun
Represents a single execution of an agent.
```ts
{
  id: string;
  organizationId: string;
  userId: string;
  agentId: string;
  taskLevel: "easy" | "medium" | "hard";
  cost: number;
  latency: number;
  generatedLines?: number;
  timestamp: number;
}
```

### UserAction
Represents user feedback on a run.
```ts
{
  runId: string;
  accepted: boolean;
  acceptedLines?: number;
}
```

---

## APIs

### POST /run-agent
Records the execution of an AI agent by a user.

Body: `{ userId, agentId, taskLevel, timestamp? }`  
Returns: `{ runId, cost, latency, generatedLines? }`

### POST /accept-output
Records whether the user accepted or rejected an agent's output.

Body: `{ runId, accepted, acceptedLines? }`

### GET /analytics
Returns aggregated dashboard metrics for an organization.

Query params: `organizationId` (required), `from` (YYYY-MM-DD), `to` (YYYY-MM-DD)

### GET /organizations
Returns all seeded organizations.

### GET /organizations/:id/users
Returns all users belonging to an organization.

### DELETE /organizations/:id/data
Clears all runs, actions, and aggregate data for an organization. Used to reset simulation state.

### GET /health
Returns `{ status: "ok", timestamp }`.

---

## Simulation

Simulation is **UI-driven**. The frontend generates synthetic agent runs by calling `POST /run-agent` with explicit `timestamp` values spread across a historical date range. This means simulated data and real data flow through the same code path — the backend has no knowledge of whether a run is synthetic.

The backend seeds five organizations and their engineers on startup, but starts with no run data. The UI controls when and how simulation happens.

---

## Aggregation Layer

Aggregations are computed **on write** like an event-driven pipeline will do, not on read. Every call to `POST /run-agent` or `POST /accept-output` immediately updates pre-computed aggregate structures in memory.

```
OrgAggregate
├── running totals (totalCalls, totalCost, totalAccepted, …)
├── byAgent: Record<agentId, AgentStats>
└── days: Record<YYYY-MM-DD, DayBucket>
         ├── calls, cost, generatedLines
         ├── activeUsers: Set<userId>
         └── byAgent: Record<agentId, AgentStats>
```

`GET /analytics` reads directly from these structures. No run scanning occurs at query time.

---

## Storage
- In-memory Maps and arrays only
- No database required
- All data is lost on process restart
