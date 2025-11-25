<?php
/**
 * Health Check Endpoint
 * Simple test to verify API is running
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

// Check if DATABASE_URL is set
$database_url = getenv('DATABASE_URL');
$db_status = $database_url ? 'configured' : 'not_configured';

// Return health status
http_response_code(200);
echo json_encode([
    'success' => true,
    'message' => 'API is running',
    'timestamp' => date('Y-m-d H:i:s'),
    'php_version' => PHP_VERSION,
    'database_url' => $db_status,
    'server' => $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown'
]);
exit;
?>
