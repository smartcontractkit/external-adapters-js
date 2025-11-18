#!/bin/sh

# Wrapper script to conditionally start streams-adapter based on CACHE_TYPE

if [ "$CACHE_TYPE" = "redis" ]; then
    echo "CACHE_TYPE=redis detected, starting streams-adapter..."
    exec /usr/local/bin/streams-adapter
else
    echo "CACHE_TYPE is not 'redis' (current value: '$CACHE_TYPE'), skipping streams-adapter"
    exit 0
fi

