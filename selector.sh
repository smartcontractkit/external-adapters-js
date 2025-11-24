#!/bin/sh

# Wrapper script to conditionally start streams-adapter based on CACHE_TYPE

if [ "$CACHE_TYPE" = "redis" ]; then
    echo "CACHE_TYPE=redis detected, starting streams-adapter..."
    supervisorctl start group:streams-adapter
else
    echo "CACHE_TYPE is not 'redis', starting js-adapter..."
    supervisorctl start js-adapter
fi

