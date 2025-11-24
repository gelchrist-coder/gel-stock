# PostgreSQL Migration Guide for GEL-STOCK

## Overview

This guide walks you through migrating GEL-STOCK from MySQL to PostgreSQL. PostgreSQL is a more robust, feature-rich database system that's excellent for growing businesses.

## Prerequisites

### 1. Install PostgreSQL

**Windows:**
- Download from: https://www.postgresql.org/download/windows/
- Run the installer and follow the setup wizard
- Remember the password you set for the `postgres` user
- Default port: 5432

**macOS:**
```bash
brew install postgresql
brew services start postgresql
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib
sudo service postgresql start
```

### 2. Verify PostgreSQL Installation

```bash
psql --version
psql -U postgres
```

## Migration Steps

### Step 1: Create Database and User (Optional)

Open PostgreSQL command line:

```bash
psql -U postgres
```

Create a new database and user:

```sql
-- Create database
CREATE DATABASE gel_stock;

-- Create user (optional, more secure than using postgres)
CREATE USER gel_stock_user WITH PASSWORD 'your_secure_password';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE gel_stock TO gel_stock_user;

-- Connect to the database
\c gel_stock

-- Grant schema privileges
GRANT ALL ON SCHEMA public TO gel_stock_user;

-- Exit
\q
```

### Step 2: Import Database Schema

Using the PostgreSQL schema file:

**Windows Command Prompt:**
```bash
psql -U postgres -d gel_stock -f "C:\GEL-STOCK\database_setup_postgresql.sql"
```

**macOS/Linux Terminal:**
```bash
psql -U postgres -d gel_stock -f /path/to/GEL-STOCK/database_setup_postgresql.sql
```

### Step 3: Update Configuration File

Replace the old `config.php` with the new `config_postgresql.php`:

**Option A: Rename the file**
```bash
cd C:\GEL-STOCK\api
rename config_postgresql.php config.php
```

**Option B: Keep both and switch via environment variable** (Advanced)

Update the line in your backend files:
```php
// Instead of:
require_once 'config.php';

// Use:
$dbType = getenv('DB_TYPE') ?? 'mysql';
require_once "config_{$dbType}.php";
```

### Step 4: Update Database Connection Details

Edit `api/config_postgresql.php` (or `config.php` if you renamed it):

```php
define('DB_HOST', 'localhost');
define('DB_PORT', 5432);
define('DB_NAME', 'gel_stock');
define('DB_USER', 'gel_stock_user');      // or 'postgres' if you didn't create a user
define('DB_PASS', 'your_password');       // Set your PostgreSQL password
```

### Step 5: Test the Connection

Create a test file `api/test_connection.php`:

```php
<?php
require_once 'config.php';

try {
    $db = getDbConnection();
    echo json_encode([
        'success' => true,
        'message' => 'PostgreSQL connection successful!'
    ]);
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Connection failed: ' . $e->getMessage()
    ]);
}
?>
```

Run it:
```bash
curl http://localhost:9000/api/test_connection.php
```

## Important Differences Between MySQL and PostgreSQL

### 1. **Data Types**
PostgreSQL has more data types and stricter typing:
- MySQL: `INT` → PostgreSQL: `INTEGER` or `SERIAL`
- MySQL: `UNSIGNED` → PostgreSQL: Use constraints or `BIGINT`
- MySQL: `TIMESTAMP` → PostgreSQL: `TIMESTAMP` (same)

### 2. **Auto-Increment**
- MySQL: `AUTO_INCREMENT`
- PostgreSQL: `SERIAL` (automatically creates sequence)

### 3. **String Functions**
PostgreSQL functions are often different:
- MySQL: `CONCAT()` → PostgreSQL: `||` operator or `CONCAT()`
- MySQL: `NOW()` → PostgreSQL: `CURRENT_TIMESTAMP`

### 4. **Boolean Values**
- MySQL: `TINYINT(1)` 
- PostgreSQL: `BOOLEAN` (TRUE/FALSE or t/f)

### 5. **Sequences**
PostgreSQL uses sequences for auto-increment:
```sql
-- View sequences
SELECT * FROM information_schema.sequences;

-- Reset a sequence
ALTER SEQUENCE products_id_seq RESTART WITH 1;
```

## Backup and Restore

### Backup PostgreSQL Database

```bash
# Full backup
pg_dump -U postgres -h localhost gel_stock > gel_stock_backup.sql

# With compression
pg_dump -U postgres -h localhost -F c gel_stock > gel_stock_backup.dump
```

### Restore from Backup

```bash
# From SQL file
psql -U postgres -d gel_stock -f gel_stock_backup.sql

# From dump file
pg_restore -U postgres -d gel_stock gel_stock_backup.dump
```

## Migrate Data from MySQL to PostgreSQL

If you have existing data in MySQL, use a tool like:
- **pgLoader**: `pgloader mysql://root@localhost/jmonic_enterprise postgresql://postgres@localhost/gel_stock`
- **DBeaver**: GUI tool with migration wizard
- **Manual export/import**: Export MySQL as CSV, import to PostgreSQL

## Performance Tips for PostgreSQL

1. **Enable EXPLAIN ANALYZE** for query optimization:
```sql
EXPLAIN ANALYZE SELECT * FROM sales WHERE created_at > '2025-01-01';
```

2. **Create indexes** (already done in schema):
```sql
CREATE INDEX idx_sales_customer ON sales(customer_id);
CREATE INDEX idx_products_sku ON products(sku);
```

3. **Update statistics** for the query planner:
```sql
ANALYZE;
```

4. **Check slow queries**:
```sql
-- Enable slow query logging
ALTER SYSTEM SET log_min_duration_statement = 1000; -- 1 second
SELECT pg_reload_conf();
```

## Common PostgreSQL Commands

```bash
# Connect to database
psql -U postgres -d gel_stock

# List all databases
\l

# List all tables
\dt

# Describe a table
\d products

# Show table size
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) 
FROM pg_tables WHERE schemaname != 'pg_catalog' ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

# View active connections
SELECT datname, usename, application_name, state FROM pg_stat_activity;

# Kill a connection
SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'gel_stock' AND pid <> pg_backend_pid();

# Exit PostgreSQL
\q
```

## Troubleshooting

### Connection Refused
- Check PostgreSQL is running: `pg_isready`
- Verify port 5432 is not blocked by firewall
- Check `postgresql.conf` for `listen_addresses = '*'`

### Password Authentication Failed
```bash
# Reset postgres password
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'new_password';"
```

### Permission Denied
```sql
-- Grant all privileges
GRANT ALL PRIVILEGES ON DATABASE gel_stock TO gel_stock_user;
GRANT ALL ON SCHEMA public TO gel_stock_user;
GRANT ALL ON ALL TABLES IN SCHEMA public TO gel_stock_user;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO gel_stock_user;
```

### Table Not Found
- PostgreSQL is case-sensitive with unquoted identifiers
- Use lowercase or quote identifiers: `"ProductName"`

## Verify Migration Success

Run these checks:

```php
<?php
require_once 'config.php';
$db = getDbConnection();

// Check tables
$tables = $db->query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'")->fetchAll();
echo "Tables: " . count($tables) . "\n";

// Check product count
$products = $db->query("SELECT COUNT(*) FROM products")->fetch();
echo "Products: " . $products['count'] . "\n";

// Check sales count
$sales = $db->query("SELECT COUNT(*) FROM sales")->fetch();
echo "Sales: " . $sales['count'] . "\n";

echo "✅ Migration successful!";
?>
```

## Rolling Back to MySQL

If you need to switch back:

1. Keep your MySQL database intact
2. Rename `config_postgresql.php` back to config.php:
   ```bash
   rename config.php config_postgresql.php
   rename config.php.mysql config.php
   ```
3. Update to MySQL config credentials

## Support & Resources

- PostgreSQL Documentation: https://www.postgresql.org/docs/
- PostgreSQL vs MySQL: https://www.postgresql.org/about/
- pgAdmin (GUI tool): https://www.pgadmin.org/

---

**Questions?** Check the error logs:
```bash
# PostgreSQL log location varies by OS
# Windows: C:\Program Files\PostgreSQL\[version]\data\log\
# macOS: /usr/local/var/postgres/
# Linux: /var/log/postgresql/
```
