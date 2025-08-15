#!/bin/bash

# Function to handle shutdown
cleanup() {
    echo "Shutting down services..."
    if [ ! -z "$WORKER_PID" ]; then
        kill $WORKER_PID 2>/dev/null
    fi
    exit 0
}

# Set up signal handlers
trap cleanup SIGTERM SIGINT

# Start the worker
echo "Starting Temporal worker..."
npm start &
WORKER_PID=$!

# Wait for the process
wait $WORKER_PID
