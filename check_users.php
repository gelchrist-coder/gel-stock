<?php
/**
 * Check Users in PostgreSQL Database
 * Connects to Render.com PostgreSQL and lists all users
 */

require_once 'api/config.php';

echo "=== GEL-STOCK PostgreSQL User Check ===\n\n";

try {
    $db = getDbConnection();
    
    if (!$db) {
        echo "❌ Failed to connect to PostgreSQL database\n";
        echo "Host: " . DB_HOST . "\n";
        echo "Database: " . DB_NAME . "\n";
        exit(1);
    }
    
    echo "✅ Connected to PostgreSQL successfully!\n";
    echo "Database: " . DB_NAME . " @ " . DB_HOST . "\n\n";
    
    // Query all users
    $stmt = $db->query("SELECT id, username, email, first_name, last_name, phone, role, status, created_at FROM users ORDER BY created_at DESC");
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "=== Users in Database ===\n";
    echo "Total Users: " . count($users) . "\n\n";
    
    if (count($users) > 0) {
        echo "User Details:\n";
        echo str_repeat("-", 120) . "\n";
        
        foreach ($users as $index => $user) {
            $num = $index + 1;
            echo "\n[$num] User ID: {$user['id']}\n";
            echo "    Username: {$user['username']}\n";
            echo "    Email: {$user['email']}\n";
            echo "    Name: {$user['first_name']} {$user['last_name']}\n";
            echo "    Phone: {$user['phone']}\n";
            echo "    Role: {$user['role']}\n";
            echo "    Status: {$user['status']}\n";
            echo "    Created: {$user['created_at']}\n";
        }
        
        echo "\n" . str_repeat("-", 120) . "\n";
    } else {
        echo "ℹ️  No users found in the database.\n";
        echo "You can create the first user by registering through the application.\n";
    }
    
    // Additional stats
    echo "\n=== Database Statistics ===\n";
    
    // Count records in other tables
    $tables = ['products', 'sales', 'customers', 'suppliers'];
    
    foreach ($tables as $table) {
        try {
            $result = $db->query("SELECT COUNT(*) as count FROM $table");
            $row = $result->fetch();
            echo "$table: {$row['count']} records\n";
        } catch (Exception $e) {
            echo "$table: Error reading table\n";
        }
    }
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    echo "Error Code: " . $e->getCode() . "\n";
    exit(1);
}
?>
