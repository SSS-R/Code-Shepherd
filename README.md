# AgentOps Monorepo

A monorepo for AgentOps project using npm workspaces and TypeScript.

## Structure

```
agentops/
├── package.json          # Root workspace config
├── tsconfig.json         # Shared TypeScript config
├── README.md             # This file
└── packages/
    ├── relay/            # Express.js server
    │   ├── package.json
    │   ├── tsconfig.json
    │   └── src/
    ├── ui/               # React PWA
    │   ├── package.json
    │   ├── tsconfig.json
    │   └── src/
    ├── sdk/              # Agent-side npm package
    │   ├── package.json
    │   ├── tsconfig.json
    │   └── src/
    └── shared/           # Shared TypeScript types
        ├── package.json
        ├── tsconfig.json
        └── src/
```

## Packages

| Package | Description |
|---------|-------------|
| `@agentops/relay` | Express.js server for agent communication |
| `@agentops/ui` | React PWA for user interface |
| `@agentops/sdk` | Agent-side npm package |
| `@agentops/shared` | Shared TypeScript types and utilities |

## Getting Started

```bash
# Install all dependencies
npm install

# Build all packages
npm run build

# Run dev mode for all packages
npm run dev
```

## npm Workspaces

This monorepo uses npm workspaces. Each package is automatically linked to the root `node_modules`.

```json
{
  "workspaces": ["packages/*"]
}
```
