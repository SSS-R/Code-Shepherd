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
  'antigravity-proxy': {
    adapterId: 'antigravity-proxy',
    label: 'Antigravity Desktop Handoff',
    description: 'Local Antigravity launcher bridge. Tasks are handed off into the desktop runtime.',
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
    label: 'Antigravity Companion',
    description: 'Antigravity extension companion with round-trip replies back into Code Shepherd.',
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
