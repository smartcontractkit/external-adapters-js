#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${1:-}" ]]; then
  exit 0
fi

eas_to_include="$(echo "$*" | sed -e 's/ *, */ /g' | tr ' ' '\n')"
packages_to_include="$(echo "$eas_to_include" | tr ' ' '\n' | sed -e 's|.*|@chainlink/&-adapter|')"

all_packages=$(yarn workspaces list --json | jq -r '.name' | grep -v '@chainlink/external-adapters-js')

packages_to_ignore="$(echo "$all_packages" | grep -vFf <(echo "$packages_to_include" | tr ' ' '\n'))"

echo "$packages_to_ignore"
