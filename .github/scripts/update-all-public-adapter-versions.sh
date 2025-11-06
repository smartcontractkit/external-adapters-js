#!/bin/bash
set -euo pipefail

SOURCE_DIR="$(dirname "$0")"
TOP_DIR="$(git rev-parse --show-toplevel)"
VERSIONS_FILE="$TOP_DIR/public-adapter-versions.yml"
TMP_OUTPUT_FILE="$(mktemp)"

# Takes existing entries from public-adapter-versions.yml and updated versions
# from list-packages-adapters.sh, turns both into a map and merges those maps.
"$SOURCE_DIR/list-packages-adapters.sh" "$@" | yq eval-all -P '
  (select(fileIndex == 0) | .adapters | map({"key": .name, "value": .version}) | from_entries) as $existing
  | (select(fileIndex == 1) | .adapters | map({"key": .shortName, "value": .version}) | from_entries) as $updates
  | $existing * $updates
  | to_entries | map({"name": .key, "version": .value}) | sort_by(.name)
  | {"adapters": .}
' "$VERSIONS_FILE" - > "$TMP_OUTPUT_FILE"
mv "$TMP_OUTPUT_FILE" "$VERSIONS_FILE"

echo "Updated public adapter versions in $VERSIONS_FILE"
