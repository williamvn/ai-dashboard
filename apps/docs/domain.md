# Domain Model

## Organization
```ts
{
  id: string;
  name: string;
}
```

---

## User
```ts
{
  id: string;
  organizationId: string;
  name: string;
}
```

--- 

## Agent
```ts
{
  id: string;
  name: string;
  generatesLines: boolean;

  inputTokenPrice: number;   // USD per input token
  outputTokenPrice: number;  // USD per output token

  tokenProfile: Record<TaskLevel, TokenRange>;
  latency: Record<TaskLevel, number>;
}
```

Where `TokenRange` describes realistic token volumes for that agent at each task level:
```ts
{
  inputMin: number;
  inputMax: number;
  outputMin: number;
  outputMax: number;
}
```

Cost is always derived — never stored as a flat rate:
```
cost = (inputTokens × inputTokenPrice) + (outputTokens × outputTokenPrice)
```

---

## AgentRun
Represents one execution of an AI agent
```ts
{
  id: string;

  organizationId: string;
  userId: string;
  agentId: string;
  taskLevel: TaskLevel;

  inputTokens: number;
  outputTokens: number;
  totalTokens: number;

  cost: number;    // derived at write time from tokens × price
  latency: number;

  generatedLines?: number;

  timestamp: number;
}
```

---

## ValidationEvent
Represents user-reported usefulness of an output.
```ts
{
  runId: string;
  accepted: boolean;
  validatedLines?: number;  // how many generated lines the engineer actually kept
}
```

`validatedLines` is only meaningful when `accepted = true` and the run produced `generatedLines`.

---

## Derived Metrics

- validationRate             — % of runs that received a ValidationEvent
- acceptanceRate             — % of validated runs where accepted = true
- averageAcceptedLineRatio   — mean(validatedLines / generatedLines) across accepted runs
- costPerRun
- costPerAcceptedRun
- tokensPerRun
- tokensPerAcceptedRun
- totalInputTokens
- totalOutputTokens
- spendByAgent
