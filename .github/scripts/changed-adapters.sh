#!/bin/bash -e

SOURCE_DIR=$(dirname "$0")

# If BUILD_ALL is true, then we want to generate lists with all packages regardless of changes
if [[ $BUILD_ALL = true ]]; then
  CHANGED_PACKAGES_AND_ADAPTERS=$("$SOURCE_DIR/list-packages-adapters.sh")
else
  CHANGED_PACKAGES_AND_ADAPTERS=$("$SOURCE_DIR/list-packages-adapters.sh" "$UPSTREAM_BRANCH")
fi

CHANGED_PACKAGES=$(echo $CHANGED_PACKAGES_AND_ADAPTERS | jq -c '.packages')
CHANGED_ADAPTERS=$(echo $CHANGED_PACKAGES_AND_ADAPTERS | jq -c '{adapter: .adapters}')

echo "CHANGED_PACKAGES=$CHANGED_PACKAGES" >> $GITHUB_OUTPUT
echo "CHANGED_ADAPTERS=$CHANGED_ADAPTERS" >> $GITHUB_OUTPUT
