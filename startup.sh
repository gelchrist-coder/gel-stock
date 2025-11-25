#!/bin/bash
# startup.sh - Render.com startup script
set -e

PORT=${PORT:-3000}

echo "=== GEL-STOCK API Startup ==="
echo "Port: $PORT"
php -v | head -n 1
echo "Starting server..."

# Start PHP development server directly
php -S 0.0.0.0:$PORT
