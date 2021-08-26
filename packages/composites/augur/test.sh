#!/usr/bin/env bash

set -e

trap "exit" INT TERM
trap "kill 0" EXIT

# Path to augur-jobs-creator.env
export $(cat $1 | xargs)

yarn workspace "@chainlink/augur-adapter" clean
yarn workspace "@chainlink/augur-adapter" build
LOG_LEVEL=debug yarn workspace @chainlink/augur-adapter start | jq &

# Second arg is payload.json
curl --retry 5 --max-time 1 --max-time 1000 --retry-connrefused --data "@$2" -H "Content-Type:application/json" localhost:8080 > /dev/null 2>&1
sleep 1
