#!/bin/bash
set -euo pipefail

UPSTREAM="${1:-"HEAD"}"
VERSIONS_FILE="public-adapter-versions.yml"

git show "$UPSTREAM:$VERSIONS_FILE" | yq eval-all -o=json '
  (select(fileIndex == 0) | .adapters | map({"key": .name, "value": { "old_version" : .version} }) | from_entries) as $old
  | (select(fileIndex == 1) | .adapters | map({"key": .name, "value": { "new_version" : .version} }) | from_entries) as $new
  | $old * $new
  | to_entries
  | map(select(.value.old_version != .value.new_version))
  | map({"name": .key, "old_version": .value.old_version, "new_version": .value.new_version})
' - "$VERSIONS_FILE" 
