#!/bin/bash
# TASK CHECKLIST MANAGER
# Create, load, save, and resume task checklists

set -e

CHECKLISTS_DIR="commits/checklists"
mkdir -p "$CHECKLISTS_DIR"

usage() {
    echo "Task Checklist Manager"
    echo ""
    echo "Usage:"
    echo "  ./scripts/task-checklist.sh create <task-name>  - Create new checklist"
    echo "  ./scripts/task-checklist.sh load <task-name>    - Load existing checklist"
    echo "  ./scripts/task-checklist.sh save <task-name>    - Save current progress"
    echo "  ./scripts/task-checklist.sh list                - List all checklists"
    echo "  ./scripts/task-checklist.sh resume              - Resume most recent"
    echo "  ./scripts/task-checklist.sh status              - Show current status"
    echo ""
}

create_checklist() {
    local task_name="$1"
    local date=$(date +%Y-%m-%d-%H%M)
    local filename="${CHECKLISTS_DIR}/${date}-${task_name}.md"
    
    if [ -f "$filename" ]; then
        echo "❌ Checklist already exists: $filename"
        exit 1
    fi
    
    cp TASK_CHECKLIST.md "$filename"
    
    # Update header
    sed -i "s/\[TASK_NAME\]/$task_name/g" "$filename"
    sed -i "s/YYY-MM-DD HH:MM/$(date '+%Y-%m-%d %H:%M')/g" "$filename"
    
    echo "✅ Created checklist: $filename"
    echo ""
    echo "Next steps:"
    echo "  1. Edit $filename"
    echo "  2. Fill out phases as you work"
    echo "  3. Run: ./scripts/task-checklist.sh save $task_name"
}

load_checklist() {
    local task_name="$1"
    local file=$(ls -t "$CHECKLISTS_DIR"/*-$task_name*.md 2>/dev/null | head -1)
    
    if [ -z "$file" ]; then
        echo "❌ No checklist found for: $task_name"
        echo ""
        echo "Available checklists:"
        ls -1 "$CHECKLISTS_DIR"/*.md 2>/dev/null | sed 's/.*\///' || echo "  (none)"
        exit 1
    fi
    
    echo "✅ Loaded: $file"
    echo ""
    cat "$file"
}

save_checklist() {
    local task_name="$1"
    local file=$(ls -t "$CHECKLISTS_DIR"/*-$task_name*.md 2>/dev/null | head -1)
    
    if [ -z "$file" ]; then
        echo "❌ No checklist found for: $task_name"
        echo "Creating new one..."
        create_checklist "$task_name"
        return
    fi
    
    # Update timestamp
    sed -i "s/Status: .*/Status: IN_PROGRESS/" "$file" 2>/dev/null || true
    sed -i "s/\*\*Session:\*\* .*/\*\*Session:\*\* discord/" "$file" 2>/dev/null || true
    
    echo "✅ Saved progress: $file"
    echo ""
    echo "To resume later:"
    echo "  ./scripts/task-checklist.sh resume"
}

list_checklists() {
    echo "Task Checklists:"
    echo ""
    ls -1 "$CHECKLISTS_DIR"/*.md 2>/dev/null | while read file; do
        basename "$file"
        # Extract status from file
        grep -m1 "Status:" "$file" 2>/dev/null | sed 's/.*Status: /  → /' || echo "  → (no status)"
    done || echo "  (none)"
}

resume_checklist() {
    local file=$(ls -t "$CHECKLISTS_DIR"/*.md 2>/dev/null | head -1)
    
    if [ -z "$file" ]; then
        echo "❌ No checklists found"
        exit 1
    fi
    
    echo "✅ Resuming: $file"
    echo ""
    
    # Show quick status
    echo "=== Quick Status ==="
    grep -A3 "Quick Status" "$file" 2>/dev/null || echo "(no status section)"
    echo ""
    
    echo "=== Last Completed Phase ==="
    grep -m1 "Last Completed Phase:" "$file" 2>/dev/null || echo "(not set)"
    echo ""
    
    echo "=== Full Checklist ==="
    cat "$file"
}

show_status() {
    local file=$(ls -t "$CHECKLISTS_DIR"/*.md 2>/dev/null | head -1)
    
    if [ -z "$file" ]; then
        echo "❌ No active checklists"
        exit 1
    fi
    
    echo "Current Task: $(basename "$file")"
    echo ""
    
    # Show progress table
    echo "=== Progress ==="
    grep -A8 "Progress Tracker" "$file" 2>/dev/null || echo "(no progress section)"
    echo ""
    
    # Show completed phases
    echo "=== Completed ==="
    grep "✅" "$file" 2>/dev/null | head -10 || echo "(nothing completed yet)"
    echo ""
    
    # Show next action
    echo "=== Next Action ==="
    grep "Next Action:" "$file" 2>/dev/null || echo "(not set)"
}

# Main command
case "${1:-}" in
    create)
        if [ -z "${2:-}" ]; then
            echo "❌ Task name required"
            usage
            exit 1
        fi
        create_checklist "$2"
        ;;
    load)
        load_checklist "${2:-}"
        ;;
    save)
        save_checklist "${2:-current}"
        ;;
    list)
        list_checklists
        ;;
    resume)
        resume_checklist
        ;;
    status)
        show_status
        ;;
    *)
        usage
        ;;
esac
