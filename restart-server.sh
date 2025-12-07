#!/bin/bash
# Script to restart the server

echo "Stopping any existing server on port 5100..."
lsof -ti:5100 | xargs kill -9 2>/dev/null || echo "No existing server found"

echo "Waiting 2 seconds..."
sleep 2

echo "Starting server..."
cd "$(dirname "$0")"
node js/server.js

