import test from 'node:test';
import assert from 'node:assert/strict';
import { getApprovalTimeoutConfig, resolveApprovalTimeoutMs } from '../utils/approvalTimeout';

test('uses expected timeout values for each risk level', () => {
    const timeouts = getApprovalTimeoutConfig();

    assert.equal(timeouts.low, 5 * 60 * 1000);
    assert.equal(timeouts.medium, 15 * 60 * 1000);
    assert.equal(timeouts.high, 30 * 60 * 1000);
    assert.equal(timeouts.critical, 24 * 60 * 60 * 1000);
});

test('falls back to medium timeout for unknown risk levels', () => {
    assert.equal(resolveApprovalTimeoutMs('unknown'), 15 * 60 * 1000);
});
