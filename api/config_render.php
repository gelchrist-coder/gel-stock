<?php
/**
 * Render.com Configuration
 * Uses DATABASE_URL environment variable
 */

// Parse DATABASE_URL from Render.com environment
$database_url = getenv('DATABASE_URL');

if ($database_url) {
    // Render.com provides: postgres://user:password@host:port/database
    $parsed = parse_url($database_url);
    
    $db_host = $parsed['host'] ?? 'localhost';
    $db_port = $parsed['port'] ?? 5432;
    $db_user = $parsed['user'] ?? 'postgres';
    $db_password = $parsed['pass'] ?? '';
    $db_name = ltrim($parsed['path'] ?? '/gel_stock', '/');
    
} else {
    // Fallback for local development
    $db_host = getenv('DB_HOST') ?? 'localhost';
    $db_port = getenv('DB_PORT') ?? 5432;
    $db_user = getenv('DB_USER') ?? 'postgres';
    $db_password = getenv('DB_PASSWORD') ?? '';
    $db_name = getenv('DB_NAME') ?? 'gel_stock';
}

// Enable CORS for frontend requests
define('CORS_ENABLED', true);
define('CORS_ORIGIN', '*');

// Database Configuration
define('DB_HOST', $db_host);
define('DB_PORT', $db_port);
define('DB_USER', $db_user);
define('DB_PASSWORD', $db_password);
define('DB_NAME', $db_name);
define('DB_DRIVER', 'pgsql'); // PostgreSQL on Render.com

// API Configuration
define('API_VERSION', '2.0');
define('API_TIMEOUT', 30);

// Session Configuration
define('SESSION_TIMEOUT', 2592000); // 30 days in seconds
define('SESSION_TOKEN_LENGTH', 64); // 64-character tokens

// Security Configuration
define('BCRYPT_COST', 12); // Password hashing cost
define('CSRF_TOKEN_LENGTH', 32);

// Feature Flags
define('ENABLE_OFFLINE_MODE', true); // Hybrid fallback
define('ENABLE_DEVICE_TRACKING', true);
define('ENABLE_AUTO_BACKUP', true);

// Logging
define('LOG_ERRORS', true);
define('LOG_FILE', '/tmp/gel-stock-api.log');

/**
 * Get PDO Database Connection
 */
function getDbConnection() {
    try {
        $dsn = "pgsql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME;
        $pdo = new PDO(
            $dsn,
            DB_USER,
            DB_PASSWORD,
            [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_TIMEOUT => API_TIMEOUT
            ]
        );
        return $pdo;
    } catch (PDOException $e) {
        error_log("Database connection failed: " . $e->getMessage());
        return null;
    }
}

/**
 * Send standardized JSON response
 */
function sendResponse($data = [], $statusCode = 200) {
    http_response_code($statusCode);
    header('Content-Type: application/json');
    header('Access-Control-Allow-Origin: ' . (CORS_ENABLED ? CORS_ORIGIN : ''));
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    
    echo json_encode($data);
    exit;
}

/**
 * Get request method
 */
function getRequestMethod() {
    return $_SERVER['REQUEST_METHOD'] ?? 'GET';
}

/**
 * Get JSON request data
 */
function getRequestData() {
    $input = file_get_contents('php://input');
    return json_decode($input, true) ?? $_POST ?? [];
}

/**
 * Validate Ghana phone number
 */
function validatePhoneNumber($phone) {
    // Ghana format: 0501234567 or +233501234567
    return preg_match('/^(\+233|0)?[0-9]{9}$/', $phone);
}

/**
 * Validate email
 */
function validateEmail($email) {
    return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
}

/**
 * Generate secure token
 */
function generateToken($length = SESSION_TOKEN_LENGTH) {
    return bin2hex(random_bytes($length / 2));
}

/**
 * Hash password securely
 */
function hashPassword($password) {
    return password_hash($password, PASSWORD_BCRYPT, ['cost' => BCRYPT_COST]);
}

/**
 * Verify password
 */
function verifyPassword($password, $hash) {
    return password_verify($password, $hash);
}

/**
 * Log errors
 */
function logError($message, $context = []) {
    if (!LOG_ERRORS) return;
    
    $timestamp = date('Y-m-d H:i:s');
    $log_message = "[$timestamp] $message";
    
    if (!empty($context)) {
        $log_message .= " " . json_encode($context);
    }
    
    if (is_writable(dirname(LOG_FILE))) {
        file_put_contents(LOG_FILE, $log_message . "\n", FILE_APPEND);
    }
}

/**
 * Get client IP address
 */
function getClientIp() {
    if (!empty($_SERVER['HTTP_CF_CONNECTING_IP'])) {
        return $_SERVER['HTTP_CF_CONNECTING_IP']; // Cloudflare
    } elseif (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
        return explode(',', $_SERVER['HTTP_X_FORWARDED_FOR'])[0];
    } else {
        return $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    }
}

// Handle preflight requests
if (getRequestMethod() === 'OPTIONS') {
    sendResponse(['success' => true], 200);
}

?>
