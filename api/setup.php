<?php
/**
 * GEL-STOCK Database Setup Script
 * Runs automatically on first Render.com deployment
 */

// Get database connection string
$database_url = getenv('DATABASE_URL');

if (!$database_url) {
    echo "ERROR: DATABASE_URL environment variable not set\n";
    exit(1);
}

// Parse connection string
$parsed_url = parse_url($database_url);
$host = $parsed_url['host'] ?? 'localhost';
$port = $parsed_url['port'] ?? 5432;
$user = $parsed_url['user'] ?? 'postgres';
$password = $parsed_url['pass'] ?? '';
$dbname = ltrim($parsed_url['path'] ?? '/gel_stock', '/');

echo "Connecting to PostgreSQL at $host:$port/$dbname...\n";

try {
    // Connect to PostgreSQL
    $pdo = new PDO(
        "pgsql:host=$host;port=$port;dbname=$dbname;user=$user;password=$password",
        null,
        null,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
    
    echo "✓ Connected to database\n";
    
    // Create users table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            phone VARCHAR(20) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            first_name VARCHAR(100),
            last_name VARCHAR(100),
            email VARCHAR(100),
            business_name VARCHAR(100),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ");
    echo "✓ Created users table\n";
    
    // Create user_sessions table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS user_sessions (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            session_token VARCHAR(255) UNIQUE NOT NULL,
            device_name VARCHAR(100),
            device_type VARCHAR(50),
            ip_address VARCHAR(45),
            user_agent TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            expires_at TIMESTAMP,
            last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ");
    echo "✓ Created user_sessions table\n";
    
    // Create products table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS products (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            sku VARCHAR(50) UNIQUE NOT NULL,
            product_name VARCHAR(255) NOT NULL,
            selling_price DECIMAL(10, 2) NOT NULL,
            cost_price DECIMAL(10, 2),
            stock_quantity INTEGER DEFAULT 0,
            reorder_level INTEGER DEFAULT 10,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ");
    echo "✓ Created products table\n";
    
    // Create sales table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS sales (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
            total_amount DECIMAL(10, 2) NOT NULL,
            items JSON,
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ");
    echo "✓ Created sales table\n";
    
    // Create customers table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS customers (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            name VARCHAR(255) NOT NULL,
            phone VARCHAR(20),
            email VARCHAR(100),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ");
    echo "✓ Created customers table\n";
    
    // Create suppliers table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS suppliers (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            name VARCHAR(255) NOT NULL,
            contact VARCHAR(20),
            email VARCHAR(100),
            products_supplied JSON,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ");
    echo "✓ Created suppliers table\n";
    
    // Create business_settings table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS business_settings (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
            business_name VARCHAR(255),
            currency VARCHAR(3) DEFAULT 'GHS',
            timezone VARCHAR(50) DEFAULT 'Africa/Accra',
            notifications_enabled BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ");
    echo "✓ Created business_settings table\n";
    
    // Create indexes for better performance
    $pdo->exec("CREATE INDEX IF NOT EXISTS idx_user_phone ON users(phone)");
    $pdo->exec("CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token)");
    $pdo->exec("CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON user_sessions(user_id)");
    $pdo->exec("CREATE INDEX IF NOT EXISTS idx_products_user ON products(user_id)");
    $pdo->exec("CREATE INDEX IF NOT EXISTS idx_sales_user ON sales(user_id)");
    $pdo->exec("CREATE INDEX IF NOT EXISTS idx_customers_user ON customers(user_id)");
    echo "✓ Created indexes\n";
    
    echo "\n✓ Database setup complete!\n";
    exit(0);
    
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
    exit(1);
}
?>
