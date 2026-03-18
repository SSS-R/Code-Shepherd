/**
 * Risk Policy Engine
 * 
 * Evaluates actions for risk level and determines if manual approval is required.
 * Based on OWASP MCP Top 10 security guidelines.
 */

export interface RiskAssessment {
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  requires_approval: boolean;
  risk_reason: string;
  risk_factors: string[];
}

// Risk patterns based on OWASP MCP Top 10
const RISK_PATTERNS = {
  // Critical risk - always requires approval
  critical: [
    /rm\s+-rf/i,           // Recursive force delete
    /DROP\s+TABLE/i,       // Database destruction
    /DELETE\s+FROM/i,      // Database deletion
    /mkfs/i,               // Filesystem creation
    /chmod\s+777/i,        // Open permissions
    /\/etc\/passwd/i,      // System file access
    /\/etc\/shadow/i,      // Password file access
    /secret/i,             // Secret access
    /password/i,           // Password access
    /credential/i,         // Credential access
    /\.env/i,              // Environment file access
    /AWS_SECRET/i,         // AWS secrets
    /PRIVATE_KEY/i,        // Private key access
  ],

  // High risk - requires approval
  high: [
    /rm\s+/i,              // Any delete
    /sudo/i,               // Privilege escalation
    /curl.*\|.*bash/i,     // Remote code execution
    /wget.*\|.*bash/i,     // Remote code execution
    /eval\(/i,             // Code evaluation
    /exec\(/i,             // Code execution
    /child_process/i,      // Child process spawning
    /spawn/i,              // Process spawning
    /fork/i,               // Process forking
  ],

  // Medium risk - may require approval based on context
  medium: [
    /git\s+push/i,         // Git push to remote
    /npm\s+publish/i,      // Package publish
    /deploy/i,             // Deployment
    /production/i,         // Production environment
    /main/i,               // Main branch
    /master/i,             // Master branch
  ],
};

/**
 * Evaluate the risk level of an action
 */
export function evaluateRisk(action_type: string, action_details: any): RiskAssessment {
  const risk_factors: string[] = [];
  let risk_level: 'low' | 'medium' | 'high' | 'critical' = 'low';
  let requires_approval = false;
  let risk_reason = '';

  // Check action type
  const actionString = `${action_type} ${JSON.stringify(action_details)}`;

  // Check critical patterns
  for (const pattern of RISK_PATTERNS.critical) {
    if (pattern.test(actionString)) {
      risk_factors.push(`Critical pattern matched: ${pattern.source}`);
      risk_level = 'critical';
      requires_approval = true;
    }
  }

  // Check high risk patterns (if not already critical)
  if (risk_level !== 'critical') {
    for (const pattern of RISK_PATTERNS.high) {
      if (pattern.test(actionString)) {
        risk_factors.push(`High risk pattern matched: ${pattern.source}`);
        risk_level = 'high';
        requires_approval = true;
      }
    }
  }

  // Check medium risk patterns (if not already high or critical)
  if (risk_level === 'low') {
    for (const pattern of RISK_PATTERNS.medium) {
      if (pattern.test(actionString)) {
        risk_factors.push(`Medium risk pattern matched: ${pattern.source}`);
        risk_level = 'medium';
        requires_approval = true;
      }
    }
  }

  // Build risk reason
  if (risk_factors.length > 0) {
    risk_reason = `Action requires ${risk_level} risk approval: ${risk_factors.join(', ')}`;
  } else {
    risk_reason = 'No significant risk factors detected';
  }

  return {
    risk_level,
    requires_approval,
    risk_reason,
    risk_factors
  };
}

/**
 * Determine if an action requires manual approval
 */
export function requiresApproval(action_type: string, action_details: any): boolean {
  const assessment = evaluateRisk(action_type, action_details);
  return assessment.requires_approval;
}

/**
 * Get risk assessment for an action (for API responses)
 */
export function getRiskAssessment(action_type: string, action_details: any): RiskAssessment {
  return evaluateRisk(action_type, action_details);
}
