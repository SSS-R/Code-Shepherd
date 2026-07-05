export interface RuntimeModelOption {
  id: string;
  label: string;
  provider?: string;
  default?: boolean;
}

export interface RuntimeCatalogEntry {
  adapterId: string;
  label: string;
  description: string;
  suggestedAgentName: string;
  suggestedAgentId: string;
  defaultCapabilities: string[];
  modelSelectionMode: 'direct' | 'advisory';
  supportsCustomModel: boolean;
  launchBehavior: 'roundtrip' | 'handoff';
  models: RuntimeModelOption[];
}

const runtimeCatalog: Record<string, RuntimeCatalogEntry> = {
  'codex-proxy': {
    adapterId: 'codex-proxy',
    label: 'Codex CLI',
    description: 'Local Codex bridge with round-trip replies back into Code Shepherd.',
    suggestedAgentName: 'Codex MCP Bridge',
    suggestedAgentId: 'codex-mcp-bridge',
    defaultCapabilities: ['mcp', 'codex', 'chat', 'bridge'],
    modelSelectionMode: 'direct',
    supportsCustomModel: true,
    launchBehavior: 'roundtrip',
    models: [
      { id: 'default', label: 'Runtime Default', default: true },
    ],
  },
  'claude-code-proxy': {
    adapterId: 'claude-code-proxy',
    label: 'Claude Code CLI',
    description: 'Local Claude Code bridge with round-trip replies back into Code Shepherd.',
    suggestedAgentName: 'Claude Code Bridge',
    suggestedAgentId: 'claude-code-bridge',
    defaultCapabilities: ['mcp', 'claude-code', 'chat', 'bridge'],
    modelSelectionMode: 'direct',
    supportsCustomModel: true,
    launchBehavior: 'roundtrip',
    models: [
      { id: 'default', label: 'Runtime Default', default: true },
      { id: 'sonnet', label: 'Claude Sonnet' },
      { id: 'opus', label: 'Claude Opus' },
      { id: 'haiku', label: 'Claude Haiku' },
    ],
  },
  'antigravity-proxy': {
    adapterId: 'antigravity-proxy',
    label: 'Antigravity Desktop Handoff (broken upstream)',
    description: 'Legacy Antigravity CLI launcher bridge. Antigravity removed its CLI in recent releases, so this adapter no longer works against current installs.',
    suggestedAgentName: 'Antigravity Bridge',
    suggestedAgentId: 'antigravity-mcp-bridge',
    defaultCapabilities: ['mcp', 'antigravity', 'chat', 'bridge'],
    modelSelectionMode: 'advisory',
    supportsCustomModel: true,
    launchBehavior: 'handoff',
    models: [
      { id: 'workspace-default', label: 'Workspace Default', default: true },
    ],
  },
  'antigravity-companion': {
    adapterId: 'antigravity-companion',
    label: 'Antigravity Companion (needs revalidation)',
    description: 'Antigravity extension companion with round-trip replies. Antigravity dropped its VS Code-fork architecture in recent releases; this companion needs revalidation against current builds.',
    suggestedAgentName: 'Antigravity Companion',
    suggestedAgentId: 'antigravity-companion',
    defaultCapabilities: ['mcp', 'antigravity', 'chat', 'bridge', 'companion'],
    modelSelectionMode: 'advisory',
    supportsCustomModel: true,
    launchBehavior: 'roundtrip',
    models: [
      { id: 'workspace-default', label: 'Workspace Default', default: true },
    ],
  },
  'openclaw-proxy': {
    adapterId: 'openclaw-proxy',
    label: 'OpenClaw MCP',
    description: 'OpenClaw MCP-backed bridge session.',
    suggestedAgentName: 'OpenClaw MCP Bridge',
    suggestedAgentId: 'openclaw-mcp-bridge',
    defaultCapabilities: ['mcp', 'openclaw', 'chat', 'bridge'],
    modelSelectionMode: 'advisory',
    supportsCustomModel: true,
    launchBehavior: 'roundtrip',
    models: [
      { id: 'default', label: 'Connector Default', default: true },
    ],
  },
  'command-runner': {
    adapterId: 'command-runner',
    label: 'Custom Command Runner',
    description: 'Bring your own local command adapter for custom runtimes.',
    suggestedAgentName: 'Custom Agent Bridge',
    suggestedAgentId: 'custom-agent-bridge',
    defaultCapabilities: ['mcp', 'chat', 'bridge'],
    modelSelectionMode: 'advisory',
    supportsCustomModel: true,
    launchBehavior: 'roundtrip',
    models: [
      { id: 'default', label: 'Runtime Default', default: true },
    ],
  },
};

export function getRuntimeCatalogEntry(adapterId?: string | null): RuntimeCatalogEntry {
  if (adapterId && runtimeCatalog[adapterId]) {
    return runtimeCatalog[adapterId];
  }

  return runtimeCatalog['command-runner'];
}

export function listRuntimeCatalogEntries(): RuntimeCatalogEntry[] {
  return Object.values(runtimeCatalog);
}
