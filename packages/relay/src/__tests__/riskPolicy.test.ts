import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateRisk, requiresApproval } from '../middleware/riskPolicy';

test('marks secret env file writes as critical', () => {
    const assessment = evaluateRisk('file_write', {
        path: '.env',
        content: 'API_KEY=secret',
    });

    assert.equal(assessment.risk_level, 'critical');
    assert.equal(assessment.requires_approval, true);
    assert.match(assessment.risk_reason, /critical/i);
});

test('marks infrastructure changes as high risk', () => {
    const assessment = evaluateRisk('file_write', {
        path: '.github/workflows/deploy.yml',
        content: 'deploy to production',
    });

    assert.equal(assessment.risk_level, 'high');
    assert.equal(assessment.requires_approval, true);
});

test('marks protected branch pushes as high or critical', () => {
    const assessment = evaluateRisk('command_execute', {
        command: 'git push origin main',
        branch: 'main',
    });

    assert.equal(assessment.requires_approval, true);
    assert.ok(['high', 'critical'].includes(assessment.risk_level));
});

test('marks benign reads as low risk', () => {
    const assessment = evaluateRisk('file_read', {
        path: 'src/components/Button.tsx',
    });

    assert.equal(assessment.risk_level, 'low');
    assert.equal(assessment.requires_approval, false);
});

test('requiresApproval mirrors structured assessment', () => {
    assert.equal(requiresApproval('file_delete', { path: 'src/old.ts' }), true);
    assert.equal(requiresApproval('file_read', { path: 'README.md' }), false);
});
