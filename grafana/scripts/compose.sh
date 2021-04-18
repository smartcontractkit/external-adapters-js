#!/bin/bash

# Generate prom file
arr=("$@")
function join_by {
  local IFS="$1"
  shift
  echo "$*"
}

./generate-prom-config.sh "$(join_by , "${arr[@]}")"

docker-compose -f ./docker-compose.yaml -f ../docker-compose.generated.yaml up "${arr[@]}" grafana grizzly prometheus
