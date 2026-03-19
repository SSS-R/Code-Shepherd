const APPROVAL_TIMEOUTS_MS: Record<string, number> = {
    low: 5 * 60 * 1000,
    medium: 15 * 60 * 1000,
    high: 30 * 60 * 1000,
    critical: 24 * 60 * 60 * 1000,
};

export function resolveApprovalTimeoutMs(riskLevel: string): number {
    return APPROVAL_TIMEOUTS_MS[riskLevel] ?? APPROVAL_TIMEOUTS_MS.medium;
}

export function getApprovalTimeoutConfig(): Record<string, number> {
    return { ...APPROVAL_TIMEOUTS_MS };
}
