#!/bin/bash

###### Usage ######
#
# Uses environment variables to determine which adapter to deploy. Tools required: kubectl, helm, grep
# ADAPTER - Required.
# RELEASE_TAG - Required. Used to create a unique release of the adapter. If used locally you can just use your name. If used in CI then the PR number should be used.
# HELM_CHART_DIR - Defaults to a temporary chart in this repo. To be replaced by an internal helm chart repository pull in the future.
# IMAGE_REPOSITORY - Defaults to the chainlink public ecr for adapters.
# IMAGE_TAG - Defaults to develop-latest. Can also be an image sha256
#
# Example: ADAPTER=coingecko RELEASE_TAG=test yarn qa:adapter:start
#
###### ----- ######

## The name of the adapter you want to deploy
ADAPTER=${ADAPTER:=}
## A unique release tag, in ci this will be the pr number, keeps us from having collisions
RELEASE_TAG=${RELEASE_TAG:=}
## Path to the helm chart directory
HELM_CHART_DIR=${HELM_CHART_DIR:=./ephemeral/cl-adapter}
## The repository where your built image is
IMAGE_REPOSITORY=${IMAGE_REPOSITORY:=public.ecr.aws/chainlink/adapters/}
## The image tag, can also be an image sha
IMAGE_TAG=${IMAGE_TAG:=develop-latest}

## The release name to be used in helm
NAME=qa-ea-${ADAPTER}-${RELEASE_TAG}
## The namespace for the k8s release
NAMESPACE=ephemeral-adapters

# check that we are in the qa-staging-cluster k8s context
KUBE_CONTEXT=$(kubectl config get-contexts | grep '*' | grep qa-stage-cluster)
if [ -z "$KUBE_CONTEXT" ]; then
    echo "We only want to deploy ephemeral adapters into the qa staging cluster, please switch your kube context to the qa staging cluster"
    exit 1
fi

# do we have an adapter specified
if [ -z "$ADAPTER" ]; then
    echo "Need an ADAPTER specified."
    exit 1
fi

# do we have a release tag specified
if [ -z "$RELEASE_TAG" ]; then
    echo "Need a RELEASE_TAG specified. Use your name if running this locally. Use the PR number if running in CI"
    exit 1
fi

# deploy the adapter
helm upgrade ${NAME} ${HELM_CHART_DIR} \
    --install \
    --namespace ${NAMESPACE} \
    --create-namespace \
    --set image.repository="${IMAGE_REPOSITORY}${ADAPTER}-adapter" \
    --set image.tag=${IMAGE_TAG} \
    --set name=${NAME} \
    --wait