<?php
/**
 * GEL-STOCK - Router for PHP Development Server
 * Handles requests and routes to appropriate API endpoints
 */

// Get the requested URI
$request_uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$request_method = $_SERVER['REQUEST_METHOD'];

// Remove leading slash
$request_path = ltrim($request_uri, '/');

// If it's an API request, route to the API
if (strpos($request_path, 'api/') === 0) {
    // Extract the API endpoint
    $endpoint = str_replace('api/', '', $request_path);
    
    // Route to the specific API file
    if (file_exists('api/' . $endpoint)) {
        include 'api/' . $endpoint;
        exit;
    }
}

// If it's a dashboard request or root, serve dashboard
if (empty($request_path) || strpos($request_path, 'dashboard') === 0 || $request_path === 'index.html') {
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
