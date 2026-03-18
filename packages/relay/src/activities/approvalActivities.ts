/**
 * Temporal Activities: Approval Management
 */

import Database from 'better-sqlite3';

// Initialize database connection
const db = new Database('./relay.db');

/**
 * Update approval status in the database
 */
export async function updateApprovalStatus(
  approvalId: string,
  status: string,
  decision: string,
  decision_reason: string,
  decidedBy: string
): Promise<void> {
  const stmt = db.prepare(`
    UPDATE approvals 
    SET status = ?, decision = ?, decision_reason = ?, decided_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);

  const result = stmt.run(status, decision, decision_reason, approvalId);

  if (result.changes === 0) {
    throw new Error(`Approval ${approvalId} not found`);
  }

  // Log to audit trail
  const auditStmt = db.prepare(`
    INSERT INTO audit_logs (event_type, event_details, approval_id)
    VALUES ('workflow_status_update', ?, ?)
  `);
  auditStmt.run(
    JSON.stringify({ status, decision, decidedBy }),
    approvalId
  );

  console.log(`Approval ${approvalId} updated to ${status} by ${decidedBy}`);
}

/**
 * Create audit log entry
 */
export async function createAuditLog(
  event_type: string,
  event_details: Record<string, unknown>,
  agent_id?: string,
  approval_id?: string
): Promise<void> {
  const stmt = db.prepare(`
    INSERT INTO audit_logs (event_type, event_details, agent_id, approval_id)
    VALUES (?, ?, ?, ?)
  `);

  stmt.run(event_type, JSON.stringify(event_details), agent_id || null, approval_id || null);
}

/**
 * Get pending approvals count
 */
export async function getPendingApprovalsCount(): Promise<number> {
  const stmt = db.prepare(`
    SELECT COUNT(*) as count FROM approvals WHERE status = 'pending'
  `);
  const result = stmt.get() as { count: number };
  return result.count;
}
