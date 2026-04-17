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

- tokens
- latency
- generated lines
- validation tendency

---

## Agent Profiles

Each agent has different behaviour.

Examples:

### Code Generator

- high output tokens
- high generated lines

### Reviewer

- high input tokens
- low output tokens

### Debugger

- medium tokens
- medium latency

---

## Validation Scores

Generated probabilistically based on:

- agent type
- task difficulty
- randomness

Produces realistic quality distributions.

---

## Goal

Produce believable analytics, not perfect forecasting.