#!/bin/bash
set -euo pipefail

SOURCE_DIR="$(dirname "$0")"
TOP_DIR="$(git rev-parse --show-toplevel)"
OUTPUT_FILE="$TOP_DIR/public-adapter-versions.yml"

"$SOURCE_DIR/list-packages-adapters.sh" | yq -P '{
  "adapters":
    .adapters |
      map({"name": .shortName, "version": .version}) |
      sort_by(.name)
}' >"$OUTPUT_FILE"

echo "Updated public adapter versions in $OUTPUT_FILE"
