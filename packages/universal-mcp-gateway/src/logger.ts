import type { GatewayLogger } from './types'

function emit(level: string, message: string, meta?: Record<string, unknown>) {
    const timestamp = new Date().toISOString()
    if (meta && Object.keys(meta).length > 0) {
        console.log(`[gateway] ${timestamp} ${level}: ${message}`, meta)
        return
    }

    console.log(`[gateway] ${timestamp} ${level}: ${message}`)
}

export function createLogger(): GatewayLogger {
    return {
        info: (message, meta) => emit('info', message, meta),
        warn: (message, meta) => emit('warn', message, meta),
        error: (message, meta) => emit('error', message, meta),
        debug: (message, meta) => emit('debug', message, meta),
    }
}
