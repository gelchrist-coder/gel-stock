#!/bin/bash
# GEL-STOCK - PostgreSQL Render.com Database Setup Script
# This script imports the database schema to your Render.com hosted PostgreSQL instance

# Database connection string from Render.com
# postgresql://gelstockdb_user:4y8yiyVYLXlWRtDHj107hE2xgRe0Qe3A@dpg-d4ictcjqkflc73b4e3b0-a.oregon-postgres.render.com/gelstockdb

echo "GEL-STOCK - Render.com PostgreSQL Setup"
echo "========================================"
echo ""

# Connection details
DB_USER="gelstockdb_user"
DB_PASS="4y8yiyVYLXlWRtDHj107hE2xgRe0Qe3A"
DB_HOST="dpg-d4ictcjqkflc73b4e3b0-a.oregon-postgres.render.com"
DB_PORT="5432"
DB_NAME="gelstockdb"

echo "Connecting to: $DB_HOST"
echo "Database: $DB_NAME"
echo ""

# Check if psql is installed
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL client (psql) is not installed."
    echo "Please install PostgreSQL client tools:"
    echo "  Windows: https://www.postgresql.org/download/windows/"
    echo "  macOS: brew install postgresql"
    echo "  Linux: sudo apt-get install postgresql-client"
    exit 1
fi

echo "✓ PostgreSQL client found"
echo ""

# Find the schema file
SCHEMA_FILE="database_setup_postgresql.sql"

if [ ! -f "$SCHEMA_FILE" ]; then
    echo "❌ Cannot find $SCHEMA_FILE"
    echo "Please run this script from the GEL-STOCK root directory"
    exit 1
fi

echo "✓ Schema file found: $SCHEMA_FILE"
echo ""
echo "Starting database setup..."
echo ""

# Set PGPASSWORD to avoid password prompt
export PGPASSWORD="$DB_PASS"

# Import the schema
psql -h "$DB_HOST" \
     -p "$DB_PORT" \
     -U "$DB_USER" \
     -d "$DB_NAME" \
     -f "$SCHEMA_FILE" \
     --set=sslmode=require

# Check if import was successful
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Database setup completed successfully!"
    echo ""
    echo "Your GEL-STOCK database is ready to use!"
    echo "Connection details:"
    echo "  Host: $DB_HOST"
    echo "  Port: $DB_PORT"
    echo "  Database: $DB_NAME"
    echo "  User: $DB_USER"
    echo ""
else
    echo ""
    echo "❌ Database setup failed!"
    echo "Please check your connection details and try again"
    exit 1
fi

# Unset password variable
unset PGPASSWORD
