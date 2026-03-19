/**
 * Diff Generator
 * 
 * Generates lightweight unified diffs for file_write approval requests.
 */


interface DiffResult {
  diff: string | null;
  is_new_file: boolean;
  has_old_content: boolean;
  has_new_content: boolean;
}

interface FileActionDetails {
  path?: string;
  old_content?: string;
  new_content?: string;
  content?: string;
  [key: string]: unknown;
}

/**
 * Generate a unified diff from action_details
 * 
 * @param action_details - The action details from the approval request
 * @returns DiffResult with diff string and metadata
 */
export function generateDiff(action_details: FileActionDetails): DiffResult {
  const { path = 'unknown', old_content, new_content, content } = action_details;

  // Case 1: New file (no old_content)
  if (!old_content) {
    const actualContent = new_content || content || '';
    return {
      diff: null,
      is_new_file: true,
      has_old_content: false,
      has_new_content: !!actualContent
    };
  }

  // Case 2: File modification (has both old and new content)
  if (new_content !== undefined) {
    const diff = createUnifiedDiff(path, old_content, new_content);

    return {
      diff,
      is_new_file: false,
      has_old_content: true,
      has_new_content: true
    };
  }

  // Case 3: Fallback - only content provided (treat as new content)
  return {
    diff: null,
    is_new_file: true,
    has_old_content: false,
    has_new_content: !!content
  };
}

function createUnifiedDiff(path: string, oldContent: string, newContent: string): string {
  const oldLines = oldContent.split('\n');
  const newLines = newContent.split('\n');
  const maxLines = Math.max(oldLines.length, newLines.length);
  const body: string[] = [];

  for (let index = 0; index < maxLines; index += 1) {
    const before = oldLines[index];
    const after = newLines[index];

    if (before === after) {
      if (before !== undefined) {
        body.push(` ${before}`);
      }
      continue;
    }

    if (before !== undefined) {
      body.push(`-${before}`);
    }

    if (after !== undefined) {
      body.push(`+${after}`);
    }
  }

  return [
    `--- a/${path}`,
    `+++ b/${path}`,
    `@@ -1,${oldLines.length} +1,${newLines.length} @@`,
    ...body,
  ].join('\n');
}

/**
 * Process approval request with diff generation
 * 
 * @param action_type - The action type (e.g., 'file_write')
 * @param action_details - The action details
 * @returns Object with diff and metadata
 */
export function processApprovalWithDiff(
  action_type: string,
  action_details: FileActionDetails
): { diff: string | null; is_new_file: boolean } {
  // Only generate diffs for file_write actions
  if (action_type !== 'file_write') {
    return { diff: null, is_new_file: false };
  }

  const result = generateDiff(action_details);
  return {
    diff: result.diff,
    is_new_file: result.is_new_file
  };
}
