#!/bin/bash
# PRE-COMMIT VERIFICATION SCRIPT
# Run this BEFORE git commit. It will fail if common mistakes are detected.

set -e

echo "=========================================="
echo "  PRE-COMMIT VERIFICATION"
echo "=========================================="
echo ""

cd "$(dirname "$0")/.."

ERRORS=0

# 1. Check for uncommitted changes
echo "✓ Checking git status..."
if ! git diff --quiet --exit-code; then
    echo "  → Uncommitted changes detected (expected)"
else
    echo "  → No changes to commit"
    exit 1
fi

# 2. Check for TypeScript errors
echo "✓ Checking TypeScript..."
if [ -f "packages/relay/tsconfig.json" ]; then
    if ! npm run build --workspace=@agentops/relay --if-present 2>&1 | grep -q "error TS"; then
        echo "  → Relay: OK"
    else
        echo "  → Relay: TypeScript errors detected"
        ERRORS=$((ERRORS + 1))
    fi
fi

if [ -f "packages/ui/tsconfig.json" ]; then
    if ! npm run build --workspace=@agentops/ui --if-present 2>&1 | grep -q "error TS"; then
        echo "  → UI: OK"
    else
        echo "  → UI: TypeScript errors detected"
        ERRORS=$((ERRORS + 1))
    fi
fi

# 3. Check for duplicate interface definitions
echo "✓ Checking for duplicate interfaces..."
DUPLICATES=$(rg "interface (TimelineEvent|Agent|Approval)" --type ts --count | awk -F: '$2 > 1 {print $1}' | wc -l)
if [ "$DUPLICATES" -gt 0 ]; then
    echo "  → WARNING: $DUPLICATES files may have duplicate interfaces"
    echo "  → Run: rg \"interface <Name>\" --type ts"
fi

# 4. Check that routes are mounted
echo "✓ Checking route mounts..."
if grep -q "createAuditRoutes" packages/relay/src/index.ts && ! grep -q "app.use.*audit" packages/relay/src/index.ts; then
    echo "  → ERROR: createAuditRoutes defined but not mounted"
    ERRORS=$((ERRORS + 1))
else
    echo "  → Routes: OK"
fi

# 5. Check for export keywords on shared interfaces
echo "✓ Checking exports..."
if rg "^interface " packages/ui/src/components/ --type ts | grep -v "export"; then
    echo "  → WARNING: Some interfaces may not be exported"
    echo "  → Run: rg \"^interface\" packages/ui/src/components/"
fi

# 6. Show diff summary
echo "✓ Files about to be committed:"
git diff --stat --cached 2>/dev/null || git diff --stat

echo ""
echo "=========================================="
if [ "$ERRORS" -gt 0 ]; then
    echo "  ❌ VERIFICATION FAILED ($ERRORS errors)"
    echo "=========================================="
    echo ""
    echo "Fix the errors above before committing."
    echo "Read PRE_COMMIT_CHECKLIST.md for guidance."
    exit 1
else
    echo "  ✅ VERIFICATION PASSED"
    echo "=========================================="
    echo ""
    echo "Ready to commit. Don't forget to:"
    echo "  1. Fill out PRE_COMMIT_CHECKLIST.md"
    echo "  2. Save checklist to commits/DATE-task.md"
    exit 0
fi
