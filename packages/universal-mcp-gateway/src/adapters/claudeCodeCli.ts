import fs from 'fs'
import os from 'os'
import path from 'path'
import { spawn } from 'child_process'
import type { AdapterExecutionResult, GatewayAdapter, GatewayAdapterContext, GatewayReply, RelayCommandEnvelope } from '../types'

interface ClaudeCliResult {
    type?: string
    subtype?: string
    is_error?: boolean
    result?: string
    session_id?: string
    num_turns?: number
    total_cost_usd?: number
    usage?: {
        input_tokens?: number
        cache_read_input_tokens?: number
        output_tokens?: number
    }
}

const DEFAULT_TIMEOUT_MS = 10 * 60 * 1000

function buildClaudePrompt(command: RelayCommandEnvelope): string {
    const metadataBlock = command.metadata && Object.keys(command.metadata).length > 0
        ? `\n\nCode Shepherd metadata:\n${JSON.stringify(command.metadata, null, 2)}`
        : ''

    return [
        'You are Claude Code connected through Code Shepherd.',
        `Conversation ID: ${command.conversation_id}`,
        `Command ID: ${command.id}`,
        '',
        'Reply to the operator request below.',
        '',
        command.content.trim() || '(empty operator request)',
        metadataBlock,
    ].join('\n')
}

function resolveClaudeCommand(config: GatewayAdapterContext['config']): string {
    if (config.claudeCliPath) {
        return config.claudeCliPath
    }

    const home = os.homedir()
    const localCandidates = process.platform === 'win32'
        ? [
            path.join(home, '.local', 'bin', 'claude.exe'),
            path.join(home, 'AppData', 'Local', 'Programs', 'claude', 'claude.exe'),
        ]
        : [
            path.join(home, '.local', 'bin', 'claude'),
            '/usr/local/bin/claude',
        ]

    for (const candidate of localCandidates) {
        if (fs.existsSync(candidate)) {
            return candidate
        }
    }

    return process.platform === 'win32' ? 'claude.exe' : 'claude'
}

function buildClaudeArgs(command: RelayCommandEnvelope, context: GatewayAdapterContext): string[] {
    const args = ['-p', '--output-format', 'json']

    const selectedModel = typeof command.metadata?.selected_model === 'string' && command.metadata.selected_model.trim()
        ? command.metadata.selected_model.trim()
        : context.config.claudeModel

    if (selectedModel && selectedModel !== 'default') {
        args.push('--model', selectedModel)
    }

    if (context.config.claudePermissionMode && context.config.claudePermissionMode !== 'default') {
        args.push('--permission-mode', context.config.claudePermissionMode)
    }

    if (context.config.claudeExtraArgs.length > 0) {
        args.push(...context.config.claudeExtraArgs)
    }

    return args
}

function parseClaudeResult(stdout: string): ClaudeCliResult | null {
    const trimmed = stdout.trim()

    // --output-format json emits a single JSON object; tolerate stray log lines around it
    if (trimmed.startsWith('{')) {
        try {
            return JSON.parse(trimmed) as ClaudeCliResult
        } catch {
            // fall through to line scan
        }
    }

    for (const line of trimmed.split(/\r?\n/).reverse()) {
        const candidate = line.trim()
        if (!candidate.startsWith('{')) {
            continue
        }

        try {
            const parsed = JSON.parse(candidate) as ClaudeCliResult
            if (parsed.type === 'result') {
                return parsed
            }
        } catch {
            // ignore non-JSON diagnostic output
        }
    }

    return null
}

function createFailureReply(message: string, metadata?: Record<string, unknown>): AdapterExecutionResult {
    return {
        replies: [
            {
                content: message,
                messageType: 'status',
                metadata: {
                    source: 'claude-code-cli',
                    ...metadata,
                },
            },
        ],
    }
}

async function executeClaudeCode(command: RelayCommandEnvelope, context: GatewayAdapterContext): Promise<AdapterExecutionResult> {
    const claudeCommand = resolveClaudeCommand(context.config)
    const prompt = buildClaudePrompt(command)
    const args = buildClaudeArgs(command, context)
    const timeoutMs = context.config.claudeTimeoutMs ?? DEFAULT_TIMEOUT_MS

    context.logger.debug('Launching Claude Code CLI for Code Shepherd command', {
        commandId: command.id,
        claudeCommand,
        args,
    })

    return new Promise<AdapterExecutionResult>((resolve) => {
        const child = spawn(claudeCommand, args, {
            cwd: context.config.upstreamWorkdir ?? process.cwd(),
            env: process.env,
            stdio: ['pipe', 'pipe', 'pipe'],
            shell: false,
        })

        let stdout = ''
        let stderr = ''
        let settled = false

        const settle = (result: AdapterExecutionResult) => {
            if (!settled) {
                settled = true
                clearTimeout(timeoutTimer)
                resolve(result)
            }
        }

        const timeoutTimer = setTimeout(() => {
            child.kill()
            settle(createFailureReply(
                `Claude Code did not finish within ${Math.round(timeoutMs / 60_000)} minutes and was stopped. Consider narrowing the task or raising CLAUDE_TIMEOUT_MS.`,
                { claude_command: claudeCommand, timeout_ms: timeoutMs },
            ))
        }, timeoutMs)

        child.stdout.on('data', (chunk) => {
            stdout += chunk.toString()
        })

        child.stderr.on('data', (chunk) => {
            stderr += chunk.toString()
        })

        child.on('error', (error) => {
            const message = error.message.includes('ENOENT')
                ? 'Claude Code CLI was not found on this machine. Install Claude Code or set CLAUDE_CLI_PATH before starting the gateway.'
                : `Failed to launch Claude Code CLI: ${error.message}`

            settle(createFailureReply(message, {
                claude_command: claudeCommand,
                error: error.message,
            }))
        })

        child.on('close', (code) => {
            const parsed = parseClaudeResult(stdout)
            const cleanedStderr = stderr.trim()

            if (code !== 0 || parsed?.is_error) {
                const errorText = parsed?.result
                    || cleanedStderr
                    || 'Claude Code exited without a success status.'

                settle(createFailureReply(`Claude Code could not complete this task.\n\n${errorText}`, {
                    claude_command: claudeCommand,
                    exit_code: code,
                    result_subtype: parsed?.subtype,
                }))
                return
            }

            const replyContent = parsed?.result?.trim() || 'Claude Code completed the task but did not return a final message.'
            const reply: GatewayReply = {
                content: replyContent,
                messageType: 'text',
                metadata: {
                    source: 'claude-code-cli',
                    claude_session_id: parsed?.session_id,
                    num_turns: parsed?.num_turns,
                    total_cost_usd: parsed?.total_cost_usd,
                    usage: parsed?.usage,
                    selected_model: typeof command.metadata?.selected_model === 'string'
                        ? command.metadata.selected_model
                        : context.config.claudeModel,
                },
            }

            settle({ replies: [reply] })
        })

        child.stdin.write(prompt)
        child.stdin.end()
    })
}

export function createClaudeCodeCliAdapter(): GatewayAdapter {
    return {
        id: 'claude-code-proxy',
        displayName: 'Claude Code CLI Adapter',
        runtimeTransport: 'mcp',
        defaultCapabilities: ['mcp', 'claude-code', 'chat', 'bridge'],
        handleCommand(command, context) {
            return executeClaudeCode(command, context)
        },
    }
}
