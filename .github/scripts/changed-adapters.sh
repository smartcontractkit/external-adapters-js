#!/bin/bash -e

# If BUILD_ALL is true, then we want to generate lists with all packages regardless of changes
# If ADAPTER_NAMES is set, then we want to generate lists with only those adapters. ADAPTER_NAMES should be a comma-separated list of short names (e.g. "coinpaprika,coingecko")
if [[ $BUILD_ALL = true ]]; then
  PACKAGE_LIST=$(yarn workspaces list -R --json)
elif [[ -n "$ADAPTER_NAMES" ]]; then
  PACKAGE_LIST=$(yarn workspaces list -R --json | jq --arg list "$ADAPTER_NAMES" '($list | split(",")) as $shortNames | select(.name as $name | $shortNames | any($name == "@chainlink/" + . + "-adapter"))')
else
  PACKAGE_LIST=$(yarn workspaces list -R --json --since=$UPSTREAM_BRANCH)
fi

# The yarn command used above will give us a list of the packages that have changed (including changes by dependencies)
CHANGED_PACKAGES=$(
  echo $PACKAGE_LIST \
  | jq -cs '.' \
  | jq -cr '[.[] | select(.location | startswith("packages"))]' \
)

# Add versions to the packages
CHANGED_PACKAGES=$(
  for package in $(echo $CHANGED_PACKAGES | jq -c '.[]'); do
    location=$(echo $package | jq -r '.location')
    version=$(jq '.version' $location/package.json)
    echo $package | jq -c ".version = $version"
  done | jq -cs '.'
)

# Build a list to use with matrix strategies
CHANGED_ADAPTERS=$(
  echo $CHANGED_PACKAGES \
  | jq -cr '{
      adapter: [
        .[]
        | select(
          .location
          | startswith("packages/sources") or startswith("packages/composites") or startswith("packages/targets"))
          | .shortName = (.name | match("@chainlink/(.*)-adapter").captures[0].string)
      ]
    }'
)

echo "CHANGED_PACKAGES=$CHANGED_PACKAGES" >> $GITHUB_OUTPUT
echo "CHANGED_ADAPTERS=$CHANGED_ADAPTERS" >> $GITHUB_OUTPUT
