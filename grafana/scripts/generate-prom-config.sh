#!/bin/bash
# If using a local adapter, use host.docker.internal as the first arg
jsonnet --tla-str targets="$1" -S -o ./generated/prometheus.yml ./src/prometheus.jsonnet
