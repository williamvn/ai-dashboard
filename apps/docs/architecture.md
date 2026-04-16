# Architecture

## Overview
The system is an event-driven in-memory analytics platform.

It simulates AI agent usage for an organization over time and aggregates metrics for a dashboard.

---

## Core Entities

### User
{
  id: string;
  organizationId: string;
  name: string;
}

### Organization
{
    id: string;
    name: string;
}

### Agent
```ts
{
  id: string;
  name: string;
  prices: Record<TaskLevel, number>,
  latency: Record<TaskLevel, number>
}
```

### AgentRun
Represent a single execution of an agent.
```ts
{
  id: string;
  userId: string;
  agentId: string;
  taskLevel: "easy" | "medium" | "hard";
  cost: number;
  latency: number;
  generatedLines: number;
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

## APIs

### POST /run-agent
Simulates execution of an AI agent.

Returns:
- runId
 
---

### POST /accept-output

User accepts or rejects output.

Updates:
- acceptance status
- accepted lines (optional)

---

## Simulation Engine
Simulation is executed by generating synthetic users, time windows, and invoking /run-agent repeatedly with varying agents and task levels.

Behavior
- Generates deterministic pseudo-random metrics
- Uses agent profile modifiers
- Uses task complexity multipliers

---

## Aggregation Layer
Aggregations are computed by scanning in-memory arrays grouped by time, userId, and agentId.
Metrics are computed from in-memory events:
	•	Usage metrics → from AgentRun
	•	Cost metrics → from AgentRun
	•	Output metrics → from UserAction + AgentRun

---

## Storage
- in-memory arrays and hash maps only
- No database required