import fs from 'fs'
import path from 'path'
import { spawn } from 'child_process'
import type { AdapterExecutionResult, GatewayAdapter, GatewayAdapterContext, RelayCommandEnvelope } from '../types'

function resolveAntigravityCommand(config: GatewayAdapterContext['config']): string {
    if (config.antigravityCliPath) {
        return config.antigravityCliPath
    }

    const localAppData = process.env.LOCALAPPDATA
    if (localAppData) {
        const bundledWindowsCommand = path.join(localAppData, 'Programs', 'Antigravity', 'bin', 'antigravity.cmd')
        if (fs.existsSync(bundledWindowsCommand)) {
            return bundledWindowsCommand
        }

        const bundledWindowsExe = path.join(localAppData, 'Programs', 'Antigravity', 'Antigravity.exe')
        if (fs.existsSync(bundledWindowsExe)) {
            return bundledWindowsExe
        }
    }

    return process.platform === 'win32' ? 'Antigravity.exe' : 'antigravity'
}

function resolveSelectedModel(command: RelayCommandEnvelope): string | undefined {
    const value = command.metadata?.selected_model
    if (typeof value === 'string' && value.trim()) {
        return value.trim()
    }

    return undefined
}

function resolveSelectedMode(command: RelayCommandEnvelope, context: GatewayAdapterContext): string {
    const fromMetadata = command.metadata?.selected_mode
    if (typeof fromMetadata === 'string' && fromMetadata.trim()) {
        return fromMetadata.trim()
    }

    return context.config.antigravityMode ?? 'agent'
}

function buildPrompt(command: RelayCommandEnvelope, selectedModel?: string): string {
    const preface = [
        'Code Shepherd forwarded this task into Antigravity.',
        `Conversation ID: ${command.conversation_id}`,
        `Command ID: ${command.id}`,
    ]

    if (selectedModel) {
        preface.push(`Requested model: ${selectedModel}`)
    }

    if (command.metadata && Object.keys(command.metadata).length > 0) {
        preface.push(`Metadata: ${JSON.stringify(command.metadata, null, 2)}`)
    }

    return `${preface.join('\n')}\n\n${command.content.trim() || '(empty operator request)'}`
}

async function launchAntigravity(command: RelayCommandEnvelope, context: GatewayAdapterContext): Promise<AdapterExecutionResult> {
    const antigravityCommand = resolveAntigravityCommand(context.config)
    const selectedModel = resolveSelectedModel(command)
    const selectedMode = resolveSelectedMode(command, context)
    const prompt = buildPrompt(command, selectedModel)
    const args = ['chat', '--mode', selectedMode, '--reuse-window', prompt]

    context.logger.debug('Launching Antigravity for Code Shepherd command', {
        commandId: command.id,
        antigravityCommand,
        args,
        selectedModel,
    })

    return new Promise<AdapterExecutionResult>((resolve) => {
        const child = spawn(antigravityCommand, args, {
            cwd: context.config.upstreamWorkdir ?? process.cwd(),
            env: process.env,
            stdio: ['ignore', 'pipe', 'pipe'],
            shell: process.platform === 'win32' && antigravityCommand.toLowerCase().endsWith('.cmd'),
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
                ? 'Antigravity CLI was not found on this machine. Install Antigravity or set ANTIGRAVITY_CLI_PATH before starting the gateway.'
                : `Failed to launch Antigravity: ${error.message}`

            resolve({
                replies: [
                    {
                        content: message,
                        messageType: 'status',
                        metadata: {
                            source: 'antigravity-cli',
                            antigravity_command: antigravityCommand,
                            error: error.message,
                        },
                    },
                ],
            })
        })

        child.on('close', (code) => {
            if (code !== 0) {
                const errorText = stderr.trim() || stdout.trim() || 'Antigravity exited without opening the requested chat session.'

                resolve({
                    replies: [
                        {
                            content: `Antigravity could not accept this handoff.\n\n${errorText}`,
                            messageType: 'status',
                            metadata: {
                                source: 'antigravity-cli',
                                antigravity_command: antigravityCommand,
                                exit_code: code,
                            },
                        },
                    ],
                })
                return
            }

            const modelHint = selectedModel
                ? ` Requested model hint: ${selectedModel}.`
                : ''

            resolve({
                replies: [
                    {
                        content: `Task handed off to Antigravity on this machine.${modelHint} Continue the session in the Antigravity window.`,
                        messageType: 'status',
                        metadata: {
                            source: 'antigravity-cli',
                            selected_model: selectedModel,
                            selected_mode: selectedMode,
                            launch_behavior: 'handoff',
                        },
                    },
                ],
            })
        })
    })
}

export function createAntigravityCliAdapter(): GatewayAdapter {
    return {
        id: 'antigravity-proxy',
        displayName: 'Antigravity CLI Adapter',
        runtimeTransport: 'mcp',
        defaultCapabilities: ['mcp', 'antigravity', 'chat', 'bridge'],
        handleCommand(command, context) {
            return launchAntigravity(command, context)
        },
    }
}
