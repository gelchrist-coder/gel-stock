<?php
/**
 * GEL-STOCK - Router for PHP Development Server
 * Handles requests and routes to appropriate API endpoints
 */

// Set error reporting
error_reporting(E_ALL);
ini_set('display_errors', 0); // Log errors instead of displaying
ini_set('log_errors', 1);

// Get the requested URI
$request_uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$request_method = $_SERVER['REQUEST_METHOD'];

// Remove leading slash
$request_path = ltrim($request_uri, '/');

// If it's an API request, route to the API
if (strpos($request_path, 'api/') === 0) {
    // Extract the API endpoint
    $endpoint = str_replace('api/', '', $request_path);
    
    // Remove query string from endpoint
    $endpoint = strtok($endpoint, '?');
    
    // Route to the specific API file
    if (file_exists('api/' . $endpoint)) {
        include 'api/' . $endpoint;
        exit;
    } elseif (file_exists('api/' . basename($endpoint) . '.php')) {
        include 'api/' . basename($endpoint) . '.php';
        exit;
    }
    
    // If endpoint doesn't exist, return 404
    http_response_code(404);
    echo json_encode(['success' => false, 'message' => 'API endpoint not found']);
    exit;
}

// If it's a dashboard request or root, serve dashboard
if (empty($request_path) || $request_path === 'index.html' || strpos($request_path, 'dashboard') === 0) {
    include 'dashboard/index.html';
    exit;
}

// Check if file exists (for assets, CSS, JS)
if (file_exists($request_path)) {
    // Let the server serve static files
    return false;
}

// Default: serve dashboard
include 'dashboard/index.html';
?>
