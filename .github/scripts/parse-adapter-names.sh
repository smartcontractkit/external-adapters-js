#!/bin/bash -e

# Converts a comma-separated list of adapter short names into the JSON matrix
# format expected by GitHub Actions matrix strategies.
#
# Usage: parse-adapter-names.sh "coinbase,tiingo,ncfx"
# Output (on stdout): {"adapter":[{"shortName":"coinbase","name":"@chainlink/coinbase-adapter","location":"packages/sources/coinbase","version":"3.1.0"}, ...]}

ADAPTERS="${1:?Usage: parse-adapter-names.sh <comma-separated-adapter-names>}"
ADAPTER_JSON='{"adapter":[]}'

IFS=',' read -ra NAMES <<< "$ADAPTERS"
for name in "${NAMES[@]}"; do
  name=$(echo "$name" | xargs)

  LOCATION=$(yarn workspaces list --json | jq -r --arg name "@chainlink/${name}-adapter" 'select(.name == $name) | .location')

  if [[ -z "$LOCATION" ]]; then
    echo "::error::Adapter '${name}' not found" >&2
    exit 1
  fi

  VERSION=$(jq -r '.version' "$LOCATION/package.json")
  PACKAGE_NAME="@chainlink/${name}-adapter"

  ADAPTER_JSON=$(echo "$ADAPTER_JSON" | jq -c \
    --arg shortName "$name" \
    --arg adapterName "$PACKAGE_NAME" \
    --arg location "$LOCATION" \
    --arg version "$VERSION" \
    '.adapter += [{"shortName": $shortName, "name": $adapterName, "location": $location, "version": $version}]')
done

echo "$ADAPTER_JSON"
