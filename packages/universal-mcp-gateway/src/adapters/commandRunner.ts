import { spawn } from 'child_process'
import type { GatewayAdapter, GatewayAdapterContext, RelayCommandEnvelope, AdapterExecutionResult } from '../types'

interface CommandRunnerAdapterOptions {
    id: string
    displayName: string
    defaultCapabilities: string[]
}

interface RunnerEnvelope {
    type: 'command'
    command: RelayCommandEnvelope
    agent: {
        id: string
        name: string
        capabilities: string[]
    }
}

interface RunnerJsonResponse {
    replies?: Array<{
        content: string
        messageType?: 'text' | 'status' | 'artifact' | 'event'
        metadata?: Record<string, unknown>
    }>
    approvals?: Array<{
        action_type: string
        action_details: Record<string, unknown>
        risk_level?: 'low' | 'medium' | 'high' | 'critical'
        risk_reason?: string
    }>
}

async function runUpstreamCommand(command: RelayCommandEnvelope, context: GatewayAdapterContext): Promise<AdapterExecutionResult> {
    if (!context.config.upstreamCommand) {
        return {
            replies: [
                {
                    content: 'Gateway is online, but no upstream agent command is configured yet. Set UPSTREAM_AGENT_COMMAND and restart the gateway.',
                    messageType: 'status',
                    metadata: { gateway_state: 'missing_upstream_command' },
                },
            ],
        }
    }

    const requestEnvelope: RunnerEnvelope = {
        type: 'command',
        command,
        agent: {
            id: context.config.agentId,
            name: context.config.agentName,
            capabilities: context.config.agentCapabilities,
        },
    }

    return new Promise<AdapterExecutionResult>((resolve, reject) => {
        const child = spawn(context.config.upstreamCommand as string, context.config.upstreamArgs, {
            cwd: context.config.upstreamWorkdir,
            stdio: ['pipe', 'pipe', 'pipe'],
            shell: false,
        })

        let stdout = ''
        let stderr = ''

        child.stdout.on('data', (chunk) => {
            stdout += chunk.toString()
        })

        child.stderr.on('data', (chunk) => {
            stderr += chunk.toString()
        })

        child.on('error', (error) => {
            reject(error)
        })

        child.on('exit', (code) => {
            if (code !== 0) {
                reject(new Error(stderr.trim() || `Upstream agent exited with code ${code}`))
                return
            }

            const trimmed = stdout.trim()
            if (!trimmed) {
                resolve({
                    replies: [
                        {
                            content: 'Upstream agent completed without returning any output.',
                            messageType: 'status',
                        },
                    ],
                })
                return
            }

            try {
                const parsed = JSON.parse(trimmed) as RunnerJsonResponse
                resolve({
                    replies: (parsed.replies ?? []).map((reply) => ({
                        content: reply.content,
                        messageType: reply.messageType ?? 'text',
                        metadata: reply.metadata,
                    })),
                    approvals: parsed.approvals ?? [],
                })
            } catch {
                resolve({
                    replies: [
                        {
                            content: trimmed,
                            messageType: 'text',
                            metadata: { adapter_mode: 'plain-stdout' },
                        },
                    ],
                })
            }
        })

        child.stdin.write(JSON.stringify(requestEnvelope))
        child.stdin.end()
    })
}

export function createCommandRunnerAdapter(options: CommandRunnerAdapterOptions): GatewayAdapter {
    return {
        id: options.id,
        displayName: options.displayName,
        runtimeTransport: 'mcp',
        defaultCapabilities: options.defaultCapabilities,
        async handleCommand(command, context) {
            context.logger.debug('Dispatching command to upstream runner', {
                adapter: options.id,
                commandId: command.id,
            })

            return runUpstreamCommand(command, context)
        },
    }
}
