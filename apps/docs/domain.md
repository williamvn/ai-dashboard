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

  inputTokenPrice: number;
  outputTokenPrice: number;

  latency: Record<TaskLevel, number>;
}
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

  inputTokens: number;
  outputTokens: number;
  totalTokens: number;

  cost: number;
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
  validationScore: number; // 0.0 to 1.0
  validatedLines?: number;
}
```

---

## Derived Metrics

- validationRate
- averageValidationScore
- costPerRun
- costPerValidatedRun
- tokensPerRun
- tokensPerValidatedRun
- spendByAgent