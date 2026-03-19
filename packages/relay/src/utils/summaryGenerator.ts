/**
 * Summary Generator
 * 
 * Converts raw action_type and action_details into human-readable summaries
 * for approval requests.
 */

interface ActionDetails {
  path?: string;
  content?: string;
  lines?: number;
  size?: number;
  method?: string;
  url?: string;
  command?: string;
  [key: string]: unknown;
}

interface SummaryResult {
  summary: string;
  action_type: string;
  action_details: ActionDetails;
}

/**
 * Generate a human-readable summary from action_type and action_details
 */
export function generateSummary(action_type: string, action_details: ActionDetails): string {
  switch (action_type) {
    case 'file_delete':
      return generateFileDeleteSummary(action_details);
    
    case 'file_write':
      return generateFileWriteSummary(action_details);
    
    case 'file_read':
      return generateFileReadSummary(action_details);
    
    case 'command_execute':
      return generateCommandSummary(action_details);
    
    case 'api_call':
      return generateApiCallSummary(action_details);
    
    default:
      return `Action: ${action_type}`;
  }
}

/**
 * Generate summary for file_delete action
 * Example: "Delete file '/tmp/test.txt' (1 KB)"
 */
function generateFileDeleteSummary(details: ActionDetails): string {
  const path = details.path || 'unknown file';
  const size = details.size;
  
  if (size !== undefined) {
    const sizeStr = formatSize(size as number);
    return `Delete file '${path}' (${sizeStr})`;
  }
  
  return `Delete file '${path}'`;
}

/**
 * Generate summary for file_write action
 * Example: "Write 42 lines to '/src/index.ts'"
 */
function generateFileWriteSummary(details: ActionDetails): string {
  const path = details.path || 'unknown file';
  const lines = details.lines;
  const content = details.content as string | undefined;
  
  if (lines !== undefined) {
    return `Write ${lines} lines to '${path}'`;
  }
  
  if (content !== undefined) {
    const lineCount = (content as string).split('\n').length;
    return `Write ${lineCount} lines to '${path}'`;
  }
  
  return `Write to '${path}'`;
}

/**
 * Generate summary for file_read action
 * Example: "Read '/etc/config.json'"
 */
function generateFileReadSummary(details: ActionDetails): string {
  const path = details.path || 'unknown file';
  return `Read '${path}'`;
}

/**
 * Generate summary for command_execute action
 * Example: "Run command: 'npm install'"
 */
function generateCommandSummary(details: ActionDetails): string {
  const command = details.command || details.cmd || 'unknown command';
  return `Run command: '${command}'`;
}

/**
 * Generate summary for api_call action
 * Example: "Call API: POST https://api.example.com/users"
 */
function generateApiCallSummary(details: ActionDetails): string {
  const method = details.method || 'GET';
  const url = details.url || 'unknown URL';
  return `Call API: ${method} ${url}`;
}

/**
 * Format file size in human-readable format
 */
function formatSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Process approval request with summary generation
 */
export function processApprovalRequest(
  action_type: string,
  action_details: ActionDetails
): SummaryResult {
  const summary = generateSummary(action_type, action_details);
  
  return {
    summary,
    action_type,
    action_details
  };
}
