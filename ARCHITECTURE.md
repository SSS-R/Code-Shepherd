# Architecture: AgentOps

## System Overview

AgentOps is a monorepo-based agent orchestration platform with crash-resilient workflow execution.

## Components

```
┌─────────────────────────────────────────────────────────────┐
│                      AgentOps Monorepo                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │    relay     │  │      ui      │  │     sdk      │       │
│  │  (Express)   │  │   (React)    │  │  (Agent)     │       │
│  └──────┬───────┘  └──────────────┘  └──────────────┘       │
│         │                                                   │
│  ┌──────┴───────┐                                           │
│  │    shared    │                                           │
│  │   (Types)    │                                           │
│  └──────────────┘                                           │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow

1. **Agent connects** → SDK registers with relay server
2. **Relay server** → Stores agent in SQLite, creates Temporal workflow
3. **Temporal worker** → Executes workflow, calls activities
4. **UI** → Queries relay server for agent status

## Security Considerations

- Agent authentication required (TBD)
- SQLite file gitignored (sensitive data)
- Temporal connection localhost only (TBD for production)

## Scalability Notes

- SQLite can be upgraded to PostgreSQL
- Temporal.io supports distributed workers
- npm workspaces allow independent package versioning
