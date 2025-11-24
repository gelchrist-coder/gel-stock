<?php
/**
 * Check User Registrations
 * Query Render.com PostgreSQL database for owner registrations
 */

require_once 'api/config_postgresql.php';

try {
    $db = getDbConnection();
    
    // Query all users
    $stmt = $db->query("SELECT id, username, email, first_name, last_name, phone, role, status, created_at FROM users ORDER BY created_at DESC");
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Query owners specifically
    $stmtOwners = $db->query("SELECT id, username, email, first_name, last_name, phone, role, status, created_at FROM users WHERE role = 'owner' ORDER BY created_at DESC");
    $owners = $stmtOwners->fetchAll(PDO::FETCH_ASSOC);
    
    // Display results
    echo "=== GEL-STOCK User Registration Report ===\n\n";
    
    echo "Total Users: " . count($users) . "\n";
    echo "Total Owners: " . count($owners) . "\n\n";
    
    if (count($users) > 0) {
        echo "--- ALL USERS ---\n";
        foreach ($users as $user) {
            echo "ID: " . $user['id'] . "\n";
            echo "Username: " . $user['username'] . "\n";
            echo "Email: " . $user['email'] . "\n";
            echo "Name: " . ($user['first_name'] ?? '') . " " . ($user['last_name'] ?? '') . "\n";
            echo "Phone: " . $user['phone'] . "\n";
            echo "Role: " . $user['role'] . "\n";
            echo "Status: " . $user['status'] . "\n";
            echo "Registered: " . $user['created_at'] . "\n";
            echo "---\n\n";
        }
    } else {
        echo "No users registered yet.\n\n";
    }
    
    if (count($owners) > 0) {
        echo "--- OWNER REGISTRATIONS ---\n";
        foreach ($owners as $owner) {
            echo "ID: " . $owner['id'] . "\n";
            echo "Username: " . $owner['username'] . "\n";
            echo "Email: " . $owner['email'] . "\n";
            echo "Name: " . ($owner['first_name'] ?? '') . " " . ($owner['last_name'] ?? '') . "\n";
            echo "Phone: " . $owner['phone'] . "\n";
            echo "Status: " . $owner['status'] . "\n";
            echo "Registered: " . $owner['created_at'] . "\n";
            echo "---\n\n";
        }
    } else {
        echo "No owner registrations yet.\n\n";
    }
    
    echo "✓ Database check completed successfully!\n";
    
} catch (PDOException $e) {
    echo "❌ Database Error: " . $e->getMessage() . "\n";
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}
?>
