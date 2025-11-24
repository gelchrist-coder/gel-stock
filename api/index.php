<?php
/**
 * GEL-STOCK API Router
 * Routes requests to appropriate handlers
 * Supports deployment on Render.com and local development
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle OPTIONS requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Get request path
$request_path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$request_path = str_replace('/api/', '', $request_path);
$request_path = trim($request_path, '/');

// Map of endpoints to files
$routes = [
    'auth' => 'auth_fallback.php',
    'auth_fallback' => 'auth_fallback.php',
    'login' => 'auth_fallback.php',
    'register' => 'auth_fallback.php',
    'logout' => 'auth_fallback.php',
    'verify-token' => 'auth_fallback.php',
    
    'products' => 'products.php',
    'product' => 'products.php',
    
    'sales' => 'sales.php',
    'sale' => 'sales.php',
    
    'customers' => 'customers.php',
    'customer' => 'customers.php',
    
    'suppliers' => 'suppliers.php',
    'supplier' => 'suppliers.php',
    
    'dashboard' => 'dashboard.php',
    
    'admin_stats' => 'admin_stats.php',
    'analytics' => 'dashboard.php',
    
    'test' => 'test.php',
    'health' => 'test.php',
];

// Determine which file to include
$endpoint = $request_path ?: 'auth_fallback';
$file = isset($routes[$endpoint]) ? $routes[$endpoint] : null;

if ($file && file_exists(__DIR__ . '/' . $file)) {
    include __DIR__ . '/' . $file;
} else {
    http_response_code(404);
    echo json_encode([
        'success' => false,
        'message' => 'Endpoint not found: ' . $endpoint,
        'available_endpoints' => array_keys($routes),
        'timestamp' => date('Y-m-d H:i:s')
    ]);
}
?>
