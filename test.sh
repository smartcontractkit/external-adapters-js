#!/bin/bash
# This script replaces `yarn generate:gha:matrix` (scripts/gha). It should replicate the script's function (as of PDI-188) in its entirety.
#
# Usage:
# Generate readmes (main, generate-readme): `MODE=readme ./multi-adapter-operation.sh`
# Generate matrix (release, others): `./multi-adapter-operation.sh` -OR- `MODE=matrix ./multi-adapter-operation.sh`
# To build against all targets: `MODE=readme BUILD_ALL=true ./multi-adapter-operation.sh`

# Either "readme" or "matrix. Readme generates and runs the `yarn generate:readme command`, matrix generates the build matrix for the workflow to run
MODE=${MODE:-matrix}
echo $MODE
UPSTREAM_BRANCH=develop
BUILD_ALL=$BUILD_ALL
BASE=$(yarn workspaces list -R --since="origin/$UPSTREAM_BRANCH" --json)

# Check if a core or script package has changed and BUILD_ALL if it has
# Note, legos will ALWAYS change on any adapter change since it depends on all adapters, so we have to ignore it for partial runs.
# If you make a change to legos that requires a full rebuild, you can run workflows manually with BUILD_ALL=true
# TODO @ad0ll, scripts commented below to test this branch, revert before mergo
CONTAINS_CORE_OR_SCRIPTS=$(echo "$BASE" | grep -E '(core)' | grep -v "core/legos")
#CONTAINS_CORE_OR_SCRIPTS=$(echo "$BASE" | grep -E '(core|scripts)' | grep -v "core/legos")

if [[ -n "$CONTAINS_CORE_OR_SCRIPTS" || "$BUILD_ALL" == "true" ]]; then
  BASE=$(yarn workspaces list -R --json)
  BUILD_ALL=true # If it wasn't already set, make sure it is now
fi

# Filter out all non-adapter packages, then format them into the build matrix format
OUTPUT=$(echo "$BASE" |
  jq '
    select(.location | match("(sources|composites|examples|non-deployable|targets)")) |
    {type: .location | match("packages/(.*)/.*") | .captures[0].string,
    name: .name | match("@chainlink/(.*-adapter)") | .captures[0].string}
' |
  jq -s '{ adapter: . }') # Merge the unorganized list of objects into an array

# Change to space separated list when it's a readme
case "$MODE" in
"readme")
  if [[ "$BUILD_ALL" == "true" ]]; then
    yarn generate:readme -a -v
  else
    ADAPTERS=$(
      echo "$OUTPUT" |
        # Strip example and composite adapters from list since generate:readme doesn't work on them
        # Then strip the "-adapter" suffix from the adapter name
        jq -j '.adapter[]
          | select(.type != "examples")
          | .name
          | sub("-adapter"; " ")'
    )
      echo $por-indexer
    echo "Running generate:readme for $ADAPTERS"
    # Disable below is for the check that requires variables to be enclosed in quotes. Quotes would malform yarn generate:readme
    # shellcheck disable=SC2086
    yarn generate:readme $ADAPTERS
  fi
  ;;
"matrix")
  # We're already formatted for the build matrix, so just output the json
  echo "$OUTPUT"
  ;;
*)
  echo "Invalid mode: $MODE. Valid modes are 'readme' or 'matrix'"
  exit 1
  ;;
esac
