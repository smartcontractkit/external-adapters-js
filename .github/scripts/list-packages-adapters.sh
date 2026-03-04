#!/bin/bash -e

SOURCE_DIR="$(dirname "$0")"

UPSTREAM_BRANCH="${1:-}"

PACKAGE_LIST=$(yarn workspaces list -R --json)

if [[ -z "$UPSTREAM_BRANCH" ]]; then
  PACKAGE_LIST=$(yarn workspaces list -R --json)
else
  changed_packages="$(yarn workspaces list --json --since=$UPSTREAM_BRANCH | jq -r 'select(.location | startswith("packages")) | .name')"
  packages_to_include="$($SOURCE_DIR/get-reverse-dependencies.sh "$changed_packages")"
  # Keep only the packages changed since UPSTREAM_BRANCH
  PACKAGE_LIST=$(
    echo $PACKAGE_LIST \
    | jq -cr --arg packages "$packages_to_include" '($packages | split("\n")) as $packageNames | select(.name as $name | $packageNames | any($name == .))'
  )
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
echo $CHANGED_PACKAGES \
  | jq -cr '{
      packages: .,
      adapters: [
        .[]
        | select(
          .location
          | startswith("packages/sources") or startswith("packages/composites") or startswith("packages/targets"))
          | .shortName = (.name | match("@chainlink/(.*)-adapter").captures[0].string)
      ]
    }'
