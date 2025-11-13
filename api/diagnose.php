<?php
/**
 * Diagnostic API - Check system status
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

// Don't require config yet - just check basic PHP
$response = [
    'php_version' => PHP_VERSION,
    'server_time' => date('Y-m-d H:i:s'),
    'errors' => []
];

// Try to include config
try {
    ob_start();
    require_once 'config.php';
    $output = ob_get_clean();
    
    if (!empty($output)) {
        $response['errors'][] = "Config.php produced output: " . substr($output, 0, 200);
    }
    
    // Try to get database connection
    $db = getDbConnection();
    
    if (!$db) {
        $response['errors'][] = "getDbConnection() returned null";
    } else {
        $response['database_connected'] = true;
        $response['database_host'] = DB_HOST;
        $response['database_name'] = DB_NAME;
    }
    
} catch (Exception $e) {
    $response['errors'][] = "Exception: " . $e->getMessage();
} catch (Error $e) {
    $response['errors'][] = "Error: " . $e->getMessage();
}

// Check if Database class exists
if (class_exists('Database')) {
    $response['database_class'] = 'exists';
} else {
    $response['errors'][] = "Database class not found";
}

// Try to load Database class
try {
    ob_start();
    require_once 'Database.php';
    $output = ob_get_clean();
    
    if (!empty($output)) {
        $response['errors'][] = "Database.php produced output: " . substr($output, 0, 200);
    }
    
    if (class_exists('Database')) {
        $response['database_class_loaded'] = true;
    } else {
        $response['errors'][] = "Database class still not found after require";
    }
    
} catch (Exception $e) {
    $response['errors'][] = "Database.php Exception: " . $e->getMessage();
} catch (Error $e) {
    $response['errors'][] = "Database.php Error: " . $e->getMessage();
}

http_response_code(200);
echo json_encode($response, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
?>
