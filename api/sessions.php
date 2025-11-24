<?php
/**
 * Session Management API
 * Handles cross-device login persistence and session tokens
 */

require_once 'config.php';
require_once 'Database.php';

$method = getRequestMethod();
$data = getRequestData();

switch ($method) {
    case 'POST':
        handleSessionCreate($data);
        break;
    case 'GET':
        handleSessionVerify($data);
        break;
    case 'DELETE':
        handleSessionLogout($data);
        break;
    case 'PUT':
        handleSessionRefresh($data);
        break;
    default:
        sendResponse(['success' => false, 'message' => 'Method not allowed'], 405);
}

/**
 * Create a new session token for successful login
 */
function handleSessionCreate($data) {
    $db = new Database();
    
    if (!isset($data['user_id'])) {
        sendResponse(['success' => false, 'message' => 'User ID required'], 400);
        return;
    }
    
    $userId = $data['user_id'];
    $deviceName = $data['device_name'] ?? 'Unknown Device';
    $deviceType = $data['device_type'] ?? 'web'; // web, mobile, tablet
    $ipAddress = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? 'unknown';
    
    // Generate unique session token
    $sessionToken = bin2hex(random_bytes(32));
    $expiresAt = date('Y-m-d H:i:s', strtotime('+30 days'));
    
    try {
        $result = $db->insert('user_sessions', [
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
            'message' => 'Session created successfully',
            'data' => [
                'session_token' => $sessionToken,
                'expires_at' => $expiresAt,
                'device_name' => $deviceName
            ]
        ], 201);
    } catch (Exception $e) {
        sendResponse(['success' => false, 'message' => 'Failed to create session: ' . $e->getMessage()], 500);
    }
}

/**
 * Verify if a session token is valid
 */
function handleSessionVerify($data) {
    $db = new Database();
    
    $sessionToken = $_GET['token'] ?? '';
    
    if (!$sessionToken) {
        sendResponse(['success' => false, 'message' => 'Session token required'], 400);
        return;
    }
    
    try {
        $result = $db->select(
            "SELECT us.*, u.id, u.username, u.email, u.first_name, u.last_name, u.phone, u.role 
             FROM user_sessions us 
             JOIN users u ON us.user_id = u.id 
             WHERE us.session_token = ? AND us.expires_at > NOW()",
            [$sessionToken]
        );
        
        if ($result && count($result) > 0) {
            $session = $result[0];
            
            // Update last activity
            $db->update('user_sessions', [
                'last_activity' => date('Y-m-d H:i:s')
            ], $session['id']);
            
            sendResponse([
                'success' => true,
                'message' => 'Session valid',
                'data' => [
                    'user' => [
                        'id' => $session['id'],
                        'username' => $session['username'],
                        'email' => $session['email'],
                        'first_name' => $session['first_name'],
                        'last_name' => $session['last_name'],
                        'phone' => $session['phone'],
                        'role' => $session['role']
                    ],
                    'device' => [
                        'name' => $session['device_name'],
                        'type' => $session['device_type'],
                        'ip' => $session['ip_address']
                    ],
                    'expires_at' => $session['expires_at']
                ]
            ]);
        } else {
            sendResponse(['success' => false, 'message' => 'Invalid or expired session'], 401);
        }
    } catch (Exception $e) {
        sendResponse(['success' => false, 'message' => 'Session verification failed: ' . $e->getMessage()], 500);
    }
}

/**
 * Refresh (extend) an active session
 */
function handleSessionRefresh($data) {
    $db = new Database();
    
    if (!isset($data['session_token'])) {
        sendResponse(['success' => false, 'message' => 'Session token required'], 400);
        return;
    }
    
    $sessionToken = $data['session_token'];
    
    try {
        $result = $db->select(
            "SELECT id FROM user_sessions WHERE session_token = ? AND expires_at > NOW()",
            [$sessionToken]
        );
        
        if ($result && count($result) > 0) {
            $newExpiresAt = date('Y-m-d H:i:s', strtotime('+30 days'));
            
            $db->update('user_sessions', [
                'expires_at' => $newExpiresAt,
                'last_activity' => date('Y-m-d H:i:s')
            ], $result[0]['id']);
            
            sendResponse([
                'success' => true,
                'message' => 'Session refreshed',
                'data' => [
                    'expires_at' => $newExpiresAt
                ]
            ]);
        } else {
            sendResponse(['success' => false, 'message' => 'Session expired or invalid'], 401);
        }
    } catch (Exception $e) {
        sendResponse(['success' => false, 'message' => 'Session refresh failed: ' . $e->getMessage()], 500);
    }
}

/**
 * Logout - invalidate session token
 */
function handleSessionLogout($data) {
    $db = new Database();
    
    if (!isset($data['session_token'])) {
        sendResponse(['success' => false, 'message' => 'Session token required'], 400);
        return;
    }
    
    $sessionToken = $data['session_token'];
    
    try {
        $result = $db->select("SELECT id FROM user_sessions WHERE session_token = ?", [$sessionToken]);
        
        if ($result && count($result) > 0) {
            $db->delete('user_sessions', $result[0]['id']);
            
            sendResponse([
                'success' => true,
                'message' => 'Logged out successfully'
            ]);
        } else {
            sendResponse(['success' => false, 'message' => 'Session not found'], 404);
        }
    } catch (Exception $e) {
        sendResponse(['success' => false, 'message' => 'Logout failed: ' . $e->getMessage()], 500);
    }
}

/**
 * Get all active sessions for a user (to show devices)
 */
function getAllUserSessions($userId) {
    $db = new Database();
    
    try {
        $result = $db->select(
            "SELECT id, device_name, device_type, ip_address, last_activity, created_at, expires_at 
             FROM user_sessions 
             WHERE user_id = ? AND expires_at > NOW() 
             ORDER BY last_activity DESC",
            [$userId]
        );
        
        return $result ?: [];
    } catch (Exception $e) {
        return [];
    }
}
?>
