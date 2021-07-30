#!/bin/bash
set -ex
# Generate prom file
arr=("$@")
function join_by {
  local IFS="$1"
  shift
  echo "$*"
}

./scripts/generate-prom-config.sh "$(join_by , "${arr[@]}")"

docker-compose -f ./docker-compose.yaml -f ../docker-compose.generated.yaml up --build grizzly grafana prometheus "${arr[@]}"
