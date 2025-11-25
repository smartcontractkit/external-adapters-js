#!/bin/sh

# Wrapper script to conditionally start streams-adapter based on CACHE_TYPE

if [ "$CACHE_TYPE" = "redis" ]; then
    echo "CACHE_TYPE=redis detected, starting streams-adapter..."
    # Start all processes in the 'streams-adapter' group
    supervisorctl start streams-adapter:
else
    echo "CACHE_TYPE is not 'redis', starting js-adapter..."
    supervisorctl start js-adapter-original
fi

