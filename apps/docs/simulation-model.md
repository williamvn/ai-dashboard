# Simulation Model

## Purpose

Generate realistic historical activity so the dashboard has meaningful data.

Simulation should feel organic rather than perfectly uniform.

---

## Core Behaviour

The frontend triggers simulation through public APIs.

Synthetic and real usage share the same ingestion path.

---

## Inputs

- organizationId
- from date
- to date
- engineer activity level
- calls per day target

---

## Run Generation

Each engineer has probabilistic activity.

Some engineers are heavier users than others.

Daily calls vary around a configured target.

Example:

actualCalls = random value near target with variance

This avoids flat charts.

---

## Task Levels

Weighted distribution:

- easy: 50%
- medium: 33%
- hard: 17%

Task level influences:

- token volumes
- latency
- generated lines
- validation tendency

---

## Token Generation

Each agent has a `tokenProfile` defining min/max input and output token ranges per task level.

At simulation time, tokens are sampled randomly within those ranges:

```
inputTokens  = random(profile.inputMin,  profile.inputMax)
outputTokens = random(profile.outputMin, profile.outputMax)
totalTokens  = inputTokens + outputTokens
```

Cost is then derived from the agent's per-token prices:

```
cost = (inputTokens × agent.inputTokenPrice) + (outputTokens × agent.outputTokenPrice)
```

Harder tasks produce more tokens and therefore higher cost.

---

## Agent Profiles

Each agent has different token behaviour reflecting its underlying task.

Examples:

### Code Generator

- high output tokens (generates code)
- high generated lines
- moderate input tokens

### Reviewer

- high input tokens (reads code to review)
- low output tokens (produces comments, not code)
- no generated lines

### Debugger

- balanced input/output tokens
- moderate latency
- generates some lines (fixes)

---

## Validation

After each run, the engineer may validate the output.

Validation is binary: the engineer either accepted or rejected the output.

```
accepted = Math.random() < engineerAcceptanceRate
```

If `accepted = true` and the agent generated lines, a `validatedLines` count is sampled:

```
validatedLines = random(1, run.generatedLines)
```

This models partial acceptance — the engineer may keep only some of the generated code.

Acceptance rates vary per engineer and produce realistic quality distributions across the dashboard.

---

## Goal

Produce believable analytics, not perfect forecasting.
