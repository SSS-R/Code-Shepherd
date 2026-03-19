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

interface ActionDetails {
  path?: string;
  command?: string;
  branch?: string;
  environment?: string;
  url?: string;
  [key: string]: unknown;
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

const SECRET_PATH_PATTERNS = [/\.env/i, /secret/i, /credential/i, /token/i, /private[_-]?key/i, /id_rsa/i];
const INFRA_PATH_PATTERNS = [/docker/i, /k8s/i, /kubernetes/i, /terraform/i, /helm/i, /infra/i, /deployment/i, /github\/workflows/i];
const PROD_BRANCH_PATTERNS = [/^main$/i, /^master$/i, /^production$/i, /^release\//i, /^hotfix\//i];

function extractSignals(action_type: string, action_details: ActionDetails): {
  path: string;
  command: string;
  branch: string;
  environment: string;
  url: string;
  actionText: string;
} {
  const path = typeof action_details.path === 'string' ? action_details.path : '';
  const command = typeof action_details.command === 'string' ? action_details.command : '';
  const branch = typeof action_details.branch === 'string' ? action_details.branch : '';
  const environment = typeof action_details.environment === 'string' ? action_details.environment : '';
  const url = typeof action_details.url === 'string' ? action_details.url : '';
  const actionText = `${action_type} ${JSON.stringify(action_details)}`;

  return { path, command, branch, environment, url, actionText };
}

function hasPatternMatch(patterns: RegExp[], value: string): boolean {
  return patterns.some((pattern) => pattern.test(value));
}

function pushUnique(riskFactors: string[], message: string): void {
  if (!riskFactors.includes(message)) {
    riskFactors.push(message);
  }
}

/**
 * Evaluate the risk level of an action
 */
export function evaluateRisk(action_type: string, action_details: ActionDetails): RiskAssessment {
  const risk_factors: string[] = [];
  let risk_level: 'low' | 'medium' | 'high' | 'critical' = 'low';
  let requires_approval = false;
  let risk_reason = '';
  const { path, command, branch, environment, url, actionText } = extractSignals(action_type, action_details);

  // Check critical patterns
  for (const pattern of RISK_PATTERNS.critical) {
    if (pattern.test(actionText)) {
      pushUnique(risk_factors, `Critical pattern matched: ${pattern.source}`);
      risk_level = 'critical';
      requires_approval = true;
    }
  }

  if (path && hasPatternMatch(SECRET_PATH_PATTERNS, path)) {
    pushUnique(risk_factors, `Sensitive file path targeted: ${path}`);
    risk_level = 'critical';
    requires_approval = true;
  }

  if (environment && /prod/i.test(environment)) {
    pushUnique(risk_factors, `Production environment targeted: ${environment}`);
    risk_level = 'critical';
    requires_approval = true;
  }

  if (branch && hasPatternMatch(PROD_BRANCH_PATTERNS, branch)) {
    pushUnique(risk_factors, `Protected branch targeted: ${branch}`);
    risk_level = 'critical';
    requires_approval = true;
  }

  // Check high risk patterns (if not already critical)
  if (risk_level !== 'critical') {
    for (const pattern of RISK_PATTERNS.high) {
      if (pattern.test(actionText)) {
        pushUnique(risk_factors, `High risk pattern matched: ${pattern.source}`);
        risk_level = 'high';
        requires_approval = true;
      }
    }

    if (path && hasPatternMatch(INFRA_PATH_PATTERNS, path)) {
      pushUnique(risk_factors, `Infrastructure-related path modified: ${path}`);
      risk_level = 'high';
      requires_approval = true;
    }

    if (action_type === 'file_delete') {
      pushUnique(risk_factors, 'File deletion requested');
      risk_level = 'high';
      requires_approval = true;
    }

    if (command && /git\s+push/i.test(command) && hasPatternMatch(PROD_BRANCH_PATTERNS, branch || command)) {
      pushUnique(risk_factors, 'Push to protected branch detected');
      risk_level = 'high';
      requires_approval = true;
    }
  }

  // Check medium risk patterns (if not already high or critical)
  if (risk_level === 'low') {
    for (const pattern of RISK_PATTERNS.medium) {
      if (pattern.test(actionText)) {
        pushUnique(risk_factors, `Medium risk pattern matched: ${pattern.source}`);
        risk_level = 'medium';
        requires_approval = true;
      }
    }

    if (action_type === 'command_execute' && command) {
      pushUnique(risk_factors, `Command execution requested: ${command}`);
      risk_level = 'medium';
      requires_approval = true;
    }

    if (action_type === 'api_call' && url) {
      pushUnique(risk_factors, `External API call requested: ${url}`);
      risk_level = 'medium';
      requires_approval = true;
    }

    if (action_type === 'file_write' && path) {
      pushUnique(risk_factors, `File modification requested: ${path}`);
      risk_level = 'medium';
      requires_approval = true;
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
