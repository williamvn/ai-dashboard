# Project Overview

## Purpose

Build an analytics platform for engineering leaders to understand organizational use of AI agents.

The platform answers five core questions:

1. How widely are AI agents adopted?
2. How many tokens are consumed?
3. What is the estimated cost?
4. Which agents produce accepted output?
5. How is behaviour changing over time?

---

## Primary Users

- CTO
- Head of Engineering
- Engineering Managers
- Tech Leads

---

## Core Concepts

### Agent

A predefined AI workflow used by engineers.

Examples:

- code generation
- debugging
- test generation
- refactoring
- review assistance

### Run

A single execution of an agent.

### Tokens

Primary unit of AI consumption.

Includes:

- input tokens
- output tokens
- total tokens

Cost is derived from token counts multiplied by the agent's per-token prices.

### Validation

A user quality signal indicating whether the output was accepted.

Binary: `accepted = true | false`.

When the agent generated lines, the engineer may also report how many lines they actually kept (`validatedLines`).

---

## Main Product Areas

### Dashboard

Operational analytics across usage, spend, and value.

### Simulation

Generate realistic synthetic historical usage data.

### Organization Selection

Switch between seeded organizations.

---

## Product Principles

- clarity over decoration
- metrics over fluff
- fast navigation
- professional tone
- dense but readable data
- obvious interactions
