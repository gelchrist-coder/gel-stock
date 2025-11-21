<?php
/**
 * GEL-STOCK - Azure Cloud Database Configuration
 * 
 * This is the configuration file for connecting to Azure Database for MySQL
 * 
 * SETUP INSTRUCTIONS:
 * 1. Create Azure Database for MySQL in Azure Portal
 * 2. Fill in the values below with your Azure credentials
 * 3. Download DigiCertGlobalRootCA.crt certificate (see below)
 * 4. Rename this file from config_azure.php to config.php (or update your includes)
 * 5. Upload the certificate file to the same directory as this file
 */

// ============================================================================
// AZURE DATABASE CREDENTIALS - FILL THESE IN
// ============================================================================

// Your Azure MySQL server hostname
// Format: your-server-name.mysql.database.azure.com
$host = 'your-server-name.mysql.database.azure.com';

// Your Azure MySQL username
// Format: username@server-name (the @server-name part is important!)
$username = 'yourusername@your-server-name';

// Your Azure MySQL password (the one you set during creation)
$password = 'YourStrongPassword123!';

// Database name
$database = 'gel_stock';

// MySQL port (usually 3306)
$port = 3306;

// ============================================================================
// SSL CERTIFICATE FOR AZURE (Required)
// Download from: https://cacerts.digicert.com/DigiCertGlobalRootCA.crt
// Save as: api/DigiCertGlobalRootCA.crt
// ============================================================================

$certPath = __DIR__ . '/DigiCertGlobalRootCA.crt';

// ============================================================================
// PDO CONNECTION OPTIONS
// ============================================================================

$options = array(
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4",
    PDO::MYSQL_ATTR_SSL_CA => $certPath,
    PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT => false // For development only
);

// ============================================================================
// CREATE DATABASE CONNECTION
// ============================================================================

try {
    $dsn = "mysql:host=$host;port=$port;dbname=$database;charset=utf8mb4";
    
    $db = new PDO($dsn, $username, $password, $options);
    
    // Set error mode to throw exceptions
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Log successful connection (for debugging)
    error_log('✅ Successfully connected to Azure Database for MySQL');
    
} catch (PDOException $e) {
    // Log connection error
    error_log('❌ Azure Database Connection Error: ' . $e->getMessage());
    
    // Show user-friendly error
    die('Database connection failed. Please check your Azure credentials and SSL certificate. Error: ' . $e->getMessage());
}

// ============================================================================
// HELPER FUNCTIONS (same as config.php)
// ============================================================================

/**
 * Get HTTP request method
 */
function getRequestMethod() {
    return $_SERVER['REQUEST_METHOD'];
}

/**
 * Get request data (JSON or form data)
 */
function getRequestData() {
    $method = getRequestMethod();
    
    if ($method === 'GET') {
        return $_GET;
    } else if ($method === 'POST' || $method === 'PUT' || $method === 'DELETE') {
        $input = file_get_contents('php://input');
        $data = json_decode($input, true);
        return $data ?? $_POST;
    }
    
    return array();
}

/**
 * Send JSON response
 */
function sendResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    header('Content-Type: application/json');
    echo json_encode($data);
    exit;
}

/**
 * Sanitize input
 */
function sanitizeInput($input) {
    if (is_array($input)) {
        return array_map('sanitizeInput', $input);
    }
    return htmlspecialchars(strip_tags($input), ENT_QUOTES, 'UTF-8');
}

/**
 * Validate Ghana phone number
 */
function validateGhanaPhone($phone) {
    $phone = preg_replace('/[^0-9+]/', '', $phone);
    
    // Accept formats: +233XXXXXXXXX or 0XXXXXXXXX
    return preg_match('/^(\+233|0)[0-9]{9}$/', $phone);
}

/**
 * Format Ghana phone number
 */
function formatGhanaPhone($phone) {
    $phone = preg_replace('/[^0-9+]/', '', $phone);
    
    // Convert 0 to +233
    if (substr($phone, 0, 1) === '0') {
        $phone = '+233' . substr($phone, 1);
    }
    
    return $phone;
}

// ============================================================================
// HTTP STATUS CODES
// ============================================================================

define('HTTP_OK', 200);
define('HTTP_CREATED', 201);
define('HTTP_BAD_REQUEST', 400);
define('HTTP_NOT_FOUND', 404);
define('HTTP_INTERNAL_ERROR', 500);

// ============================================================================
// CORS HEADERS (enable cross-origin requests if needed)
// ============================================================================

$cors_enabled = true; // Set to false to disable CORS

if ($cors_enabled) {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    
    // Handle preflight requests
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit;
    }
}

?>
