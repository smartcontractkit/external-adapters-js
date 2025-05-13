#!/bin/bash -e

echo "running EA_PORT=0 METRICS_ENABLED=false jest $@/ ..."
EA_PORT=0 METRICS_ENABLED=false jest $@/
