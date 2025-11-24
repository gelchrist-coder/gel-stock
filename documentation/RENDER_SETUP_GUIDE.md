# GEL-STOCK - Render.com PostgreSQL Setup Guide

## Overview

You're using **Render.com** to host your PostgreSQL database - an excellent choice for production deployments! This guide will help you configure GEL-STOCK to use your remote database.

## Your Database Information

```
Connection String: postgresql://gelstockdb_user:4y8yiyVYLXlWRtDHj107hE2xgRe0Qe3A@dpg-d4ictcjqkflc73b4e3b0-a.oregon-postgres.render.com/gelstockdb

Host: dpg-d4ictcjqkflc73b4e3b0-a.oregon-postgres.render.com
Port: 5432
Database: gelstockdb
User: gelstockdb_user
Password: 4y8yiyVYLXlWRtDHj107hE2xgRe0Qe3A
```

⚠️ **Important**: Keep your credentials secure! Never commit them to version control.

## Setup Steps

### Step 1: Verify Files Are in Place

Check that these files exist in your GEL-STOCK directory:

```
api/
  └── config_postgresql.php    ✓ Already updated with your credentials
database_setup_postgresql.sql  ✓ Schema file
setup_render_database.bat      ✓ Windows setup script
setup_render_database.sh       ✓ macOS/Linux setup script
```

### Step 2: Create Database Schema

#### Option A: Using Windows Batch Script (Recommended for Windows)

1. Open Command Prompt or PowerShell
2. Navigate to your GEL-STOCK directory:
   ```bash
   cd c:\GEL-STOCK
   ```
3. Run the setup script:
   ```bash
   setup_render_database.bat
   ```
4. The script will:
   - Check PostgreSQL client is installed
   - Connect to Render.com database
   - Import all tables, indexes, and sample data
   - Display confirmation message

#### Option B: Using Bash Script (macOS/Linux)

1. Open Terminal
2. Navigate to GEL-STOCK directory:
   ```bash
   cd /path/to/GEL-STOCK
   ```
3. Make script executable:
   ```bash
   chmod +x setup_render_database.sh
   ```
4. Run it:
   ```bash
   ./setup_render_database.sh
   ```

#### Option C: Manual Import with psql

If you have PostgreSQL client installed:

```bash
# Windows Command Prompt
set PGPASSWORD=4y8yiyVYLXlWRtDHj107hE2xgRe0Qe3A
psql -h dpg-d4ictcjqkflc73b4e3b0-a.oregon-postgres.render.com -p 5432 -U gelstockdb_user -d gelstockdb -f database_setup_postgresql.sql

# macOS/Linux Terminal
PGPASSWORD=4y8yiyVYLXlWRtDHj107hE2xgRe0Qe3A psql -h dpg-d4ictcjqkflc73b4e3b0-a.oregon-postgres.render.com -p 5432 -U gelstockdb_user -d gelstockdb -f database_setup_postgresql.sql
```

#### Option D: Using pgAdmin (GUI)

1. Download pgAdmin from: https://www.pgadmin.org/download/
2. Connect to your Render.com server:
   - Host: `dpg-d4ictcjqkflc73b4e3b0-a.oregon-postgres.render.com`
   - Port: `5432`
   - Username: `gelstockdb_user`
   - Password: `4y8yiyVYLXlWRtDHj107hE2xgRe0Qe3A`
   - SSL: Yes (required)
3. Open Query Tool
4. Copy and paste the contents of `database_setup_postgresql.sql`
5. Execute the query

### Step 3: Verify Connection

The config file is already updated. Test the connection:

```bash
# Create a test file
echo "<?php require_once 'api/config_postgresql.php'; \$db = getDbConnection(); echo 'Connected!'; ?>" > test_connection.php

# Run PHP server
php -S localhost:9000

# Visit http://localhost:9000/test_connection.php
```

### Step 4: Switch to PostgreSQL Config

Rename or update your API config:

```bash
# Option A: Use the provided config directly
cd api
rename config.php config_mysql.php  (if you have MySQL)
rename config_postgresql.php config.php

# Option B: Update your main config.php
# Copy content from config_postgresql.php into config.php
```

### Step 5: Start Your Application

```bash
# From dashboard directory
cd dashboard
php -S localhost:9000

# Visit http://localhost:9000
```

## Render.com Specific Notes

### SSL Connection Required
Render.com requires SSL connections. The configuration already includes:
```php
define('DB_SSL', true);
// DSN includes: sslmode=require
```

### Connection Pooling
For production, consider Render's connection pooling:
- Update your connection string to use the pool endpoint (check Render dashboard)
- Usually: `...postgres-pooler...` instead of regular host

### Database Backups
Render.com provides automatic backups. To download:
1. Log into Render.com dashboard
2. Go to your PostgreSQL instance
3. Click "Backups" tab
4. Download as needed

### Monitoring & Logs
Monitor your database in Render.com dashboard:
- View logs
- Check connection stats
- Monitor disk usage
- Set up alerts

## Troubleshooting

### "Connection refused" or "timeout"
- Verify your internet connection
- Check Render.com service status: https://status.render.com/
- Ensure your IP/network isn't blocked by firewall
- Render.com allows all IPs by default

### "SSL connection required"
- Already configured in your config_postgresql.php
- Make sure you're using the correct host (with hyphen, not underscore)

### "Password authentication failed"
- Double-check your password: `4y8yiyVYLXlWRtDHj107hE2xgRe0Qe3A`
- Ensure DB_USER is: `gelstockdb_user`
- Make sure you're not using special characters that need escaping

### "Database does not exist" or "Table not found"
- Run the setup script to create tables
- Verify schema file exists: `database_setup_postgresql.sql`
- Check that import completed successfully

### psql not found
Install PostgreSQL client:
- **Windows**: https://www.postgresql.org/download/windows/
- **macOS**: `brew install postgresql`
- **Linux**: `sudo apt-get install postgresql-client`

## Performance Tips

### Query Optimization
```sql
-- Check slow queries
SELECT query, calls, mean_exec_time FROM pg_stat_statements 
ORDER BY mean_exec_time DESC LIMIT 10;
```

### Connection Pooling
If you need more connections, use Render's pooler endpoint in your config

### Monitoring
Set up alerts in Render.com for:
- High CPU usage
- Disk space warnings
- Connection count spikes

## Security Best Practices

1. **Never commit credentials to git** - Store in `.env` file instead
2. **Use strong passwords** - Consider rotating if shared
3. **Enable IP whitelist** - In production, restrict to your server IPs only
4. **Use HTTPS** - Deploy on HTTPS for production
5. **Backup regularly** - Download backups from Render.com monthly

## Update Your Environment

For production deployment, update your backend to use environment variables:

```php
// api/config_postgresql.php
define('DB_HOST', getenv('DB_HOST') ?: 'localhost');
define('DB_USER', getenv('DB_USER') ?: 'postgres');
define('DB_PASS', getenv('DB_PASS') ?: 'postgres');
define('DB_NAME', getenv('DB_NAME') ?: 'gel_stock');
```

Then set in your hosting provider:
```
DB_HOST=dpg-d4ictcjqkflc73b4e3b0-a.oregon-postgres.render.com
DB_USER=gelstockdb_user
DB_PASS=4y8yiyVYLXlWRtDHj107hE2xgRe0Qe3A
DB_NAME=gelstockdb
```

## Next Steps

1. ✅ Database schema imported
2. ✅ Config file updated
3. Run `setup_render_database.bat` to create tables
4. Test connection with `php -S localhost:9000`
5. Deploy to production hosting

## Support & Resources

- Render.com Docs: https://render.com/docs
- PostgreSQL Docs: https://www.postgresql.org/docs/
- GEL-STOCK Migration Guide: `documentation/POSTGRESQL_MIGRATION_GUIDE.md`

---

**Questions?** Check Render.com dashboard for:
- Database status
- Connection logs
- Resource usage metrics
