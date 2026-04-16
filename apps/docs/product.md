# AI Agent Analytics Dashboard

## Overview
We are building an analytics dashboard for engineering leaders to understand how AI agents are used across their organization.

The system simulates usage of cloud-based AI agents used by engineers to assist with software development tasks.

---

## Target Users
- Head of Engineering
- Engineering Managers
- Tech Leads

---

## Core Problems
- Lack of visibility into AI agent usage
- Unclear cost of AI-assisted development
- No understanding of productivity impact

---

## Key Concepts

### Agent
A predefined AI-powered workflow that performs a specific engineering task.

Examples:
- Refactor Code Agent
- Test Generation Agent
- Debugging Agent
- API Generation Agent
- Code Reviewer

### Run
A single execution of an agent by a user.

### Acceptance
A user signal indicating that the output was useful.

---

## Core Metrics

### Usage & Adoption
- Calls per day
- DAU
- Adoption rate (% of engineers using agents daily)

### Cost
- Total cost
- Cost per agent
- Cost per call
- Cost per day

### Output & Value
- Accepted outputs
- Rejected outputs
- Acceptance rate
- Generated outputs (e.g. lines of code for code agents)

---

## Non-Goals
- No real AI integrations required
- No production persistence layer required
- No infra reliability metrics