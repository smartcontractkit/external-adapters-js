#!/bin/bash
set -e
export CACHE_ENABLED=true
export EXPERIMENTAL_RATE_LIMIT_ENABLED=true
export RATE_LIMIT_API_PROVIDER=cryptocompare
export RATE_LIMIT_API_TIER=corporate
export EXPERIMENTAL_WARMUP_ENABLED=true
export LOG_LEVEL=debug
export NODE_ENV=development
export DEBUG=true
export CACHE_REDIS_URL=redis://172.17.0.2:6379
export CACHE_TYPE=redis
export CACHE_KEY_GROUP=cryptocompare-adapter