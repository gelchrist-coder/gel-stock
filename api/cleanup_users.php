<?php
/**
 * GEL-STOCK - User Cleanup Script
 * 
 * This script removes all existing users and their related data from the database.
 * WARNING: This will delete all users and cannot be undone!
 */

require_once 'config.php';
require_once 'Database.php';

// Color codes for terminal output
$colors = [
    'reset' => "\033[0m",
    'red' => "\033[31m",
    'green' => "\033[32m",
    'yellow' => "\033[33m",
    'blue' => "\033[34m",
];

function printMessage($message, $type = 'info') {
    global $colors;
    
    switch($type) {
        case 'success':
            echo $colors['green'] . "✓ " . $message . $colors['reset'] . "\n";
            break;
        case 'error':
            echo $colors['red'] . "✗ " . $message . $colors['reset'] . "\n";
            break;
        case 'warning':
            echo $colors['yellow'] . "⚠ " . $message . $colors['reset'] . "\n";
            break;
        case 'info':
            echo $colors['blue'] . "ℹ " . $message . $colors['reset'] . "\n";
            break;
    }
}

try {
    printMessage("GEL-STOCK User Cleanup Script", 'info');
    printMessage("=" . str_repeat("=", 50), 'info');
    
    // Connect to database
    $db = new Database();
    
    if (!$db->getConnection()) {
        throw new Exception("Failed to connect to database");
    }
    
    printMessage("Database connected successfully", 'success');
    
    // Get current user count
    $result = $db->select("SELECT COUNT(*) as count FROM users");
    $currentCount = $result[0]['count'] ?? 0;
    
    if ($currentCount === 0) {
        printMessage("No users found in database - nothing to delete", 'info');
        exit(0);
    }
    
    printMessage("Found $currentCount user(s) in database", 'warning');
    
    // List tables that will be cleaned
    $tables = [
        'user_products',
        'user_sales',
        'user_settings',
        'user_credits',
        'users'
    ];
    
    printMessage("\nTables to be cleaned:", 'info');
    foreach ($tables as $table) {
        echo "  • $table\n";
    }
    
    // Confirm deletion
    echo "\n";
    printMessage("WARNING: This will delete ALL users and their related data!", 'warning');
    echo "Type 'DELETE ALL USERS' to confirm: ";
    $input = trim(fgets(STDIN));
    
    if ($input !== 'DELETE ALL USERS') {
        printMessage("Cleanup cancelled", 'error');
        exit(1);
    }
    
    printMessage("Starting cleanup...", 'info');
    
    // Start transaction
    $pdo = $db->getConnection();
    $pdo->beginTransaction();
    
    try {
        // Disable foreign key checks temporarily
        $pdo->exec("SET FOREIGN_KEY_CHECKS = 0");
        
        // Delete from each table
        foreach ($tables as $table) {
            try {
                $stmt = $pdo->prepare("DELETE FROM $table");
                $stmt->execute();
                $deletedCount = $stmt->rowCount();
                
                if ($deletedCount > 0) {
                    printMessage("Deleted $deletedCount record(s) from '$table'", 'success');
                } else {
                    printMessage("No records in '$table'", 'info');
                }
            } catch (Exception $e) {
                printMessage("Table '$table' may not exist - skipping", 'warning');
            }
        }
        
        // Re-enable foreign key checks
        $pdo->exec("SET FOREIGN_KEY_CHECKS = 1");
        
        // Commit transaction
        $pdo->commit();
        
        printMessage("=" . str_repeat("=", 50), 'info');
        printMessage("All users have been successfully deleted!", 'success');
        
    } catch (Exception $e) {
        $pdo->rollBack();
        $pdo->exec("SET FOREIGN_KEY_CHECKS = 1");
        throw new Exception("Transaction failed: " . $e->getMessage());
    }
    
} catch (Exception $e) {
    printMessage("Error: " . $e->getMessage(), 'error');
    exit(1);
}
?>
