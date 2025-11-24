@echo off
REM GEL-STOCK - PostgreSQL Render.com Database Setup Script (Windows)
REM This script imports the database schema to your Render.com hosted PostgreSQL instance

setlocal enabledelayedexpansion

echo.
echo GEL-STOCK - Render.com PostgreSQL Setup
echo =======================================
echo.

REM Database connection details
set DB_USER=gelstockdb_user
set DB_PASS=4y8yiyVYLXlWRtDHj107hE2xgRe0Qe3A
set DB_HOST=dpg-d4ictcjqkflc73b4e3b0-a.oregon-postgres.render.com
set DB_PORT=5432
set DB_NAME=gelstockdb

echo Connecting to: %DB_HOST%
echo Database: %DB_NAME%
echo.

REM Check if psql is installed
where psql >nul 2>nul
if %errorlevel% neq 0 (
    echo.
    echo ERROR: PostgreSQL client (psql) is not installed or not in PATH
    echo.
    echo Please install PostgreSQL from: https://www.postgresql.org/download/windows/
    echo Make sure to check "Add PostgreSQL binaries to PATH" during installation
    echo.
    pause
    exit /b 1
)

echo √ PostgreSQL client found
echo.

REM Find the schema file
if not exist "database_setup_postgresql.sql" (
    echo.
    echo ERROR: Cannot find database_setup_postgresql.sql
    echo Please run this script from the GEL-STOCK root directory
    echo.
    pause
    exit /b 1
)

echo √ Schema file found: database_setup_postgresql.sql
echo.
echo Starting database setup...
echo.

REM Set environment variable for password (psql reads this)
set PGPASSWORD=%DB_PASS%

REM Import the schema
psql -h %DB_HOST% ^
     -p %DB_PORT% ^
     -U %DB_USER% ^
     -d %DB_NAME% ^
     -f database_setup_postgresql.sql ^
     -v sslmode=require

REM Check if import was successful
if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo √ Database setup completed successfully!
    echo ========================================
    echo.
    echo Your GEL-STOCK database is ready to use!
    echo.
    echo Connection details:
    echo   Host: %DB_HOST%
    echo   Port: %DB_PORT%
    echo   Database: %DB_NAME%
    echo   User: %DB_USER%
    echo.
    echo Next steps:
    echo   1. Verify the config_postgresql.php file in api/ folder
    echo   2. Rename it to config.php to use PostgreSQL
    echo   3. Start your PHP server: php -S localhost:9000 -t dashboard
    echo   4. Visit: http://localhost:9000
    echo.
) else (
    echo.
    echo ========================================
    echo ERROR: Database setup failed!
    echo ========================================
    echo.
    echo Please check:
    echo   - Your internet connection
    echo   - Your Render.com database is running
    echo   - Your password is correct
    echo.
)

REM Clear password variable
set PGPASSWORD=

pause
