<?php
/**
 * GEL-STOCK - PostgreSQL Configuration (Render.com)
 * 
 * This file contains all database connection settings and constants
 * for the business management system using PostgreSQL on Render.com.
 */

// Enable error reporting for development
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Set the default timezone
date_default_timezone_set('Africa/Accra');

// Database Configuration for PostgreSQL (Render.com Hosted)
define('DB_HOST', 'dpg-d4ictcjqkflc73b4e3b0-a.oregon-postgres.render.com');
define('DB_PORT', 5432);                          // PostgreSQL default port
define('DB_NAME', 'gelstockdb');
define('DB_USER', 'gelstockdb_user');             // Render.com database user
define('DB_PASS', '4y8yiyVYLXlWRtDHj107hE2xgRe0Qe3A');  // Render.com database password
define('DB_CHARSET', 'UTF8');
define('DB_SSL', true);                           // Render.com requires SSL

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
    
    // Handle preflight requests
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit;
    }
}

// Set JSON content type for all API responses (only in web mode)
if (!defined('CLI_MODE')) {
    header('Content-Type: application/json; charset=utf-8');
}

/**
 * Get database connection
 * @return PDO|null Database connection or null on failure
 */
function getDbConnection() {
    static $pdo = null;
    
    if ($pdo === null) {
        try {
            // PostgreSQL DSN format: pgsql:host=hostname;port=5432;dbname=database
            $dsn = 'pgsql:host=' . DB_HOST . ';port=' . DB_PORT . ';dbname=' . DB_NAME;
            
            // Add SSL mode for remote connections (Render.com requires SSL)
            if (defined('DB_SSL') && DB_SSL) {
                $dsn .= ';sslmode=require';
            }
            
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false
            ];
            
            $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
            
            // Set client encoding for PostgreSQL
            $pdo->exec("SET client_encoding = 'UTF-8'");
            
        } catch (PDOException $e) {
            error_log("Database connection failed: " . $e->getMessage());
            // Don't exit here - let the caller handle the error
            // This allows admin_stats.php to return graceful error responses
            return false;
        }
    }
    
    return $pdo;
}

/**
 * Send JSON response
 */
function sendResponse($data, $statusCode = HTTP_OK) {
    http_response_code($statusCode);
    echo json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    exit;
}

/**
 * Send error response
 */
function sendErrorResponse($statusCode, $message, $details = null) {
    $response = [
        'success' => false,
        'error' => [
            'code' => $statusCode,
            'message' => $message
        ]
    ];
    
    if ($details) {
        $response['error']['details'] = $details;
    }
    
    sendResponse($response, $statusCode);
}

/**
 * Send success response
 */
function sendSuccessResponse($data = null, $message = 'Success', $statusCode = HTTP_OK) {
    $response = [
        'success' => true,
        'message' => $message
    ];
    
    if ($data !== null) {
        $response['data'] = $data;
    }
    
    sendResponse($response, $statusCode);
}

/**
 * Validate required fields
 */
function validateRequiredFields($data, $requiredFields) {
    $missing = [];
    
    foreach ($requiredFields as $field) {
        if (!isset($data[$field]) || empty(trim($data[$field]))) {
            $missing[] = $field;
        }
    }
    
    return $missing;
}

/**
 * Sanitize input data
 */
function sanitizeInput($data) {
    if (is_array($data)) {
        return array_map('sanitizeInput', $data);
    }
    
    return htmlspecialchars(trim($data), ENT_QUOTES, 'UTF-8');
}

/**
 * Get request method
 */
function getRequestMethod() {
    return $_SERVER['REQUEST_METHOD'] ?? 'GET';
}

/**
 * Get request data
 */
function getRequestData() {
    $method = getRequestMethod();
    
    switch ($method) {
        case 'POST':
        case 'PUT':
            $input = file_get_contents('php://input');
            $data = json_decode($input, true);
            return $data ?: $_POST;
            
        case 'GET':
            return $_GET;
            
        case 'DELETE':
            return $_GET;
            
        default:
            return [];
    }
}

/**
 * Log activity for debugging
 */
function logActivity($action, $data = null) {
    $log = [
        'timestamp' => date('Y-m-d H:i:s'),
        'action' => $action,
        'method' => getRequestMethod(),
        'data' => $data
    ];
    
    error_log("API Activity: " . json_encode($log));
}

/**
 * Generate unique ID
 */
function generateId($prefix = '') {
    return $prefix . strtoupper(uniqid());
}

/**
 * Format currency
 */
function formatCurrency($amount) {
    return DEFAULT_CURRENCY . ' ' . number_format($amount, 2);
}

/**
 * Validate email
 */
function isValidEmail($email) {
    return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
}

/**
 * Validate phone number (basic Ghana format)
 */
function isValidPhone($phone) {
    // Remove spaces and dashes
    $phone = preg_replace('/[\s\-]/', '', $phone);
    
    // Check for Ghana phone number format
    return preg_match('/^(\+233|0)?[0-9]{9}$/', $phone);
}

// Initialize database connection on include
$db = getDbConnection();

?>
