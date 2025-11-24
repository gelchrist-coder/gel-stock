<?php
/**
 * GEL-STOCK - PostgreSQL Database Configuration
 * 
 * This file contains all database connection settings and constants
 * for the business management system using PostgreSQL.
 */

// Enable error reporting for development
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Set the default timezone
date_default_timezone_set('Africa/Accra');

// Database Configuration for PostgreSQL
define('DB_HOST', 'localhost');
define('DB_PORT', 5432);                          // PostgreSQL default port
define('DB_NAME', 'gel_stock');
define('DB_USER', 'postgres');                    // Change to your PostgreSQL username
define('DB_PASS', 'postgres');                    // Change to your PostgreSQL password
define('DB_CHARSET', 'UTF8');

// API Configuration
define('API_VERSION', '1.0');
define('API_BASE_URL', '/api/');

// Application Settings
define('BUSINESS_NAME', "GEL-STOCK");
define('BUSINESS_TYPE', 'Business Management System');
define('DEFAULT_CURRENCY', 'GHS');
define('LOW_STOCK_THRESHOLD', 20);

// Security Settings
define('API_KEY_REQUIRED', false); // Set to true in production
define('CORS_ENABLED', true);

// Response Codes
define('HTTP_OK', 200);
define('HTTP_CREATED', 201);
define('HTTP_BAD_REQUEST', 400);
define('HTTP_UNAUTHORIZED', 401);
define('HTTP_NOT_FOUND', 404);
define('HTTP_METHOD_NOT_ALLOWED', 405);
define('HTTP_INTERNAL_ERROR', 500);

// Enable CORS for frontend requests (only in web mode)
if (CORS_ENABLED && !defined('CLI_MODE')) {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    header('Content-Type: application/json');
}

/**
 * Get Database Connection (PostgreSQL)
 */
function getDbConnection() {
    try {
        // PostgreSQL DSN format: pgsql:host=hostname;port=5432;dbname=database
        $dsn = 'pgsql:host=' . DB_HOST . ';port=' . DB_PORT . ';dbname=' . DB_NAME;
        
        $pdo = new PDO(
            $dsn,
            DB_USER,
            DB_PASS,
            [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ]
        );
        
        // Set client encoding for PostgreSQL
        $pdo->exec("SET NAMES '" . DB_CHARSET . "'");
        
        return $pdo;
    } catch (PDOException $e) {
        http_response_code(500);
        die(json_encode([
            'success' => false,
            'message' => 'Database connection failed',
            'error' => $e->getMessage()
        ]));
    }
}

/**
 * Send Standardized API Response
 */
function sendResponse($data, $statusCode = HTTP_OK) {
    http_response_code($statusCode);
    echo json_encode($data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

/**
 * Get Request Method
 */
function getRequestMethod() {
    return $_SERVER['REQUEST_METHOD'] ?? 'GET';
}

/**
 * Get Request Data
 */
function getRequestData() {
    $method = getRequestMethod();
    
    if ($method === 'GET') {
        return $_GET;
    }
    
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    return is_array($data) ? $data : [];
}

/**
 * Validate Ghana Phone Number
 */
function isValidGhanaPhone($phone) {
    // Ghana phone format: +233XXXXXXXXX or 0XXXXXXXXX
    $pattern = '/^(\+233|0)?[0-9]{9}$/';
    return preg_match($pattern, $phone) === 1;
}

/**
 * Validate Email
 */
function isValidEmail($email) {
    return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
}

/**
 * Format Currency (GHS)
 */
function formatCurrency($amount) {
    return '₵' . number_format($amount, 2);
}

/**
 * Sanitize Input
 */
function sanitizeInput($input) {
    if (is_array($input)) {
        return array_map('sanitizeInput', $input);
    }
    return htmlspecialchars(trim($input), ENT_QUOTES, 'UTF-8');
}
