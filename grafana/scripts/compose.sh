#!/bin/bash
set -ex
# Generate prom file
arr=("$@")
function join_by {
  local IFS="$1"
  shift
  echo "$*"
}

CONTEXT='..' yarn generate:docker-compose
./scripts/generate-prom-config.sh "$(join_by , "${arr[@]}")"

docker-compose -f ./docker-compose.yaml -f ../docker-compose.generated.yaml up --build redis grafana prometheus "${arr[@]}"
