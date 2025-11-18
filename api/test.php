<?php
/**
 * GEL-STOCK - API Test Endpoint
 * 
 * Simple endpoint to test API connectivity
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Simple test response
$response = [
    'success' => true,
    'message' => 'GEL-STOCK API is online',
    'timestamp' => date('Y-m-d H:i:s'),
    'php_version' => PHP_VERSION,
    'environment' => 'production'
];

http_response_code(200);
echo json_encode($response);
?>
