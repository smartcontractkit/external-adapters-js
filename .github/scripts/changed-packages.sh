#!/bin/bash -e

CHANGED_PACKAGES=$(
  yarn workspaces list -R --json --since=head^ \
  | jq -cs '.' \
  | jq -cr '[.[] | select(.location | startswith("packages"))]' \
)

# Add versions
CHANGED_PACKAGES=$(
  for package in $(echo $CHANGED_PACKAGES | jq -c '.[]'); do
    location=$(echo $package | jq -r '.location')
    version=$(jq '.version' $location/package.json)
    echo $package | jq -c ".version = $version"
  done | jq -cs '.'
)

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

echo $CHANGED_ADAPTERS
# echo "CHANGED_PAC?PTERS=$CHANGED_ADAPTERS" >> $GITHUB_OUTPUT
