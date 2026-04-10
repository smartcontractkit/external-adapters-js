#!/bin/sh

# Wrapper script to conditionally start streams-adapter based on STREAM_ADAPTER

if [ "$STREAMS_ADAPTER" = "true" ]; then
    echo "STREAMS_ADAPTER=true detected, starting streams-adapter..."
    supervisorctl start streams-adapter:
else
    echo "STREAMS_ADAPTER is not set or not 'true', starting js-adapter..."
    supervisorctl start js-adapter-original
fi
