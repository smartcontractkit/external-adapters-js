#!/bin/bash
set -euo pipefail

SOURCE_DIR="$(dirname "$0")"
TOP_DIR="$(git rev-parse --show-toplevel)"
cd "$TOP_DIR"
VERSIONS_FILE="public-adapter-versions.yml"

if [[ "${BUILD_ALL:-}" == "true" ]]; then
  yq --output-format json '{ "adapter": .adapters | map({"shortName": .name, "version": .version}) }' "$VERSIONS_FILE" | jq -c
  exit 0
fi

UPSTREAM="${1:-"${UPSTREAM_BRANCH:-HEAD~1}"}"
echo "Comparing against upstream: $UPSTREAM" >&2

# Outputs JSON to be used as matrix strategy in release.yml.
git show "$UPSTREAM:$VERSIONS_FILE" | yq --output-format json '{ "adapter": [ .adapters | map({"key":(.name), "value":(.version)}) | from_entries as $old | load("'"$VERSIONS_FILE"'") | .adapters[] | select(.version != $old[.name]) | {"shortName": .name, "version": .version} ] }' | jq -c
