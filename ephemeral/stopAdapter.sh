#!/bin/bash

###### Usage ######
#
# Uses environment variables to determine which adapter to uninstall. Tools required: helm
# ADAPTER - Required.
# RELEASE_TAG - Required. Used to remove a unique release of the adapter. Use the same one you used when starting the adapter.
#
# Example: ADAPTER=coingecko RELEASE_TAG=test yarn qa:adapter:stop
#
###### ----- ######

## The name of the adapter you want to deploy
ADAPTER=${ADAPTER:=}
## A unique release tag, in ci this will be the pr number, keeps us from having collisions
RELEASE_TAG=${RELEASE_TAG:=}
## The release name to be used in helm
NAME=qa-ea-${ADAPTER}-${RELEASE_TAG}
## The namespace for the k8s release
NAMESPACE=ephemeral-adapters

# do we have an adapter
if [ -z "$ADAPTER" ]; then
    echo "Need an ADAPTER specified."
    exit 1
fi

# do we have a release tag
if [ -z "$RELEASE_TAG" ]; then
    echo "Need a RELEASE_TAG specified. Use your name if running this locally. Use the PR number if running in CI"
    exit 1
fi

helm uninstall ${NAME} \
    --namespace ${NAMESPACE}