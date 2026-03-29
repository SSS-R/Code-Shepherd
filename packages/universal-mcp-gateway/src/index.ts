import { loadGatewayConfig } from './config'
import { createLogger } from './logger'
import { writeGatewaySession } from './localSession'
import { UniversalGatewayRelayClient } from './relayClient'
import type { RelayCommandEnvelope } from './types'
import { createGatewayAdapter } from './adapters/registry'

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

async function main() {
    let config = loadGatewayConfig()
    const logger = createLogger()
    const bootstrapRelay = new UniversalGatewayRelayClient(config, logger)
    const hasSavedGatewaySession = Boolean(config.connectorAccessToken && config.connectorId && config.agentId)

    if (config.pairingCode) {
        logger.info('Exchanging pairing code for local gateway session', {
            relayUrl: config.relayUrl,
            pairingCode: config.pairingCode,
        })

        try {
            const pairing = await bootstrapRelay.exchangePairingCode(config.pairingCode, config.machineLabel)
            config = {
                ...config,
                relayUrl: pairing.relay_url,
                connectorId: pairing.connector_id,
                connectorAccessToken: pairing.connector_access_token,
                connectorSecret: undefined,
                agentId: pairing.agent.id,
                agentName: pairing.agent.name,
                agentCapabilities: pairing.agent.capabilities,
                adapterId: pairing.agent.adapter_id,
                pairingCode: undefined,
            }

            if (config.sessionFilePath) {
                writeGatewaySession(config.sessionFilePath, config)
                logger.info('Saved paired gateway session locally', {
                    sessionFilePath: config.sessionFilePath,
                })
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error)
            const canReuseSavedSession = hasSavedGatewaySession
                && (message.includes('already been used') || message.includes('has expired'))

            if (!canReuseSavedSession) {
                throw error
            }

            logger.warn('Pairing code is no longer reusable, falling back to the saved local gateway session', {
                sessionFilePath: config.sessionFilePath,
                reason: message,
            })
            config = {
                ...config,
                pairingCode: undefined,
            }
        }
    }

    const adapter = createGatewayAdapter(config)
    const relay = new UniversalGatewayRelayClient(config, logger)

    logger.info('Starting universal MCP gateway', {
        relayUrl: config.relayUrl,
        agentId: config.agentId,
        adapter: adapter.id,
    })

    await relay.registerAgent(adapter)
    await relay.heartbeat()

    const heartbeatTimer = setInterval(() => {
        void relay.heartbeat().catch((error: unknown) => {
            logger.error('Gateway heartbeat failed', { error: error instanceof Error ? error.message : String(error) })
        })
    }, config.heartbeatIntervalMs)

    let shuttingDown = false

    const shutdown = () => {
        shuttingDown = true
        clearInterval(heartbeatTimer)
    }

    process.on('SIGINT', () => {
        logger.warn('Stopping universal MCP gateway')
        shutdown()
        process.exit(0)
    })

    process.on('SIGTERM', () => {
        logger.warn('Stopping universal MCP gateway')
        shutdown()
        process.exit(0)
    })

    while (!shuttingDown) {
        try {
            const commands = await relay.pollCommands()
            for (const command of commands) {
                await processCommand(command, relay, adapter, config, logger)
            }
        } catch (error) {
            logger.error('Polling loop failed', {
                error: error instanceof Error ? error.message : String(error),
            })
        }

        await sleep(config.commandPollIntervalMs)
    }
}

async function processCommand(
    command: RelayCommandEnvelope,
    relay: UniversalGatewayRelayClient,
    adapter: ReturnType<typeof createGatewayAdapter>,
    config: ReturnType<typeof loadGatewayConfig>,
    logger: ReturnType<typeof createLogger>,
) {
    logger.info('Processing relay command', {
        commandId: command.id,
        conversationId: command.conversation_id,
    })

    await relay.ackCommand(command.id)

    let result

    try {
        result = await adapter.handleCommand(command, {
            config,
            logger,
        })
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error)

        logger.error('Adapter execution failed', {
            commandId: command.id,
            agentId: config.agentId,
            error: message,
        })

        await relay.sendReply(command.conversation_id, command.id, {
            content: `The connected agent failed while processing this task.\n\n${message}`,
            messageType: 'status',
            metadata: {
                source: 'universal-mcp-gateway',
                adapter: adapter.id,
                error: message,
            },
        })
        return
    }

    for (const approval of result.approvals ?? []) {
        await relay.createApproval(command, approval)
    }

    if ((result.replies?.length ?? 0) === 0 && (result.approvals?.length ?? 0) > 0) {
        await relay.sendReply(command.conversation_id, command.id, {
            content: 'Approval requested from Code Shepherd before the upstream agent continues.',
            messageType: 'status',
            metadata: { approval_count: result.approvals?.length ?? 0 },
        })
    }

    for (const reply of result.replies) {
        await relay.sendReply(command.conversation_id, command.id, reply)
    }

    logger.info('Completed relay command', {
        commandId: command.id,
        agentId: config.agentId,
        replies: result.replies.length,
        approvals: result.approvals?.length ?? 0,
    })
}

void main().catch((error: unknown) => {
    const logger = createLogger()
    logger.error('Gateway boot failed', {
        error: error instanceof Error ? error.message : String(error),
    })
    process.exit(1)
})
