#!/bin/bash
# startup.sh - Render.com startup script

# Check if PORT is set, default to 3000
PORT=${PORT:-3000}

# Echo startup info
echo "Starting GEL-STOCK API on port $PORT..."
echo "PHP Version: $(php -v | head -n 1)"
echo "DATABASE_URL: ${DATABASE_URL:0:50}..."

# Start PHP development server
exec php -S 0.0.0.0:$PORT
