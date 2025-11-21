<?php
/**
 * Admin Key Management API
 * Allows changing the admin key/password
 * Requires current admin key authentication
 */

require_once 'config.php';

// Get request parameters
$method = getRequestMethod();
$data = getRequestData();
$adminKey = isset($data['adminKey']) ? $data['adminKey'] : $_GET['adminKey'] ?? null;

// Current admin key
$ADMIN_KEY = getenv('GEL_STOCK_ADMIN_KEY') ?: 'admin123';

if (!$adminKey || $adminKey !== $ADMIN_KEY) {
    sendResponse([
        'success' => false,
        'message' => 'Unauthorized - Invalid current admin key'
    ], HTTP_UNAUTHORIZED);
    exit;
}

// Route request
if ($method === 'POST') {
    handleChangeKey($data);
} elseif ($method === 'GET') {
    // Just verify the key works
    sendResponse([
        'success' => true,
        'message' => 'Admin key is valid'
    ]);
} else {
    sendResponse(['success' => false, 'message' => 'Method not allowed'], HTTP_BAD_REQUEST);
}

/**
 * Change the admin key
 */
function handleChangeKey($data) {
    $newKey = isset($data['newKey']) ? trim($data['newKey']) : null;
    
    if (!$newKey) {
        sendResponse([
            'success' => false,
            'message' => 'New admin key is required'
        ], HTTP_BAD_REQUEST);
        return;
    }
    
    if (strlen($newKey) < 6) {
        sendResponse([
            'success' => false,
            'message' => 'New admin key must be at least 6 characters long'
        ], HTTP_BAD_REQUEST);
        return;
    }
    
    // Note: In a real production system, you would:
    // 1. Store the key in a database (hashed with bcrypt)
    // 2. Store it in a config file with restricted permissions
    // 3. Use environment variables
    // 
    // For now, we return instructions on how to change it
    $instructions = "To change the admin key in production:\n\n";
    $instructions .= "Option 1 - Environment Variable (Recommended):\n";
    $instructions .= "Set environment variable: GEL_STOCK_ADMIN_KEY=" . htmlspecialchars($newKey) . "\n\n";
    $instructions .= "Option 2 - Edit config.php:\n";
    $instructions .= "In /api/config.php, change line with \$ADMIN_KEY:\n";
    $instructions .= "\$ADMIN_KEY = '" . htmlspecialchars($newKey) . "';\n\n";
    $instructions .= "After changing, you will need to:\n";
    $instructions .= "1. Clear your browser session/cookies\n";
    $instructions .= "2. Log in again with the new key\n";
    
    sendResponse([
        'success' => true,
        'message' => 'Admin key change instructions provided',
        'new_key' => $newKey,
        'instructions' => $instructions,
        'note' => 'The new key will work immediately if using environment variables, or after restarting the server if using config.php',
        'timestamp' => date('Y-m-d H:i:s')
    ]);
}
