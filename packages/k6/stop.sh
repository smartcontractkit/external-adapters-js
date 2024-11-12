#!/bin/bash

SCRIPT_DIR="$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

cd ${SCRIPT_DIR}/../../

UNIQUE_NAME=${UNIQUE_NAME:=unique}
ADAPTER=${ADAPTER:=coingecko}

NAME=k6-${UNIQUE_NAME}-${adapter} yarn qa:adapter stop k6 ${UNIQUE_NAME} || true

helm uninstall ${NAME} \
      --namespace adapters \
      --wait
