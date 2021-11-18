#!/bin/bash
set -x
# pass in a pr number to cleanup the k6 pod and adapter from the cluster
PR_NUMBER=${PR_NUMBER:=}
ADAPTER_NAMES=$(kubectl get deployments --namespace adapters | awk '{print $1;}' | grep "${PR_NUMBER}$" | awk -F'-' '{print $3;}')
for adapter in ${ADAPTER_NAMES}; do
    # stop the k6 pod 
    NAME=k6-${PR_NUMBER}-${adapter} yarn qa:adapter stop k6 ${PR_NUMBER} || true
    # stop the adapter pod
    yarn qa:adapter stop ${adapter} ${PR_NUMBER} || true
    # TODO cleanup images created for this test run, not sure if we want to open this can of worms yet
done