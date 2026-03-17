# Codebase Map: AgentOps

## Project Type

Monorepo - Agent Orchestration Platform

## Key Frameworks

| Package | Framework |
|---------|-----------|
| relay | Express.js, Temporal.io, better-sqlite3 |
| ui | React 18, Vite |
| sdk | TypeScript library |
| shared | TypeScript types |

## Entry Points

| Package | Entry Point |
|---------|-------------|
| relay | `packages/relay/src/index.ts` |
| ui | `packages/ui/src/main.tsx` |
| sdk | `packages/sdk/src/index.ts` |
| shared | `packages/shared/src/index.ts` |

## Directory Structure

```
agentops/
├── package.json              # Root workspace config
├── tsconfig.json             # Shared TypeScript config
├── README.md
├── PROJECT_MEMORY.md
├── TASKS.md
├── CODEBASE_MAP.md
├── .gitignore
└── packages/
    ├── relay/                # Express.js server
    │   ├── src/
    │   │   ├── index.ts      # Server entry point
    │   │   ├── workflows.ts  # Temporal workflows
    │   │   └── activities.ts # Temporal activities
    │   ├── package.json
    │   └── tsconfig.json
    ├── ui/                   # React PWA
    │   ├── src/
    │   ├── package.json
    │   └── tsconfig.json
    ├── sdk/                  # Agent SDK
    │   ├── src/
    │   ├── package.json
    │   └── tsconfig.json
    └── shared/               # Shared types
        ├── src/
        ├── package.json
        └── tsconfig.json
```

## Build System

```bash
# Install all dependencies
npm install

# Build all packages
npm run build

# Run dev mode
npm run dev
```

## Current Limitations

- No tests written yet
- Temporal server not configured (localhost:7233 expected)
- SQLite database file not committed (gitignored)
