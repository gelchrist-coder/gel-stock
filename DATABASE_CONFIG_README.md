# GEL-STOCK Database Configuration

## Current Setup

**Status:** ✅ PostgreSQL on Render.com (Production)

The application is now exclusively configured to use **PostgreSQL hosted on Render.com**.

### Active Configuration
- **File:** `api/config.php`
- **Database:** PostgreSQL 9.5+
- **Host:** `dpg-d4ictcjqkflc73b4e3b0-a.oregon-postgres.render.com`
- **Port:** 5432
- **User:** `gelstockdb_user`
- **Database:** `gelstockdb`
- **SSL:** Enabled (required for Render.com)

## Database Files

### Configuration Files
| File | Purpose | Status |
|------|---------|--------|
| `api/config.php` | **Active PostgreSQL config** | ✅ In Use |
| `api/config_postgresql.bak` | Backup of PostgreSQL config | 📦 Backup |
| `api/config_sqlite.php` | SQLite (offline mode) | 🔄 Available |
| `api/config_azure.php` | Azure SQL template | 🔄 Available |

### Schema Files
| File | Database | Purpose | Status |
|------|----------|---------|--------|
| `database_setup_postgresql.sql` | PostgreSQL | Production schema | ✅ Applied |
| `database_setup_sqlite.sql` | SQLite | Offline schema | 📦 Available |
| `database_setup.sql` | MySQL | Legacy MySQL schema | 🗂️ Legacy |

## Switching Databases (If Needed)

### To Use SQLite (Offline Mode)
```bash
# Backup current config
copy api\config.php api\config_postgresql.bak

# Switch to SQLite
copy api\config_sqlite.php api\config.php
```

### To Return to PostgreSQL
```bash
# Switch back to PostgreSQL
copy api\config_postgresql.bak api\config.php
```

## Connection Verification

### Test Connection from Command Line
```bash
# Windows - Using psql (if PostgreSQL client installed)
psql -h dpg-d4ictcjqkflc73b4e3b0-a.oregon-postgres.render.com -U gelstockdb_user -d gelstockdb

# macOS/Linux
psql -h dpg-d4ictcjqkflc73b4e3b0-a.oregon-postgres.render.com -U gelstockdb_user -d gelstockdb
```

### Test Connection via PHP
```php
<?php
require_once 'api/config.php';

$db = getDbConnection();
if ($db) {
    echo "✅ Connected to PostgreSQL successfully!";
    
    // Test query
    $result = $db->query("SELECT COUNT(*) as count FROM users");
    $row = $result->fetch();
    echo "\nTotal users: " . $row['count'];
} else {
    echo "❌ Connection failed";
}
?>
```

## API Endpoints

All API endpoints now exclusively use PostgreSQL:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/auth.php` | POST/GET | User authentication |
| `/api/products.php` | GET/POST/PUT/DELETE | Product management |
| `/api/sales.php` | GET/POST/PUT/DELETE | Sales transactions |
| `/api/customers.php` | GET/POST/PUT/DELETE | Customer management |
| `/api/devices.php` | GET/DELETE | Device session management |

## Environment Variables (Production)

For deployment on servers like Render.com, consider using environment variables:

```php
// Alternative approach (if using environment variables)
define('DB_HOST', getenv('DB_HOST') ?: 'dpg-d4ictcjqkflc73b4e3b0-a.oregon-postgres.render.com');
define('DB_PORT', getenv('DB_PORT') ?: 5432);
define('DB_NAME', getenv('DB_NAME') ?: 'gelstockdb');
define('DB_USER', getenv('DB_USER') ?: 'gelstockdb_user');
define('DB_PASS', getenv('DB_PASS') ?: '4y8yiyVYLXlWRtDHj107hE2xgRe0Qe3A');
```

## Backup & Restore

### Backup PostgreSQL Database
```bash
pg_dump -h dpg-d4ictcjqkflc73b4e3b0-a.oregon-postgres.render.com \
        -U gelstockdb_user \
        -d gelstockdb \
        > gel_stock_backup.sql
```

### Restore PostgreSQL Database
```bash
psql -h dpg-d4ictcjqkflc73b4e3b0-a.oregon-postgres.render.com \
     -U gelstockdb_user \
     -d gelstockdb \
     -f gel_stock_backup.sql
```

## Security Notes

1. **Credentials in Code:** The database credentials are currently in `api/config.php`. For production:
   - Move to environment variables
   - Use `.env` files (with environment variable loading)
   - Store in secure configuration management

2. **SSL Connection:** PostgreSQL on Render.com requires SSL (`sslmode=require`)
   - This is already configured in `config.php`
   - Data is encrypted in transit

3. **Network Security:** 
   - Only Render.com IP ranges can access the database
   - Direct internet access is blocked

## Troubleshooting

### Connection Timeout
- Ensure you're using the correct Render.com hostname
- Check that your IP is whitelisted (if applicable)
- Verify SSL is enabled (`sslmode=require`)

### Authentication Failed
- Double-check the username: `gelstockdb_user`
- Verify the password is correct
- Ensure the database name is `gelstockdb`

### Database Schema Missing
- Run the migration: `database_setup_postgresql.sql`
- Or use Render.com's SQL editor to paste the schema
- See `POSTGRESQL_MIGRATION_GUIDE.md` for details

## Related Documentation

- `documentation/POSTGRESQL_MIGRATION_GUIDE.md` - PostgreSQL setup & migration
- `documentation/RENDER_SETUP_GUIDE.md` - Render.com specific setup
- `documentation/CROSS_DEVICE_LOGIN.md` - Session management with PostgreSQL
