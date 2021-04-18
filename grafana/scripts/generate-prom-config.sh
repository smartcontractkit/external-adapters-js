#!/bin/bash
jsonnet --tla-str targets="$1" -S -o ../generated/prometheus.yml ./prometheus.jsonnet
