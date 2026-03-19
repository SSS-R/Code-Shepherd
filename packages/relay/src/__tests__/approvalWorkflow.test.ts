import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveApprovalOutcome } from '../workflows/approvalWorkflow';

test('resolves timeout when no decision or resume arrives', () => {
    const resolution = resolveApprovalOutcome({
        decisionReceived: false,
        resumeRequested: false,
        timeoutMs: 15 * 60 * 1000,
        decision: 'timeout',
        decision_reason: '',
        decidedBy: '',
    });

    assert.equal(resolution.status, 'timeout');
    assert.equal(resolution.decision, 'timeout');
    assert.match(resolution.decision_reason, /15 minutes/);
    assert.equal(resolution.decidedBy, 'system-timeout');
});

test('resolves manual resume without decision as pending', () => {
    const resolution = resolveApprovalOutcome({
        decisionReceived: false,
        resumeRequested: true,
        timeoutMs: 30 * 60 * 1000,
        decision: 'timeout',
        decision_reason: '',
        decidedBy: '',
    });

    assert.equal(resolution.status, 'pending');
    assert.equal(resolution.decidedBy, 'manual-resume');
    assert.match(resolution.decision_reason, /resumed without a final approval decision/i);
});

test('resolves approved decisions directly', () => {
    const resolution = resolveApprovalOutcome({
        decisionReceived: true,
        resumeRequested: false,
        timeoutMs: 30 * 60 * 1000,
        decision: 'approved',
        decision_reason: 'Looks good',
        decidedBy: 'dashboard-user',
    });

    assert.equal(resolution.status, 'approved');
    assert.equal(resolution.decision, 'approved');
    assert.equal(resolution.decision_reason, 'Looks good');
    assert.equal(resolution.decidedBy, 'dashboard-user');
});

test('resolves rejected decisions directly', () => {
    const resolution = resolveApprovalOutcome({
        decisionReceived: true,
        resumeRequested: false,
        timeoutMs: 30 * 60 * 1000,
        decision: 'rejected',
        decision_reason: 'Unsafe change',
        decidedBy: 'dashboard-user',
    });

    assert.equal(resolution.status, 'rejected');
    assert.equal(resolution.decision, 'rejected');
    assert.equal(resolution.decision_reason, 'Unsafe change');
    assert.equal(resolution.decidedBy, 'dashboard-user');
});
