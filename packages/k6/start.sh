#!/bin/bash

SCRIPT_DIR="$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

cd ${SCRIPT_DIR}

UNIQUE_NAME=${UNIQUE_NAME:=unique}
ADAPTER=${ADAPTER:=coingecko}
NAME=k6-${UNIQUE_NAME}-${ADAPTER}

helm upgrade ${NAME} ./k8s \
      --install \
      --namespace adapters \
      --create-namespace \
      -f ./k8s/values.yaml \
      --set image.tag=pr${UNIQUE_NAME} \
      --set name=${NAME} \
      --wait
