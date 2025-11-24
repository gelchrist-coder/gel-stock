<?php
/**
 * Device Management API
 * Get user's active sessions/devices and manage them
 */

require_once 'config.php';
require_once 'Database.php';

$method = getRequestMethod();
$data = getRequestData();

switch ($method) {
    case 'GET':
        handleGetDevices($data);
        break;
    case 'DELETE':
        handleRemoveDevice($data);
        break;
    default:
        sendResponse(['success' => false, 'message' => 'Method not allowed'], 405);
}

/**
 * Get all active devices for logged-in user
 */
function handleGetDevices($data) {
    $db = new Database();
    $token = $_GET['token'] ?? null;
    
    if (!$token) {
        sendResponse(['success' => false, 'message' => 'Token required'], 400);
        return;
    }
    
    try {
        // Get user from token
        $result = $db->select(
            "SELECT user_id FROM user_sessions WHERE session_token = ? AND expires_at > NOW() LIMIT 1",
            [$token]
        );
        
        if (!$result || count($result) === 0) {
            sendResponse(['success' => false, 'message' => 'Invalid token'], 401);
            return;
        }
        
        $userId = $result[0]['user_id'];
        
        // Get all active sessions for this user
        $sessions = $db->select(
            "SELECT id, device_name, device_type, ip_address, last_activity, created_at 
             FROM user_sessions 
             WHERE user_id = ? AND expires_at > NOW() 
             ORDER BY last_activity DESC",
            [$userId]
        );
        
        sendResponse([
            'success' => true,
            'message' => 'Devices retrieved successfully',
            'data' => [
                'devices' => $sessions ?: [],
                'total' => count($sessions ?: [])
            ]
        ]);
        
    } catch (Exception $e) {
        sendResponse(['success' => false, 'message' => 'Failed to get devices: ' . $e->getMessage()], 500);
    }
}

/**
 * Remove a device/session
 */
function handleRemoveDevice($data) {
    $db = new Database();
    $token = $data['token'] ?? null;
    $deviceId = $data['device_id'] ?? null;
    
    if (!$token || !$deviceId) {
        sendResponse(['success' => false, 'message' => 'Token and device ID required'], 400);
        return;
    }
    
    try {
        // Verify token belongs to user
        $result = $db->select(
            "SELECT user_id FROM user_sessions WHERE session_token = ? AND expires_at > NOW() LIMIT 1",
            [$token]
        );
        
        if (!$result) {
            sendResponse(['success' => false, 'message' => 'Invalid token'], 401);
            return;
        }
        
        $userId = $result[0]['user_id'];
        
        // Verify device belongs to user
        $device = $db->select(
            "SELECT id FROM user_sessions WHERE id = ? AND user_id = ?",
            [$deviceId, $userId]
        );
        
        if (!$device) {
            sendResponse(['success' => false, 'message' => 'Device not found'], 404);
            return;
        }
        
        // Delete the session
        $db->delete('user_sessions', $deviceId);
        
        sendResponse([
            'success' => true,
            'message' => 'Device removed successfully'
        ]);
        
    } catch (Exception $e) {
        sendResponse(['success' => false, 'message' => 'Failed to remove device: ' . $e->getMessage()], 500);
    }
}
?>
