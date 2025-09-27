#!/usr/bin/env bash
set -euo pipefail

args_to_ignore=()
args_adapters=()

if [[ -n "${1:-}" ]]; then
  eas_to_include="$(echo "$*" | sed -e 's/ *, */ /g' | tr ' ' '\n')"
  packages_to_include="$(echo "$eas_to_include" | tr ' ' '\n' | sed -e 's|.*|@chainlink/&-adapter|')"

  all_packages=$(yarn workspaces list --json | jq -r '.name' | grep -v '@chainlink/external-adapters-js')

  args_to_ignore=($(echo "$all_packages" | grep -vFf <(echo "$packages_to_include" | tr ' ' '\n') | sed -e 's|^|--ignore |'))
  args_adapters=($(echo "$eas_to_include" | tr ' ' '\n' | sed -e 's|^|--adapters &|'))
fi

export UPSTREAM_BRANCH=main
yarn changeset version "${args_to_ignore[@]}"
yarn generate:master-list -v
yarn generate:readme -v "${args_adapters[*]}"
git add MASTERLIST.md "*README.md"
yarn lint-staged
