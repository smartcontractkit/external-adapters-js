#!/bin/bash
set -e

# EA Release Manager
# Helper script to manage the RELEASES.yaml file
# 
# Usage:
#   ./scripts/release-manager.sh add <adapter> <version> <pr_url> <approver> [notes]
#   ./scripts/release-manager.sh release <adapter>
#   ./scripts/release-manager.sh list
#   ./scripts/release-manager.sh status <adapter>
#   ./scripts/release-manager.sh remove <adapter>

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
RELEASES_FILE="$REPO_ROOT/RELEASES.yaml"

# Check if yq is installed
if ! command -v yq &> /dev/null; then
    echo "❌ Error: yq is not installed"
    echo "   Install: brew install yq"
    exit 1
fi

# Check if RELEASES.yaml exists
if [ ! -f "$RELEASES_FILE" ]; then
    echo "❌ Error: RELEASES.yaml not found at $RELEASES_FILE"
    exit 1
fi

# Add adapter to pending releases
add_pending() {
    local adapter=$1
    local version=$2
    local pr_url=$3
    local approver=$4
    local notes="${5:-Tested and approved for release}"
    
    if [ -z "$adapter" ] || [ -z "$version" ] || [ -z "$pr_url" ] || [ -z "$approver" ]; then
        echo "❌ Error: Missing required arguments"
        echo "   Usage: $0 add <adapter> <version> <pr_url> <approver> [notes]"
        echo "   Example: $0 add coingecko 1.5.0 https://github.com/.../pull/123 @myteam"
        exit 1
    fi
    
    # Check if adapter already exists in pending
    if yq eval ".pending | has(\"$adapter\")" "$RELEASES_FILE" | grep -q "true"; then
        echo "⚠️  Warning: $adapter is already in pending releases"
        read -p "   Overwrite? (y/N) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo "   Cancelled"
            exit 0
        fi
    fi
    
    # Add to pending
    yq eval -i ".pending.$adapter.version = \"$version\"" "$RELEASES_FILE"
    yq eval -i ".pending.$adapter.tested_in_infra = true" "$RELEASES_FILE"
    yq eval -i ".pending.$adapter.infra_digest_pr = \"$pr_url\"" "$RELEASES_FILE"
    yq eval -i ".pending.$adapter.infra_merged_at = \"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\"" "$RELEASES_FILE"
    yq eval -i ".pending.$adapter.approved_by = \"$approver\"" "$RELEASES_FILE"
    yq eval -i ".pending.$adapter.notes = \"$notes\"" "$RELEASES_FILE"
    
    echo "✅ Added $adapter v$version to pending releases"
    echo ""
    echo "Next steps:"
    echo "  1. Review RELEASES.yaml to confirm details"
    echo "  2. Commit the change: git add RELEASES.yaml && git commit -m 'Add $adapter to pending releases'"
    echo "  3. Push: git push"
    echo "  4. Release when ready: gh workflow run release.yml -f adapters=$adapter"
}

# Mark adapter as tested (after infra PR merges)
mark_tested() {
    local adapter=$1
    local pr_url=$2
    
    if [ -z "$adapter" ]; then
        echo "❌ Error: Missing adapter name"
        echo "   Usage: $0 mark-tested <adapter> <infra-pr-url>"
        exit 1
    fi
    
    # Check if adapter exists in pending
    if ! yq eval ".pending | has(\"$adapter\")" "$RELEASES_FILE" | grep -q "true"; then
        echo "❌ Error: $adapter is not in pending releases"
        echo "   Add it first with: $0 add $adapter <version> <pr_url> <approver>"
        exit 1
    fi
    
    # Update infra testing status
    yq eval -i ".pending.$adapter.tested_in_infra = true" "$RELEASES_FILE"
    if [ -n "$pr_url" ]; then
        yq eval -i ".pending.$adapter.infra_digest_pr = \"$pr_url\"" "$RELEASES_FILE"
    fi
    yq eval -i ".pending.$adapter.infra_merged_at = \"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\"" "$RELEASES_FILE"
    
    echo "✅ Marked $adapter as tested in infra"
    echo ""
    echo "Next steps:"
    echo "  1. Commit: git add RELEASES.yaml && git commit -m 'Mark $adapter as tested in infra'"
    echo "  2. Push: git push"
    echo "  3. Release when ready: gh workflow run release.yml"
}

# Move adapter from pending to released
mark_released() {
    local adapter=$1
    
    if [ -z "$adapter" ]; then
        echo "❌ Error: Missing adapter name"
        echo "   Usage: $0 release <adapter>"
        exit 1
    fi
    
    # Check if adapter exists in pending
    if ! yq eval ".pending | has(\"$adapter\")" "$RELEASES_FILE" | grep -q "true"; then
        echo "❌ Error: $adapter is not in pending releases"
        echo "   Use '$0 list' to see pending adapters"
        exit 1
    fi
    
    # Get version from pending
    local version=$(yq eval ".pending.$adapter.version" "$RELEASES_FILE")
    
    # Move to released
    yq eval -i ".released.$adapter.version = \"$version\"" "$RELEASES_FILE"
    yq eval -i ".released.$adapter.released_at = \"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\"" "$RELEASES_FILE"
    yq eval -i ".released.$adapter.release_commit = \"$(git rev-parse HEAD)\"" "$RELEASES_FILE"
    yq eval -i ".released.$adapter.public_ecr_tag = \"$version\"" "$RELEASES_FILE"
    
    # Remove from pending
    yq eval -i "del(.pending.$adapter)" "$RELEASES_FILE"
    
    echo "✅ Marked $adapter v$version as released"
    echo ""
    echo "Next steps:"
    echo "  1. Commit: git add RELEASES.yaml && git commit -m 'Mark $adapter as released'"
    echo "  2. Push: git push"
}

# List pending releases
list_pending() {
    echo "📋 Adapters ready for release:"
    echo ""
    
    local pending_count=$(yq eval '.pending | length' "$RELEASES_FILE")
    
    if [ "$pending_count" -eq 0 ]; then
        echo "   No adapters in pending state"
        echo ""
        echo "💡 To add an adapter:"
        echo "   ./scripts/release-manager.sh add <adapter> <version> <pr_url> <approver>"
        return
    fi
    
    yq eval '.pending | to_entries | .[] | 
        "  • " + .key + " v" + .value.version + 
        "\n    Approved by: " + .value.approved_by + 
        "\n    PR: " + .value.infra_digest_pr + 
        "\n    Notes: " + .value.notes + "\n"' "$RELEASES_FILE"
    
    echo ""
    echo "💡 To release:"
    echo "   Single: gh workflow run release.yml -f adapters=<adapter>"
    echo "   All: gh workflow run release.yml -f adapters=all"
}

# Show status of a specific adapter
show_status() {
    local adapter=$1
    
    if [ -z "$adapter" ]; then
        echo "❌ Error: Missing adapter name"
        echo "   Usage: $0 status <adapter>"
        exit 1
    fi
    
    echo "📊 Status for $adapter:"
    echo ""
    
    # Check pending
    if yq eval ".pending | has(\"$adapter\")" "$RELEASES_FILE" | grep -q "true"; then
        echo "   Status: ⏳ Pending Release"
        echo ""
        yq eval ".pending.$adapter | 
            \"   Version: \" + .version + \"\n\" +
            \"   Tested: \" + (.tested_in_infra | tostring) + \"\n\" +
            \"   Approved by: \" + .approved_by + \"\n\" +
            \"   Merged at: \" + .infra_merged_at + \"\n\" +
            \"   PR: \" + .infra_digest_pr + \"\n\" +
            \"   Notes: \" + .notes" "$RELEASES_FILE"
        echo ""
        echo "💡 To release: gh workflow run release.yml -f adapters=$adapter"
        return
    fi
    
    # Check released
    if yq eval ".released | has(\"$adapter\")" "$RELEASES_FILE" | grep -q "true"; then
        echo "   Status: ✅ Released"
        echo ""
        yq eval ".released.$adapter | 
            \"   Version: \" + .version + \"\n\" +
            \"   Released at: \" + .released_at + \"\n\" +
            \"   Commit: \" + .release_commit + \"\n\" +
            \"   Public ECR tag: \" + .public_ecr_tag" "$RELEASES_FILE"
        return
    fi
    
    echo "   Status: ❓ Not Found"
    echo ""
    echo "   $adapter is not in pending or released state"
    echo "   Use '$0 add $adapter <version> <pr_url> <approver>' to add it"
}

# Remove adapter from pending (cancel release)
remove_pending() {
    local adapter=$1
    
    if [ -z "$adapter" ]; then
        echo "❌ Error: Missing adapter name"
        echo "   Usage: $0 remove <adapter>"
        exit 1
    fi
    
    # Check if adapter exists in pending
    if ! yq eval ".pending | has(\"$adapter\")" "$RELEASES_FILE" | grep -q "true"; then
        echo "❌ Error: $adapter is not in pending releases"
        exit 1
    fi
    
    # Remove from pending
    yq eval -i "del(.pending.$adapter)" "$RELEASES_FILE"
    
    echo "✅ Removed $adapter from pending releases"
    echo ""
    echo "Next steps:"
    echo "  1. Commit: git add RELEASES.yaml && git commit -m 'Remove $adapter from pending releases'"
    echo "  2. Push: git push"
}

# Show help
show_help() {
    cat <<EOF
EA Release Manager

Usage: $0 <command> [arguments]

Commands:
  add <adapter> <version> <pr_url> <approver> [notes]
      Add an adapter to pending releases after it has been tested in infra
      
      Example:
        $0 add coingecko 1.5.0 https://github.com/.../pull/123 @myteam "Tested for 48h"
  
  mark-tested <adapter> [infra-pr-url]
      Mark an adapter as tested in infra (after infra-k8s PR merges)
      Updates tested_in_infra flag to true
      
      NOTE: This is now AUTOMATED via infra-k8s workflow!
            Only use this command for manual overrides or corrections.
      
      Example:
        $0 mark-tested coingecko https://github.com/.../pull/456
  
  release <adapter>
      Mark an adapter as released (moves from pending to released)
      This is typically done automatically by the release workflow
      
      Example:
        $0 release coingecko
  
  list
      List all adapters in pending state (ready for release)
      
      Example:
        $0 list
  
  status <adapter>
      Show detailed status of a specific adapter
      
      Example:
        $0 status coingecko
  
  remove <adapter>
      Remove an adapter from pending (cancel its release)
      
      Example:
        $0 remove coingecko
  
  help
      Show this help message

Examples:
  # After infra testing is complete, add adapter to pending
  $0 add coingecko 1.5.0 https://github.com/.../pull/123 @data-feeds-team

  # List what's ready to release
  $0 list

  # Check status of specific adapter
  $0 status coingecko

  # Release the adapter
  gh workflow run release.yml -f adapters=coingecko

See IMPLEMENTATION_GUIDE.md for detailed workflow documentation.
EOF
}

# Main command dispatcher
case "${1:-help}" in
    add)
        add_pending "$2" "$3" "$4" "$5" "$6"
        ;;
    mark-tested)
        mark_tested "$2" "$3"
        ;;
    release)
        mark_released "$2"
        ;;
    list)
        list_pending
        ;;
    status)
        show_status "$2"
        ;;
    remove)
        remove_pending "$2"
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        echo "❌ Error: Unknown command '$1'"
        echo ""
        show_help
        exit 1
        ;;
esac



