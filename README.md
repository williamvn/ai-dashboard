# AI Agent Analytics Dashboard

A take-home project for Zencoder.

This platform helps engineering leaders understand how AI agents are used across their organisation, how many tokens they consume, what they cost, and whether they create validated value.

---

## Product Vision

Engineering teams increasingly rely on AI tools for development workflows, yet leadership often lacks visibility into:

- real adoption across teams
- token consumption trends
- cost efficiency
- which agents create value
- productivity signals
- high spend / low quality usage

This project explores how an analytics platform could solve that problem.

---

## Core Features

### Dashboard

Track:

- total runs
- active engineers
- tokens consumed
- estimated spend
- average validation score
- top agents
- usage trends
- cost efficiency

### Simulation

Generate realistic synthetic historical usage across organisations.

Used for scenario modelling and analytics exploration.

### Organisation Switching

Compare usage patterns across multiple seeded organisations.

---

## Architecture

### Monorepo

- apps/web → React frontend
- apps/api → NestJS backend
- apps/docs → project documentation
- packages/types → shared contracts

### Backend Model

The backend uses in-memory storage and on-write aggregation.

Metrics are updated during writes rather than recomputed during reads.

### Frontend Model

Feature-oriented React architecture with reusable components and strong typing.

---

## AI-Assisted Workflow

AI tooling was intentionally used during delivery.

Used for:

- implementation acceleration
- scaffolding
- refactoring
- UI iteration
- code review loops
- alternative solution exploration

Human-owned decisions:

- product direction
- architecture
- tradeoffs
- UX judgement
- final quality bar

---

## Why These Choices

### In-memory storage

Best fit for assignment scope. Keeps focus on product and architecture.

### On-write aggregation

Reflects real analytics systems and keeps dashboard reads fast.

### Shared types

Avoids frontend/backend contract drift.

### Token-based cost model

Makes spend metrics feel realistic and AI-native.

---

## If Extended Further

- persistent storage
- auth / RBAC
- real telemetry ingestion
- anomaly detection
- forecasting
- benchmarking
- team drilldowns
- budget alerts

---

## Run Project

Install dependencies (`npm install`) and run monorepo apps as normal via Turbo (`npm run dev`).