#!/bin/bash
set -x
# pass in a pr number to cleanup the k6 pod and adapter from the cluster
PR_NUMBER=${PR_NUMBER:=}
for adapter in ${ADAPTER_NAMES}; do
    # Stop the k6 pod
    helm uninstall k6-${PR_NUMBER}-${adapter} \
                        --namespace adapters \
                        --wait || true
    # Stop the adapter pod
    yarn qa:adapter stop ${adapter} ${PR_NUMBER} || true
done
