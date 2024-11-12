#!/bin/bash

SCRIPT_DIR="$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

cd ${SCRIPT_DIR}

ACCOUNT=${ACCOUNT:=795953128386}
AWS_REGION=${AWS_REGION:=us-west-2}
UNIQUE_NAME=${UNIQUE_NAME:=unique}
IMAGE_PREFIX=${ACCOUNT}.dkr.ecr.${AWS_REGION}.amazonaws.com/k6

# login if necessary before running this script
# aws ecr get-login-password --region ${AWS_REGION} --profile ${AWS_PROFILE} | docker login --username AWS --password-stdin ${IMAGE_PREFIX}

yarn build
docker build -t ${IMAGE_PREFIX}:pr${UNIQUE_NAME} .
docker push ${IMAGE_PREFIX}:pr${UNIQUE_NAME}
