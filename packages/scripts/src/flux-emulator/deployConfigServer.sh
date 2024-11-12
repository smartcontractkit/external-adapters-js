#!/bin/bash

DIR="$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

# switch to the project home so we can run normal yarn commands
cd ${DIR}/../../../
set -x

NAME=fluxconfig \
IMAGE_REPOSITORY=kalverra/ \
HELM_VALUES=${DIR}/values.yaml \
yarn qa:adapter start dummy-external fluxconfig latest
