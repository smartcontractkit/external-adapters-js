#!/usr/bin/env bash

# This is a utility script to get a list of changed adapters. You can use it in a helper script with the following:
# source .github/get-changed-adapters-array.sh
# # Iteration:
#     CHANGED_ADAPTERS=$(getChangedAdapterArray)
#     for adapter in $CHANGED_ADAPTERS; do
#       echo "$adapter"
#     done
# # As space separated string:
#     SPACE_SEPARATED=$(getChangedAdapterArray)


if [[ -z $UPSTREAM_BRANCH ]]; then
  UPSTREAM_BRANCH=develop
fi
REGEX="@chainlink/(.*-adapter)"

# DO NOT USE echo IN THIS SCRIPT EXCEPT TO DUMP THE RESULT
# Any echoed lines will appear in the output array.
function getChangedAdapterArray(){
  adapterSet=()
  for line in $(git diff --name-only "origin/$UPSTREAM_BRANCH"...HEAD); do
    # Returning this keyword will instruct the workflow to run against all adapters instead of a filtered list
#    if [[ $line =~ ^packages/(core|scripts|non-deployable) ||  $line =~ grafana/ ]]; then
    # TODO Below temporarily has scripts cut out to demo. Scripts should trigger a full build in the final PR.
    if [[ $line =~ ^packages/(core|non-deployable) ||  $line =~ grafana/ ]]; then
      echo "BUILD_ALL"
    fi
    # Note that "packages/examples" is omitted below because the workflows that call this (generate-readme) can't run against them
    if [[ $line =~ ^packages/(sources|composites|non-deployable|targets)/([a-zA-Z-]*)/.*$ ]]; then
      adapterName=$(echo "$line" |
      sed  -e 's/packages\/sources\/\(.*\)\/.*/\1/g' \
           -e 's/packages\/targets\/\(.*\)\/.*/\1/g' \
           -e 's/packages\/non-deployable\/\(.*\)\/.*/\1/g' \
           -e 's/packages\/composites\/\(.*\)\/.*/\1/g')
      if [[ -n $ADAPTER_SUFFIX ]]; then
        adapterName="$adapterName-$ADAPTER_SUFFIX"
      fi

      if [[ ! "${adapterSet[*]}" =~ $adapterName ]]; then
        adapterSet+=("$adapterName")
      fi
    fi
  done

  echo "${adapterSet[@]}"
}
