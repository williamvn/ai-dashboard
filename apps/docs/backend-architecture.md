# Backend Architecture

## Stack

- NestJS
- TypeScript
- In-memory storage
- REST API

---

## Purpose

Provide a lightweight analytics backend that simulates ingestion of AI agent activity and exposes fast aggregated metrics.

The backend prioritises:

- clarity
- deterministic behaviour
- strong typing
- fast reads
- interview-appropriate scope

---

## Core Modules

## Organizations Module

Responsibilities:

- return seeded organizations
- return users by organization
- reset organization data

---

## Agents Module

Responsibilities:

- expose seeded agent definitions
- pricing profiles
- token behaviour profiles

---

## Runs Module

Responsibilities:

- receive agent executions
- calculate tokens
- calculate cost
- persist run events in memory
- update aggregates

---

## Validation Module

Responsibilities:

- receive validation feedback
- store validation events
- update quality aggregates

---

## Analytics Module

Responsibilities:

- return precomputed dashboard metrics
- support date filtering
- support organization filtering

---

## Health Module

Responsibilities:

- readiness endpoint
- timestamp response

---

## Storage Model

Use in-memory Maps and arrays only.

Examples:

- organizationsById
- usersByOrganizationId
- runsByOrganizationId
- validationsByRunId
- aggregatesByOrganizationId

All state resets on process restart.

---

## Aggregation Strategy

Metrics are updated during writes.

### Run Write Updates

When a run is created:

- total runs
- total tokens
- total spend
- by-agent counters
- daily buckets
- active users

### Validation Write Updates

When validation is received:

- average validation score
- validation count
- validated lines
- by-agent quality metrics

Reads should avoid scanning raw runs whenever possible.

---

## API Principles

- thin controllers
- validation through DTOs
- business logic in services
- shared contracts from packages/types
- explicit response models

---

## Non Goals

- persistence layer
- auth
- queues
- distributed systems
- production infra complexity