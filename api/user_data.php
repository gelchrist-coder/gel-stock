<?php
/**
 * User Data Sync API
 * Handles syncing products, sales, and settings across devices
 * Stores user data in database for cross-device access
 */

require_once 'config.php';

// Get request method and data
$method = getRequestMethod();
$data = getRequestData();

// Validate user is authenticated
if (!isset($data['userId']) || empty($data['userId'])) {
    sendResponse([
        'success' => false,
        'message' => 'User ID is required',
        'data' => null
    ], HTTP_BAD_REQUEST);
    exit;
}

$userId = sanitizeInput($data['userId']);

// Route based on request method
switch ($method) {
    case 'GET':
        // Get user's synced data
        handleGetUserData($db, $userId, $data);
        break;
        
    case 'POST':
        // Save user's products, sales, or settings
        handleSaveUserData($db, $userId, $data);
        break;
        
    case 'PUT':
        // Update specific user data (products, sales, settings)
        handleUpdateUserData($db, $userId, $data);
        break;
        
    case 'DELETE':
        // Delete user data
        handleDeleteUserData($db, $userId, $data);
        break;
        
    default:
        sendResponse([
            'success' => false,
            'message' => 'Method not allowed'
        ], HTTP_BAD_REQUEST);
}

/**
 * Get all user data (products, sales, settings)
 */
function handleGetUserData($db, $userId, $data) {
    try {
        $dataType = isset($data['dataType']) ? sanitizeInput($data['dataType']) : 'all';
        
        if ($dataType === 'all' || $dataType === 'products') {
            // Get user's products
            $products = $db->select(
                "SELECT * FROM user_products WHERE user_id = ? ORDER BY created_at DESC",
                [$userId]
            );
        }
        
        if ($dataType === 'all' || $dataType === 'sales') {
            // Get user's sales
            $sales = $db->select(
                "SELECT * FROM user_sales WHERE user_id = ? ORDER BY created_at DESC",
                [$userId]
            );
        }
        
        if ($dataType === 'all' || $dataType === 'settings') {
            // Get user's settings
            $settings = $db->select(
                "SELECT * FROM user_settings WHERE user_id = ? LIMIT 1",
                [$userId]
            );
        }
        
        sendResponse([
            'success' => true,
            'message' => 'User data retrieved successfully',
            'data' => [
                'products' => $products ?? [],
                'sales' => $sales ?? [],
                'settings' => $settings[0] ?? null
            ]
        ], HTTP_OK);
        
    } catch (Exception $e) {
        sendResponse([
            'success' => false,
            'message' => 'Error retrieving user data: ' . $e->getMessage()
        ], HTTP_INTERNAL_ERROR);
    }
}

/**
 * Save user data (products, sales, settings)
 */
function handleSaveUserData($db, $userId, $data) {
    try {
        $dataType = isset($data['dataType']) ? sanitizeInput($data['dataType']) : null;
        
        if ($dataType === 'products') {
            // Save products
            $products = $data['products'] ?? [];
            foreach ($products as $product) {
                $productData = [
                    'user_id' => $userId,
                    'product_id' => $product['id'] ?? generateUUID(),
                    'product_name' => $product['productName'] ?? '',
                    'sku' => $product['sku'] ?? '',
                    'selling_price' => floatval($product['sellingPrice'] ?? 0),
                    'cost_price' => floatval($product['costPrice'] ?? 0),
                    'stock_quantity' => intval($product['stockQuantity'] ?? 0),
                    'category' => $product['category'] ?? 'Uncategorized',
                    'reorder_level' => intval($product['reorderLevel'] ?? 5),
                    'created_at' => $product['createdAt'] ?? date('Y-m-d H:i:s'),
                    'updated_at' => date('Y-m-d H:i:s')
                ];
                
                // Check if product exists
                $existingProduct = $db->select(
                    "SELECT id FROM user_products WHERE user_id = ? AND product_id = ? LIMIT 1",
                    [$userId, $productData['product_id']]
                );
                
                if (empty($existingProduct)) {
                    $db->insert('user_products', $productData);
                } else {
                    $db->update('user_products', $productData, $existingProduct[0]['id']);
                }
            }
            
            sendResponse([
                'success' => true,
                'message' => 'Products saved successfully',
                'data' => ['count' => count($products)]
            ], HTTP_CREATED);
            
        } else if ($dataType === 'sales') {
            // Save sales
            $sales = $data['sales'] ?? [];
            foreach ($sales as $sale) {
                $saleData = [
                    'user_id' => $userId,
                    'sale_id' => $sale['id'] ?? generateUUID(),
                    'items' => json_encode($sale['items'] ?? []),
                    'total_amount' => floatval($sale['totalAmount'] ?? 0),
                    'payment_method' => $sale['paymentMethod'] ?? 'cash',
                    'notes' => $sale['notes'] ?? '',
                    'created_at' => $sale['createdAt'] ?? date('Y-m-d H:i:s'),
                    'updated_at' => date('Y-m-d H:i:s')
                ];
                
                // Check if sale exists
                $existingSale = $db->select(
                    "SELECT id FROM user_sales WHERE user_id = ? AND sale_id = ? LIMIT 1",
                    [$userId, $saleData['sale_id']]
                );
                
                if (empty($existingSale)) {
                    $db->insert('user_sales', $saleData);
                } else {
                    $db->update('user_sales', $saleData, $existingSale[0]['id']);
                }
            }
            
            sendResponse([
                'success' => true,
                'message' => 'Sales saved successfully',
                'data' => ['count' => count($sales)]
            ], HTTP_CREATED);
            
        } else if ($dataType === 'settings') {
            // Save settings
            $settingsData = [
                'user_id' => $userId,
                'business_name' => $data['businessName'] ?? '',
                'theme' => $data['theme'] ?? 'light',
                'currency' => $data['currency'] ?? 'GHS',
                'low_stock_level' => intval($data['lowStockLevel'] ?? 5),
                'settings_json' => json_encode($data['settings'] ?? []),
                'updated_at' => date('Y-m-d H:i:s')
            ];
            
            // Check if settings exist
            $existingSettings = $db->select(
                "SELECT id FROM user_settings WHERE user_id = ? LIMIT 1",
                [$userId]
            );
            
            if (empty($existingSettings)) {
                $settingsData['created_at'] = date('Y-m-d H:i:s');
                $db->insert('user_settings', $settingsData);
            } else {
                $db->update('user_settings', $settingsData, $existingSettings[0]['id']);
            }
            
            sendResponse([
                'success' => true,
                'message' => 'Settings saved successfully'
            ], HTTP_CREATED);
        }
        
    } catch (Exception $e) {
        sendResponse([
            'success' => false,
            'message' => 'Error saving user data: ' . $e->getMessage()
        ], HTTP_INTERNAL_ERROR);
    }
}

/**
 * Update user data
 */
function handleUpdateUserData($db, $userId, $data) {
    // Same as POST for this endpoint
    handleSaveUserData($db, $userId, $data);
}

/**
 * Delete user data
 */
function handleDeleteUserData($db, $userId, $data) {
    try {
        $dataType = isset($data['dataType']) ? sanitizeInput($data['dataType']) : null;
        $id = isset($data['id']) ? sanitizeInput($data['id']) : null;
        
        if (!$id) {
            sendResponse([
                'success' => false,
                'message' => 'ID is required for deletion'
            ], HTTP_BAD_REQUEST);
            return;
        }
        
        if ($dataType === 'products') {
            $db->delete('user_products', $id);
            sendResponse([
                'success' => true,
                'message' => 'Product deleted successfully'
            ]);
        } else if ($dataType === 'sales') {
            $db->delete('user_sales', $id);
            sendResponse([
                'success' => true,
                'message' => 'Sale deleted successfully'
            ]);
        }
        
    } catch (Exception $e) {
        sendResponse([
            'success' => false,
            'message' => 'Error deleting user data: ' . $e->getMessage()
        ], HTTP_INTERNAL_ERROR);
    }
}

/**
 * Generate UUID
 */
function generateUUID() {
    return sprintf(
        '%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
        mt_rand(0, 0xffff), mt_rand(0, 0xffff),
        mt_rand(0, 0xffff),
        mt_rand(0, 0x0fff) | 0x4000,
        mt_rand(0, 0x3fff) | 0x8000,
        mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
    );
}
?>
