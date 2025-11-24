<?php
/**
 * Authentication API
 * Handles user login, registration, and token verification
 * Supports cross-device login with session persistence
 */

require_once 'config.php';
require_once 'Database.php';

$method = getRequestMethod();
$data = getRequestData();

switch ($method) {
    case 'POST':
        handleAuthRequest($data);
        break;
    case 'GET':
        handleTokenVerify($data);
        break;
    default:
        sendResponse(['success' => false, 'message' => 'Method not allowed'], 405);
}

/**
 * Handle authentication requests (login, register)
 */
function handleAuthRequest($data) {
    $db = new Database();
    $action = $data['action'] ?? null;
    
    if ($action === 'login') {
        handleLogin($db, $data);
    } elseif ($action === 'register') {
        handleRegister($db, $data);
    } else {
        sendResponse(['success' => false, 'message' => 'Invalid action'], 400);
    }
}

/**
 * Login user and create session
 */
function handleLogin($db, $data) {
    $phone = $data['phone'] ?? null;
    $password = $data['password'] ?? null;
    
    if (!$phone || !$password) {
        sendResponse(['success' => false, 'message' => 'Phone and password required'], 400);
        return;
    }
    
    // Normalize phone number
    $phone = normalizePhoneNumber($phone);
    
    try {
        // Find user by phone
        $users = $db->select(
            "SELECT id, username, email, first_name, last_name, phone, password_hash, role, status, business_name 
             FROM users WHERE phone = ? AND status = 'active' LIMIT 1",
            [$phone]
        );
        
        if (!$users || count($users) === 0) {
            sendResponse(['success' => false, 'message' => 'Invalid phone or password'], 401);
            return;
        }
        
        $user = $users[0];
        
        // Verify password
        if (!password_verify($password, $user['password_hash'])) {
            sendResponse(['success' => false, 'message' => 'Invalid phone or password'], 401);
            return;
        }
        
        // Create session token
        $sessionToken = bin2hex(random_bytes(32));
        $deviceName = $data['device_name'] ?? 'Unknown Device';
        $deviceType = $data['device_type'] ?? detectDeviceType();
        $ipAddress = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
        $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? 'unknown';
        $expiresAt = date('Y-m-d H:i:s', strtotime('+30 days'));
        
        // Store session in database
        $db->insert('user_sessions', [
            'user_id' => $user['id'],
            'session_token' => $sessionToken,
            'device_name' => $deviceName,
            'device_type' => $deviceType,
            'ip_address' => $ipAddress,
            'user_agent' => $userAgent,
            'expires_at' => $expiresAt,
            'created_at' => date('Y-m-d H:i:s')
        ]);
        
        // Return user data and token
        sendResponse([
            'success' => true,
            'message' => 'Login successful',
            'data' => [
                'session_token' => $sessionToken,
                'expires_at' => $expiresAt,
                'user' => [
                    'id' => $user['id'],
                    'username' => $user['username'],
                    'email' => $user['email'],
                    'first_name' => $user['first_name'],
                    'last_name' => $user['last_name'],
                    'phone' => $user['phone'],
                    'role' => $user['role'],
                    'business_name' => $user['business_name']
                ]
            ]
        ], 200);
        
    } catch (Exception $e) {
        sendResponse(['success' => false, 'message' => 'Login failed: ' . $e->getMessage()], 500);
    }
}

/**
 * Register new user
 */
function handleRegister($db, $data) {
    $phone = $data['phone'] ?? null;
    $password = $data['password'] ?? null;
    $firstName = $data['first_name'] ?? null;
    $lastName = $data['last_name'] ?? null;
    $businessName = $data['business_name'] ?? null;
    $email = $data['email'] ?? null;
    
    if (!$phone || !$password || !$firstName || !$businessName) {
        sendResponse(['success' => false, 'message' => 'Phone, password, first name, and business name required'], 400);
        return;
    }
    
    // Normalize phone number
    $phone = normalizePhoneNumber($phone);
    
    try {
        // Check if user already exists
        $existing = $db->select(
            "SELECT id FROM users WHERE phone = ?",
            [$phone]
        );
        
        if ($existing && count($existing) > 0) {
            sendResponse(['success' => false, 'message' => 'Phone number already registered'], 409);
            return;
        }
        
        // Hash password
        $passwordHash = password_hash($password, PASSWORD_BCRYPT);
        
        // Create username from phone
        $username = 'user_' . str_replace('+233', '233', $phone);
        
        // Insert new user
        $userId = $db->insert('users', [
            'username' => $username,
            'email' => $email,
            'first_name' => $firstName,
            'last_name' => $lastName,
            'phone' => $phone,
            'password_hash' => $passwordHash,
            'role' => 'owner',
            'business_name' => $businessName,
            'status' => 'active',
            'created_at' => date('Y-m-d H:i:s')
        ]);
        
        // Create initial session
        $sessionToken = bin2hex(random_bytes(32));
        $deviceName = $data['device_name'] ?? 'Registration Device';
        $deviceType = $data['device_type'] ?? detectDeviceType();
        $ipAddress = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
        $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? 'unknown';
        $expiresAt = date('Y-m-d H:i:s', strtotime('+30 days'));
        
        $db->insert('user_sessions', [
            'user_id' => $userId,
            'session_token' => $sessionToken,
            'device_name' => $deviceName,
            'device_type' => $deviceType,
            'ip_address' => $ipAddress,
            'user_agent' => $userAgent,
            'expires_at' => $expiresAt,
            'created_at' => date('Y-m-d H:i:s')
        ]);
        
        sendResponse([
            'success' => true,
            'message' => 'Registration successful',
            'data' => [
                'session_token' => $sessionToken,
                'expires_at' => $expiresAt,
                'user' => [
                    'id' => $userId,
                    'username' => $username,
                    'email' => $email,
                    'first_name' => $firstName,
                    'last_name' => $lastName,
                    'phone' => $phone,
                    'role' => 'owner',
                    'business_name' => $businessName
                ]
            ]
        ], 201);
        
    } catch (Exception $e) {
        sendResponse(['success' => false, 'message' => 'Registration failed: ' . $e->getMessage()], 500);
    }
}

/**
 * Verify session token
 */
function handleTokenVerify($data) {
    $db = new Database();
    $token = $_GET['token'] ?? null;
    
    if (!$token) {
        sendResponse(['success' => false, 'message' => 'Token required'], 400);
        return;
    }
    
    try {
        $result = $db->select(
            "SELECT us.*, u.id as user_id, u.username, u.email, u.first_name, u.last_name, u.phone, u.role, u.business_name 
             FROM user_sessions us 
             JOIN users u ON us.user_id = u.id 
             WHERE us.session_token = ? AND us.expires_at > NOW() LIMIT 1",
            [$token]
        );
        
        if (!$result || count($result) === 0) {
            sendResponse(['success' => false, 'message' => 'Invalid or expired token'], 401);
            return;
        }
        
        $session = $result[0];
        
        // Update last activity
        $db->update('user_sessions', [
            'last_activity' => date('Y-m-d H:i:s')
        ], $session['id']);
        
        sendResponse([
            'success' => true,
            'message' => 'Token valid',
            'data' => [
                'user' => [
                    'id' => $session['user_id'],
                    'username' => $session['username'],
                    'email' => $session['email'],
                    'first_name' => $session['first_name'],
                    'last_name' => $session['last_name'],
                    'phone' => $session['phone'],
                    'role' => $session['role'],
                    'business_name' => $session['business_name']
                ],
                'device' => [
                    'name' => $session['device_name'],
                    'type' => $session['device_type'],
                    'last_activity' => $session['last_activity']
                ]
            ]
        ]);
        
    } catch (Exception $e) {
        sendResponse(['success' => false, 'message' => 'Token verification failed: ' . $e->getMessage()], 500);
    }
}

/**
 * Normalize phone number to +233 format
 */
function normalizePhoneNumber($phone) {
    $phone = preg_replace('/[^0-9+]/', '', $phone);
    
    if (strpos($phone, '+233') === 0) {
        return $phone;
    } elseif (strpos($phone, '0') === 0) {
        return '+233' . substr($phone, 1);
    } elseif (strpos($phone, '233') === 0) {
        return '+' . $phone;
    }
    
    return '+233' . $phone;
}

/**
 * Detect device type from user agent
 */
function detectDeviceType() {
    $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? '';
    
    if (preg_match('/mobile|android|iphone|ipod|windows phone/i', $userAgent)) {
        return 'mobile';
    } elseif (preg_match('/tablet|ipad/i', $userAgent)) {
        return 'tablet';
    } else {
        return 'web';
    }
}
?>
