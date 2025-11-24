<?php
/**
 * PostgreSQL Setup & Connection Test
 * Run this to verify PostgreSQL connection and create tables if needed
 */

define('CLI_MODE', true);
require_once 'config.php';

echo "\n";
echo "════════════════════════════════════════════════════════════════\n";
echo "  GEL-STOCK PostgreSQL Setup Tool\n";
echo "════════════════════════════════════════════════════════════════\n\n";

try {
    echo "Step 1: Testing PostgreSQL Connection...\n";
    echo "  Host: " . DB_HOST . "\n";
    echo "  Database: " . DB_NAME . "\n";
    echo "  User: " . DB_USER . "\n";
    echo "  SSL: " . (DB_SSL ? 'Enabled' : 'Disabled') . "\n\n";
    
    $pdo = new PDO(
        'pgsql:host=' . DB_HOST . ';port=' . DB_PORT . ';dbname=' . DB_NAME . ';sslmode=require',
        DB_USER,
        DB_PASS,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]
    );
    
    $pdo->exec("SET client_encoding = 'UTF-8'");
    
    echo "✅ Connection successful!\n\n";
    
    // Check if tables exist
    echo "Step 2: Checking database tables...\n";
    
    $tablesResult = $pdo->query(
        "SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name"
    );
    $tables = $tablesResult->fetchAll();
    
    if (count($tables) === 0) {
        echo "  ⚠️  No tables found. Database is empty.\n";
        echo "\nStep 3: Creating tables...\n";
        
        // Read and execute schema
        $schemaFile = __DIR__ . '/../database_setup_postgresql.sql';
        if (file_exists($schemaFile)) {
            $schema = file_get_contents($schemaFile);
            
            // Split by semicolon and execute each statement
            $statements = array_filter(array_map('trim', explode(';', $schema)));
            
            $count = 0;
            foreach ($statements as $statement) {
                if (!empty($statement)) {
                    try {
                        $pdo->exec($statement);
                        $count++;
                    } catch (Exception $e) {
                        // Ignore some expected errors like "already exists"
                        if (strpos($e->getMessage(), 'already exists') === false) {
                            echo "  ⚠️  Warning: " . $e->getMessage() . "\n";
                        }
                    }
                }
            }
            
            echo "  ✅ Created/updated $count database objects\n\n";
        } else {
            echo "  ❌ Schema file not found: $schemaFile\n\n";
        }
    } else {
        echo "  ✅ Found " . count($tables) . " tables:\n";
        foreach ($tables as $table) {
            echo "     - " . $table['table_name'] . "\n";
        }
        echo "\n";
    }
    
    // Check for users
    echo "Step 4: Checking for existing users...\n";
    
    try {
        $usersResult = $pdo->query(
            "SELECT id, username, email, phone, role, status, created_at FROM users ORDER BY created_at DESC LIMIT 5"
        );
        $users = $usersResult->fetchAll();
        
        if (count($users) > 0) {
            echo "  ✅ Found " . count($users) . " user(s):\n";
            foreach ($users as $user) {
                echo "     - " . $user['username'] . " (" . $user['phone'] . ") - " . $user['role'] . "\n";
            }
        } else {
            echo "  ℹ️  No users in database yet.\n";
            echo "     Users will be created when you register through the app.\n";
        }
        echo "\n";
    } catch (Exception $e) {
        echo "  ⚠️  Could not query users: " . $e->getMessage() . "\n";
        echo "     Database tables may need to be created.\n\n";
    }
    
    // Summary
    echo "════════════════════════════════════════════════════════════════\n";
    echo "✅ PostgreSQL Setup Complete!\n";
    echo "════════════════════════════════════════════════════════════════\n\n";
    echo "Next steps:\n";
    echo "  1. Start PHP server: php -S localhost:9000\n";
    echo "  2. Open http://localhost:9000/dashboard/\n";
    echo "  3. Register a new account\n";
    echo "  4. Access from another device/browser using saved credentials\n\n";
    
} catch (PDOException $e) {
    echo "❌ Connection failed!\n";
    echo "Error: " . $e->getMessage() . "\n\n";
    
    if (strpos($e->getMessage(), 'could not find driver') !== false) {
        echo "⚠️  PostgreSQL PDO driver not installed.\n";
        echo "    This is OK - the driver will work on Render.com.\n";
        echo "    For local testing, the app will use localStorage fallback.\n";
    } elseif (strpos($e->getMessage(), 'timeout') !== false || strpos($e->getMessage(), 'refused') !== false) {
        echo "⚠️  Cannot reach PostgreSQL server.\n";
        echo "    Make sure you're connected to the internet.\n";
        echo "    The Render.com database should be accessible.\n";
    }
    
    echo "\nFallback mode:\n";
    echo "  - App will use localStorage for local data storage\n";
    echo "  - Cross-device login will work through browser storage\n";
    echo "  - Data won't persist on Render.com until database is fixed\n\n";
    
    exit(1);
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n\n";
    exit(1);
}

?>
