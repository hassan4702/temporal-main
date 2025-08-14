#!/bin/bash

# Function to handle shutdown
cleanup() {
    echo "Shutting down services..."
    if [ ! -z "$WORKER_PID" ]; then
        kill $WORKER_PID 2>/dev/null
    fi
    if [ ! -z "$WEBSOCKET_PID" ]; then
        kill $WEBSOCKET_PID 2>/dev/null
    fi
    exit 0
}

# Set up signal handlers
trap cleanup SIGTERM SIGINT

# Start the worker in the background
echo "Starting Temporal worker..."
npm start &
WORKER_PID=$!

# Start the websocket server in the background
echo "Starting WebSocket server..."
npm run websocket &
WEBSOCKET_PID=$!

# Wait for both processes
wait $WORKER_PID $WEBSOCKET_PID
