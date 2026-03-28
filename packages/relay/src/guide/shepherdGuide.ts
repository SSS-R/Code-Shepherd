import type { Database } from 'better-sqlite3';

export const SHEPHERD_GUIDE_AGENT_ID = 'shepherd-guide';
export const SHEPHERD_GUIDE_AGENT_NAME = 'Shepherd Guide';

interface ShepherdGuideSeedMessage {
    content: string;
    code?: string;
}

export interface ShepherdGuideReply {
    content: string;
    code?: string;
    topic: string;
    fallback: boolean;
}

const playbooks: Array<ShepherdGuideReply & { match: RegExp }> = [
    {
        match: /connect|connector|agent|register|bridge|mcp/i,
        topic: 'connectors',
        fallback: false,
        content: 'Open Settings to register a connector, choose the adapter path, then trust the connector before you start issuing commands. Native IDE, MCP, bridge, and direct-session paths all flow back through the relay so audit logs and approvals stay intact. OpenClaw should connect through the MCP path rather than as a separate guide model.',
        code: 'SETTINGS -> CONNECTORS -> ADD CONNECTOR\nChoose adapter type\nVerify transport\nConfirm trust state\nStart heartbeats',
    },
    {
        match: /approval|risk|reject|approve|policy/i,
        topic: 'approvals',
        fallback: false,
        content: 'High-risk actions surface in Approval Queue with diff context, summaries, and severity markers. Approve when the action matches the task intent, or reject with a reason so the operator and audit trail keep the full decision history.',
        code: 'APPROVAL FLOW\n1. Review summary + diff\n2. Check risk level\n3. Approve or reject\n4. Decision stored in audit log',
    },
    {
        match: /task|kanban|board|mission|coordination/i,
        topic: 'tasks',
        fallback: false,
        content: 'The Task Board is the coordination surface for parallel agent work. Use it to move work across readiness states, assign an agent, and keep the operator view aligned with what the relay is executing.',
        code: 'BOARD STATES\nReady\nActive\nValidation\nAction Required\nCompleted',
    },
    {
        match: /timeline|audit|log|history|trace/i,
        topic: 'audit',
        fallback: false,
        content: 'Timeline is the persistent audit trail for commands, approvals, replies, failures, and reconnects. Use it when you need to reconstruct how an agent session moved from request to outcome.',
        code: 'AUDIT SIGNALS\nagent_registered\napproval_requested\napproval_decided\nagent_reply_received\nconnector_registered',
    },
    {
        match: /theme|light|dark|obsidian|platinum|appearance/i,
        topic: 'appearance',
        fallback: false,
        content: 'Code Shepherd supports both Obsidian and Platinum themes. Theme choice is stored on the client today, while the visual system keeps the same Crystalline Architecture layout, density, and status language across both modes.',
    },
    {
        match: /inbox|conversation|message|chat|thread/i,
        topic: 'communication',
        fallback: false,
        content: 'Inbox is the unified thread surface for talking to agents. Each conversation keeps messages, commands, replies, and approval context together so you can intervene without losing operational history.',
        code: 'INBOX LOOP\nOpen conversation\nSend message or command\nTrack reply\nReview related approvals',
    },
    {
        match: /billing|payment|invoice|subscription|refund/i,
        topic: 'support-boundary',
        fallback: false,
        content: 'I only answer product-usage questions about Code Shepherd. Billing, account ownership, and payment issues should go through human support rather than the in-app guide.',
    },
];

const welcomeMessages: ShepherdGuideSeedMessage[] = [
    {
        content: 'I can help with Code Shepherd screens, approvals, connectors, tasks, and troubleshooting. Ask product-specific questions and I will guide you inline.',
    },
    {
        content: 'For example, if you want to connect an agent, I can explain the adapter path and where to configure it.',
        code: 'CONNECTOR TYPES\n- Native connector\n- MCP connector\n- Bridge connector\n- Direct session path\n- OpenClaw via MCP',
    },
];

const fallbackReply: ShepherdGuideReply = {
    topic: 'fallback',
    fallback: true,
    content: 'I can answer questions about Code Shepherd only. Ask about agents, connectors, approvals, inbox flows, task coordination, settings, or troubleshooting.',
};

export function ensureShepherdGuideAgent(db: Database): void {
    db.prepare(`
        INSERT INTO agents (id, name, capabilities, status, last_heartbeat)
        VALUES (?, ?, ?, 'online', CURRENT_TIMESTAMP)
        ON CONFLICT(id) DO UPDATE SET
            name = excluded.name,
            capabilities = excluded.capabilities,
            status = 'online',
            last_heartbeat = CURRENT_TIMESTAMP
    `).run(
        SHEPHERD_GUIDE_AGENT_ID,
        SHEPHERD_GUIDE_AGENT_NAME,
        JSON.stringify(['chat', 'product-guidance', 'support']),
    );
}

export function getShepherdGuideWelcomeMessages(): ShepherdGuideSeedMessage[] {
    return welcomeMessages;
}

export function buildShepherdGuideReply(prompt: string): ShepherdGuideReply {
    const trimmed = prompt.trim();
    const matched = playbooks.find((entry) => entry.match.test(trimmed));

    if (!matched) {
        return fallbackReply;
    }

    return {
        content: matched.content,
        code: matched.code,
        topic: matched.topic,
        fallback: matched.fallback,
    };
}
