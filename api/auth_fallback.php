<?php
/**
 * Fallback Authentication API (Offline Mode)
 * Works when PostgreSQL is unavailable
 * Stores users in JSON files for cross-device sync
 */

require_once 'config.php';

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
    $action = $data['action'] ?? null;
    
    if ($action === 'login') {
        handleFallbackLogin($data);
    } elseif ($action === 'register') {
        handleFallbackRegister($data);
    } else {
        sendResponse(['success' => false, 'message' => 'Invalid action'], 400);
    }
}

/**
 * Fallback login - check users.json file
 */
function handleFallbackLogin($data) {
    $phone = $data['phone'] ?? null;
    $password = $data['password'] ?? null;
    
    if (!$phone || !$password) {
        sendResponse(['success' => false, 'message' => 'Phone and password required'], 400);
        return;
    }
    
    $phone = normalizePhoneNumber($phone);
    
    try {
        // Try PostgreSQL first
        $db = getDbConnection();
        if ($db) {
            $users = $db->select(
                "SELECT id, username, email, first_name, last_name, phone, password_hash, role, status, business_name 
                 FROM users WHERE phone = ? AND status = 'active' LIMIT 1",
                [$phone]
            );
            
            if ($users && count($users) > 0) {
                $user = $users[0];
                
                if (password_verify($password, $user['password_hash'])) {
                    // Success - create session
                    createSessionToken($user, $data);
                    return;
                }
            }
        }
        
        // PostgreSQL not available or user not found - try offline file
        handleOfflineLogin($phone, $password, $data);
        
    } catch (Exception $e) {
        // Database error - use offline mode
        handleOfflineLogin($phone, $password, $data);
    }
}

/**
 * Login from offline user storage
 */
function handleOfflineLogin($phone, $password, $data) {
    $usersFile = __DIR__ . '/../data/users_offline.json';
    
    if (!file_exists($usersFile)) {
        sendResponse(['success' => false, 'message' => 'Invalid phone or password'], 401);
        return;
    }
    
    $usersJson = file_get_contents($usersFile);
    $users = json_decode($usersJson, true) ?: [];
    
    // Find user by phone
    $foundUser = null;
    foreach ($users as $user) {
        if ($user['phone'] === $phone && $user['status'] === 'active') {
            $foundUser = $user;
            break;
        }
    }
    
    if (!$foundUser) {
        sendResponse(['success' => false, 'message' => 'Invalid phone or password'], 401);
        return;
    }
    
    // Verify password
    if (!isset($foundUser['password_hash']) || !password_verify($password, $foundUser['password_hash'])) {
        sendResponse(['success' => false, 'message' => 'Invalid phone or password'], 401);
        return;
    }
    
    // Create session
    $sessionToken = bin2hex(random_bytes(32));
    $expiresAt = date('Y-m-d H:i:s', strtotime('+30 days'));
    
    // Save session
    $sessionsFile = __DIR__ . '/../data/sessions_offline.json';
    $sessions = file_exists($sessionsFile) ? json_decode(file_get_contents($sessionsFile), true) : [];
    
    $sessions[] = [
        'token' => $sessionToken,
        'user_id' => $foundUser['id'],
        'phone' => $phone,
        'device_name' => $data['device_name'] ?? 'Device',
        'device_type' => $data['device_type'] ?? 'web',
        'expires_at' => $expiresAt,
        'created_at' => date('Y-m-d H:i:s')
    ];
    
    @file_put_contents($sessionsFile, json_encode($sessions, JSON_PRETTY_PRINT));
    
    sendResponse([
        'success' => true,
        'message' => 'Login successful (offline mode)',
        'data' => [
            'session_token' => $sessionToken,
            'expires_at' => $expiresAt,
            'user' => [
                'id' => $foundUser['id'],
                'username' => $foundUser['username'],
                'email' => $foundUser['email'] ?? '',
                'first_name' => $foundUser['first_name'] ?? '',
                'last_name' => $foundUser['last_name'] ?? '',
                'phone' => $foundUser['phone'],
                'role' => $foundUser['role'] ?? 'user',
                'business_name' => $foundUser['business_name'] ?? ''
            ]
        ]
    ], 200);
}

/**
 * Fallback register - save to users.json
 */
function handleFallbackRegister($data) {
    $phone = $data['phone'] ?? null;
    $password = $data['password'] ?? null;
    $firstName = $data['first_name'] ?? null;
    $lastName = $data['last_name'] ?? null;
    $businessName = $data['business_name'] ?? null;
    $email = $data['email'] ?? null;
    
    if (!$phone || !$password || !$firstName || !$businessName) {
        sendResponse(['success' => false, 'message' => 'Required fields missing'], 400);
        return;
    }
    
    $phone = normalizePhoneNumber($phone);
    
    try {
        // Try PostgreSQL first
        $db = getDbConnection();
        if ($db) {
            $existing = $db->select("SELECT id FROM users WHERE phone = ?", [$phone]);
            
            if ($existing && count($existing) > 0) {
                sendResponse(['success' => false, 'message' => 'Phone number already registered'], 409);
                return;
            }
            
            // Create in PostgreSQL
            $passwordHash = password_hash($password, PASSWORD_BCRYPT);
            $userId = $db->insert('users', [
                'username' => 'user_' . str_replace('+233', '233', $phone),
                'email' => $email,
                'first_name' => $firstName,
                'last_name' => $lastName ?? '',
                'phone' => $phone,
                'password_hash' => $passwordHash,
                'role' => 'owner',
                'business_name' => $businessName,
                'status' => 'active',
                'created_at' => date('Y-m-d H:i:s')
            ]);
            
            // Create session
            $sessionToken = bin2hex(random_bytes(32));
            $expiresAt = date('Y-m-d H:i:s', strtotime('+30 days'));
            
            $db->insert('user_sessions', [
                'user_id' => $userId,
                'session_token' => $sessionToken,
                'device_name' => $data['device_name'] ?? 'Registration Device',
                'device_type' => $data['device_type'] ?? 'web',
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
                        'username' => 'user_' . str_replace('+233', '233', $phone),
                        'email' => $email,
                        'first_name' => $firstName,
                        'last_name' => $lastName ?? '',
                        'phone' => $phone,
                        'role' => 'owner',
                        'business_name' => $businessName
                    ]
                ]
            ], 201);
            return;
        }
    } catch (Exception $e) {
        // Fallback to offline
    }
    
    // Offline registration
    handleOfflineRegister($phone, $password, $firstName, $lastName, $email, $businessName, $data);
}

/**
 * Register user in offline storage
 */
function handleOfflineRegister($phone, $password, $firstName, $lastName, $email, $businessName, $data) {
    $usersFile = __DIR__ . '/../data/users_offline.json';
    
    // Read existing users
    $users = [];
    if (file_exists($usersFile)) {
        $usersJson = file_get_contents($usersFile);
        $users = json_decode($usersJson, true) ?: [];
    }
    
    // Check if user already exists
    foreach ($users as $user) {
        if ($user['phone'] === $phone) {
            sendResponse(['success' => false, 'message' => 'Phone number already registered'], 409);
            return;
        }
    }
    
    // Create new user
    $userId = 'user_' . uniqid();
    $passwordHash = password_hash($password, PASSWORD_BCRYPT);
    
    $newUser = [
        'id' => $userId,
        'username' => 'user_' . str_replace('+233', '233', $phone),
        'email' => $email,
        'first_name' => $firstName,
        'last_name' => $lastName ?? '',
        'phone' => $phone,
        'password_hash' => $passwordHash,
        'role' => 'owner',
        'business_name' => $businessName,
        'status' => 'active',
        'created_at' => date('Y-m-d H:i:s')
    ];
    
    $users[] = $newUser;
    
    // Save users file
    @mkdir(dirname($usersFile), 0755, true);
    @file_put_contents($usersFile, json_encode($users, JSON_PRETTY_PRINT));
    
    // Create session
    $sessionToken = bin2hex(random_bytes(32));
    $expiresAt = date('Y-m-d H:i:s', strtotime('+30 days'));
    
    // Save session
    $sessionsFile = __DIR__ . '/../data/sessions_offline.json';
    $sessions = file_exists($sessionsFile) ? json_decode(file_get_contents($sessionsFile), true) : [];
    
    $sessions[] = [
        'token' => $sessionToken,
        'user_id' => $userId,
        'phone' => $phone,
        'device_name' => $data['device_name'] ?? 'Device',
        'device_type' => $data['device_type'] ?? 'web',
        'expires_at' => $expiresAt,
        'created_at' => date('Y-m-d H:i:s')
    ];
    
    @file_put_contents($sessionsFile, json_encode($sessions, JSON_PRETTY_PRINT));
    
    sendResponse([
        'success' => true,
        'message' => 'Registration successful (offline mode)',
        'data' => [
            'session_token' => $sessionToken,
            'expires_at' => $expiresAt,
            'user' => $newUser
        ]
    ], 201);
}

/**
 * Create session token
 */
function createSessionToken($user, $data) {
    $sessionToken = bin2hex(random_bytes(32));
    $expiresAt = date('Y-m-d H:i:s', strtotime('+30 days'));
    
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
 * Verify session token
 */
function handleTokenVerify($data) {
    $token = $_GET['token'] ?? null;
    
    if (!$token) {
        sendResponse(['success' => false, 'message' => 'Token required'], 400);
        return;
    }
    
    try {
        // Try PostgreSQL first
        $db = getDbConnection();
        if ($db) {
            $result = $db->select(
                "SELECT us.*, u.id as user_id, u.username, u.email, u.first_name, u.last_name, u.phone, u.role, u.business_name 
                 FROM user_sessions us 
                 JOIN users u ON us.user_id = u.id 
                 WHERE us.session_token = ? AND us.expires_at > NOW() LIMIT 1",
                [$token]
            );
            
            if ($result && count($result) > 0) {
                $session = $result[0];
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
                        ]
                    ]
                ]);
                return;
            }
        }
    } catch (Exception $e) {
        // Continue to offline
    }
    
    // Try offline sessions
    $sessionsFile = __DIR__ . '/../data/sessions_offline.json';
    $usersFile = __DIR__ . '/../data/users_offline.json';
    
    if (file_exists($sessionsFile) && file_exists($usersFile)) {
        $sessions = json_decode(file_get_contents($sessionsFile), true) ?: [];
        $users = json_decode(file_get_contents($usersFile), true) ?: [];
        
        foreach ($sessions as $session) {
            if ($session['token'] === $token && strtotime($session['expires_at']) > time()) {
                // Find user
                foreach ($users as $user) {
                    if ($user['id'] === $session['user_id']) {
                        sendResponse([
                            'success' => true,
                            'message' => 'Token valid (offline)',
                            'data' => [
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
                        ]);
                        return;
                    }
                }
            }
        }
    }
    
    sendResponse(['success' => false, 'message' => 'Invalid or expired token'], 401);
}

?>
