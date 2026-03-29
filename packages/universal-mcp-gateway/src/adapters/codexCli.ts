import fs from 'fs'
import os from 'os'
import path from 'path'
import { randomUUID } from 'crypto'
import { spawn } from 'child_process'
import type { AdapterExecutionResult, GatewayAdapter, GatewayAdapterContext, GatewayReply, RelayCommandEnvelope } from '../types'

interface CodexCliEvent {
    type?: string
    thread_id?: string
    usage?: {
        input_tokens?: number
        cached_input_tokens?: number
        output_tokens?: number
    }
    item?: {
        type?: string
        text?: string
    }
    error?: {
        message?: string
    }
    message?: string
}

function buildCodexPrompt(command: RelayCommandEnvelope): string {
    const metadataBlock = command.metadata && Object.keys(command.metadata).length > 0
        ? `\n\nCode Shepherd metadata:\n${JSON.stringify(command.metadata, null, 2)}`
        : ''

    return [
        'You are Codex connected through Code Shepherd.',
        `Conversation ID: ${command.conversation_id}`,
        `Command ID: ${command.id}`,
        '',
        'Reply to the operator request below as Codex.',
        '',
        command.content.trim() || '(empty operator request)',
        metadataBlock,
    ].join('\n')
}

function resolveCodexCommand(config: GatewayAdapterContext['config']): string {
    if (config.codexCliPath) {
        return config.codexCliPath
    }

    const localCandidates = [
        path.join(process.cwd(), 'commits', 'codex.exe'),
        path.join(process.cwd(), 'commits', 'codex'),
    ]

    for (const candidate of localCandidates) {
        if (fs.existsSync(candidate)) {
            return candidate
        }
    }

    const localAppData = process.env.LOCALAPPDATA
    if (localAppData) {
        const windowsAppsCandidate = path.join(localAppData, 'Microsoft', 'WindowsApps', 'codex.exe')
        if (fs.existsSync(windowsAppsCandidate)) {
            return windowsAppsCandidate
        }
    }

    return process.platform === 'win32' ? 'codex.exe' : 'codex'
}

function buildCodexArgs(
    command: RelayCommandEnvelope,
    context: GatewayAdapterContext,
    outputFilePath: string,
): string[] {
    const args = [
        'exec',
        '--skip-git-repo-check',
        '--json',
        '--color',
        'never',
        '--output-last-message',
        outputFilePath,
    ]

    if (context.config.upstreamWorkdir) {
        args.push('--cd', context.config.upstreamWorkdir)
    }

    if (context.config.codexSandboxMode) {
        args.push('--sandbox', context.config.codexSandboxMode)
    }

    const selectedModel = typeof command.metadata?.selected_model === 'string' && command.metadata.selected_model.trim()
        ? command.metadata.selected_model.trim()
        : context.config.codexModel

    if (selectedModel && selectedModel !== 'default') {
        args.push('--model', selectedModel)
    }

    if (context.config.codexProfile) {
        args.push('--profile', context.config.codexProfile)
    }

    if (context.config.codexExtraArgs.length > 0) {
        args.push(...context.config.codexExtraArgs)
    }

    if (command.content.trim().length === 0) {
        args.push('Reply with a short status that the incoming Code Shepherd command was empty.')
        return args
    }

    args.push('-')
    return args
}

function readFinalMessage(outputFilePath: string): string {
    if (!fs.existsSync(outputFilePath)) {
        return ''
    }

    return fs.readFileSync(outputFilePath, 'utf8').trim()
}

function parseCodexJsonLines(stdout: string): { threadId?: string; finalText?: string; usage?: Record<string, number>; errors: string[] } {
    const result: { threadId?: string; finalText?: string; usage?: Record<string, number>; errors: string[] } = { errors: [] }

    for (const line of stdout.split(/\r?\n/)) {
        const trimmed = line.trim()
        if (!trimmed.startsWith('{')) {
            continue
        }

        try {
            const event = JSON.parse(trimmed) as CodexCliEvent

            if (event.type === 'thread.started' && event.thread_id) {
                result.threadId = event.thread_id
            }

            if (event.type === 'item.completed' && event.item?.type === 'agent_message' && event.item.text) {
                result.finalText = event.item.text
            }

            if (event.type === 'turn.completed' && event.usage) {
                result.usage = {
                    input_tokens: event.usage.input_tokens ?? 0,
                    cached_input_tokens: event.usage.cached_input_tokens ?? 0,
                    output_tokens: event.usage.output_tokens ?? 0,
                }
            }

            if (event.type === 'error') {
                const message = event.error?.message ?? event.message
                if (message) {
                    result.errors.push(message)
                }
            }
        } catch {
            // ignore non-JSONL diagnostic output
        }
    }

    return result
}

function createFailureReply(message: string, metadata?: Record<string, unknown>): AdapterExecutionResult {
    return {
        replies: [
            {
                content: message,
                messageType: 'status',
                metadata: {
                    source: 'codex-cli',
                    ...metadata,
                },
            },
        ],
    }
}

async function executeCodex(command: RelayCommandEnvelope, context: GatewayAdapterContext): Promise<AdapterExecutionResult> {
    const codexCommand = resolveCodexCommand(context.config)
    const outputFilePath = path.join(os.tmpdir(), `code-shepherd-codex-${randomUUID()}.txt`)
    const prompt = buildCodexPrompt(command)
    const args = buildCodexArgs(command, context, outputFilePath)

    context.logger.debug('Launching Codex CLI for Code Shepherd command', {
        commandId: command.id,
        codexCommand,
        args,
        selectedModel: typeof command.metadata?.selected_model === 'string' ? command.metadata.selected_model : context.config.codexModel,
    })

    return new Promise<AdapterExecutionResult>((resolve) => {
        const child = spawn(codexCommand, args, {
            cwd: context.config.upstreamWorkdir ?? process.cwd(),
            env: process.env,
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
            const message = error.message.includes('ENOENT')
                ? 'Codex CLI was not found on this machine. Install Codex or set CODEX_CLI_PATH before starting the gateway.'
                : `Failed to launch Codex CLI: ${error.message}`

            resolve(createFailureReply(message, {
                codex_command: codexCommand,
                error: error.message,
            }))
        })

        child.on('close', (code) => {
            const parsed = parseCodexJsonLines(stdout)
            const finalMessage = readFinalMessage(outputFilePath) || parsed.finalText || ''
            const cleanedStderr = stderr.trim()

            if (fs.existsSync(outputFilePath)) {
                fs.rmSync(outputFilePath, { force: true })
            }

            if (code !== 0) {
                const errorText = parsed.errors[parsed.errors.length - 1]
                    ?? cleanedStderr
                    ?? 'Codex CLI exited without a success status.'

                resolve(createFailureReply(`Codex could not complete this task.\n\n${errorText}`, {
                    codex_command: codexCommand,
                    exit_code: code,
                }))
                return
            }

            const replyContent = finalMessage || 'Codex completed the task but did not return a final message.'
            const reply: GatewayReply = {
                content: replyContent,
                messageType: 'text',
                metadata: {
                    source: 'codex-cli',
                    codex_thread_id: parsed.threadId,
                    usage: parsed.usage,
                    selected_model: typeof command.metadata?.selected_model === 'string' ? command.metadata.selected_model : context.config.codexModel,
                },
            }

            resolve({ replies: [reply] })
        })

        if (args[args.length - 1] === '-') {
            child.stdin.write(prompt)
        }

        child.stdin.end()
    })
}

export function createCodexCliAdapter(): GatewayAdapter {
    return {
        id: 'codex-proxy',
        displayName: 'Codex CLI Adapter',
        runtimeTransport: 'mcp',
        defaultCapabilities: ['mcp', 'codex', 'chat', 'bridge'],
        handleCommand(command, context) {
            return executeCodex(command, context)
        },
    }
}
