#!/usr/bin/env php
<?php
/**
 * GEL-STOCK - PostgreSQL User Check (CLI)
 * This script checks for users in the PostgreSQL Render.com database
 * 
 * Usage: php api/check_db.php
 * Or access web version at: http://localhost:9000/api/check_users_web.php
 */

// Prevent headers from being sent (for CLI use)
define('CLI_MODE', true);

require_once __DIR__ . '/config.php';

echo "\n";
echo "════════════════════════════════════════════════════════════════\n";
echo "  GEL-STOCK PostgreSQL Database Check\n";
echo "════════════════════════════════════════════════════════════════\n\n";

try {
    $db = getDbConnection();
    
    if (!$db) {
        echo "❌ FAILED TO CONNECT\n";
        echo "  Host: " . DB_HOST . "\n";
        echo "  Database: " . DB_NAME . "\n\n";
        echo "Note: Local environment lacks PostgreSQL driver (pdo_pgsql)\n";
        echo "Use web interface: http://localhost:9000/api/check_users_web.php\n\n";
        exit(1);
    }
    
    echo "✅ DATABASE CONNECTION SUCCESSFUL\n";
    echo "  Host: " . DB_HOST . "\n";
    echo "  Port: " . DB_PORT . "\n";
    echo "  Database: " . DB_NAME . "\n";
    echo "  User: " . DB_USER . "\n\n";
    
    // Check users table
    echo "════════════════════════════════════════════════════════════════\n";
    echo "  USERS TABLE\n";
    echo "════════════════════════════════════════════════════════════════\n\n";
    
    $stmt = $db->query("SELECT id, username, email, first_name, last_name, phone, role, status, created_at FROM users ORDER BY created_at DESC");
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "Total Users: " . count($users) . "\n\n";
    
    if (count($users) > 0) {
        foreach ($users as $index => $user) {
            $num = $index + 1;
            echo "─────────────────────────────────────────────────────────────\n";
            echo "[$num] User Details:\n";
            echo "    ID:       {$user['id']}\n";
            echo "    Username: {$user['username']}\n";
            echo "    Email:    " . ($user['email'] ? $user['email'] : '(not set)') . "\n";
            echo "    Name:     {$user['first_name']} {$user['last_name']}\n";
            echo "    Phone:    " . ($user['phone'] ? $user['phone'] : '(not set)') . "\n";
            echo "    Role:     {$user['role']}\n";
            echo "    Status:   {$user['status']}\n";
            echo "    Created:  {$user['created_at']}\n";
        }
        echo "\n─────────────────────────────────────────────────────────────\n\n";
    } else {
        echo "ℹ️  No users currently in database.\n";
        echo "    Register a new user through the application to get started.\n\n";
    }
    
    // Database statistics
    echo "════════════════════════════════════════════════════════════════\n";
    echo "  DATABASE STATISTICS\n";
    echo "════════════════════════════════════════════════════════════════\n\n";
    
    $tables = [
        'users' => 'User Accounts',
        'products' => 'Products',
        'sales' => 'Sales Transactions',
        'sales_items' => 'Sales Items',
        'customers' => 'Customers',
        'suppliers' => 'Suppliers'
    ];
    
    $stats = [];
    foreach ($tables as $table => $label) {
        try {
            $result = $db->query("SELECT COUNT(*) as count FROM $table");
            $row = $result->fetch();
            $count = $row['count'] ?? 0;
            $stats[$label] = $count;
            printf("  %-20s: %d\n", $label, $count);
        } catch (Exception $e) {
            printf("  %-20s: Error\n", $label);
        }
    }
    
    echo "\n";
    echo "════════════════════════════════════════════════════════════════\n";
    echo "✅ Check complete. Database is responsive and accessible.\n";
    echo "════════════════════════════════════════════════════════════════\n\n";
    
} catch (PDOException $e) {
    echo "❌ DATABASE ERROR\n";
    echo "  " . $e->getMessage() . "\n\n";
    
    if (strpos($e->getMessage(), 'could not find driver') !== false) {
        echo "PostgreSQL PDO driver not installed on this system.\n";
        echo "This is OK for development - the driver will be available on Render.com.\n";
        echo "\nTo check database from web server:\n";
        echo "  1. Start PHP server: php -S localhost:9000\n";
        echo "  2. Visit: http://localhost:9000/api/check_users_web.php\n\n";
    }
    exit(1);
} catch (Exception $e) {
    echo "❌ ERROR: " . $e->getMessage() . "\n\n";
    exit(1);
}

?>
