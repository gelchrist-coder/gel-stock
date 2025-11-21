<?php
/**
 * Admin Statistics API - Comprehensive Analytics Dashboard
 * Provides business metrics, user analytics, and system health data
 * Requires admin key authentication
 */

require_once 'config.php';

// Get request parameters
$method = getRequestMethod();
$data = getRequestData();
$adminKey = isset($data['adminKey']) ? $data['adminKey'] : $_GET['adminKey'] ?? null;

// Admin key - change this in production or use environment variable
$ADMIN_KEY = getenv('GEL_STOCK_ADMIN_KEY') ?: 'admin123'; // Change to secure key

if (!$adminKey || $adminKey !== $ADMIN_KEY) {
    sendResponse([
        'success' => false,
        'message' => 'Unauthorized - Invalid admin key'
    ], HTTP_UNAUTHORIZED);
    exit;
}

// Route request
if ($method === 'GET') {
    handleGetStats();
} else {
    sendResponse(['success' => false, 'message' => 'Method not allowed'], HTTP_BAD_REQUEST);
}

/**
 * Get all statistics
 */
function handleGetStats() {
    global $db;
    
    try {
        $stats = [
            'users' => getUserStats(),
            'products' => getProductStats(),
            'sales' => getSalesStats(),
            'revenue' => getRevenueStats(),
            'activity' => getActivityStats()
        ];
        
        sendResponse([
            'success' => true,
            'message' => 'Statistics retrieved successfully',
            'data' => $stats,
            'timestamp' => date('Y-m-d H:i:s')
        ]);
    } catch (Exception $e) {
        sendResponse([
            'success' => false,
            'message' => 'Error: ' . $e->getMessage()
        ], HTTP_INTERNAL_ERROR);
    }
}

/**
 * Get user registration statistics
 */
function getUserStats() {
    try {
        // Check if users table exists
        $pdo = getDbConnection();
        if (!$pdo) {
            return [
                'total_users' => 0,
                'registered_today' => 0,
                'recent_registrations' => []
            ];
        }
        
        // Try to query users table
        try {
            $stmt = $pdo->query("SELECT COUNT(*) as count FROM users");
            $totalResult = $stmt->fetch();
            $totalUsers = $totalResult['count'] ?? 0;
            
            $stmt = $pdo->query("SELECT COUNT(*) as count FROM users WHERE DATE(created_at) = DATE(NOW())");
            $todayResult = $stmt->fetch();
            $registeredToday = $todayResult['count'] ?? 0;
            
            $stmt = $pdo->query("SELECT id, name, phone, email, business_name, created_at, last_login FROM users ORDER BY created_at DESC LIMIT 100");
            $recentRegistrations = $stmt->fetchAll() ?? [];
        } catch (PDOException $e) {
            // Users table doesn't exist, return demo data
            return [
                'total_users' => 0,
                'registered_today' => 0,
                'recent_registrations' => []
            ];
        }
        
        return [
            'total_users' => intval($totalUsers),
            'registered_today' => intval($registeredToday),
            'recent_registrations' => $recentRegistrations
        ];
    } catch (Exception $e) {
        return ['error' => $e->getMessage()];
    }
}

/**
 * Get product inventory statistics
 */
function getProductStats() {
    try {
        $pdo = getDbConnection();
        if (!$pdo) {
            return [
                'total_products' => 0,
                'total_inventory_value' => 0,
                'products_by_category' => [],
                'top_products' => []
            ];
        }
        
        try {
            // Check if user_products table exists
            $stmt = $pdo->query("SELECT COUNT(*) as count FROM user_products LIMIT 1");
            $hasProducts = $stmt->fetch();
            
            if (!$hasProducts) {
                // Try old products table
                $stmt = $pdo->query("SELECT COUNT(*) as count FROM products");
                $totalResult = $stmt->fetch();
                $totalProducts = $totalResult['count'] ?? 0;
                
                $stmt = $pdo->query("SELECT SUM(selling_price * stock_quantity) as total_value FROM products");
                $inventoryResult = $stmt->fetch();
                $totalInventoryValue = floatval($inventoryResult['total_value'] ?? 0);
                
                return [
                    'total_products' => intval($totalProducts),
                    'total_inventory_value' => round($totalInventoryValue, 2),
                    'products_by_category' => [],
                    'top_products' => []
                ];
            }
            
            $stmt = $pdo->query("SELECT COUNT(*) as count FROM user_products");
            $totalResult = $stmt->fetch();
            $totalProducts = $totalResult['count'] ?? 0;
            
            $stmt = $pdo->query("SELECT SUM(JSON_EXTRACT(product_data, '$.sellingPrice') * JSON_EXTRACT(product_data, '$.stockQuantity')) as total_value FROM user_products");
            $inventoryResult = $stmt->fetch();
            $totalInventoryValue = floatval($inventoryResult['total_value'] ?? 0);
            
            return [
                'total_products' => intval($totalProducts),
                'total_inventory_value' => round($totalInventoryValue, 2),
                'products_by_category' => [],
                'top_products' => []
            ];
        } catch (PDOException $e) {
            return [
                'total_products' => 0,
                'total_inventory_value' => 0,
                'products_by_category' => [],
                'top_products' => []
            ];
        }
    } catch (Exception $e) {
        return ['error' => $e->getMessage()];
    }
}

/**
 * Get sales statistics
 */
function getSalesStats() {
    try {
        $pdo = getDbConnection();
        if (!$pdo) {
            return [
                'total_sales' => 0,
                'average_order_value' => 0,
                'sales_by_payment_method' => []
            ];
        }
        
        try {
            // Check if user_sales table exists
            $stmt = $pdo->query("SELECT COUNT(*) as count FROM user_sales LIMIT 1");
            $hasSales = $stmt->fetch();
            
            if (!$hasSales) {
                // Try old sales table
                try {
                    $stmt = $pdo->query("SELECT COUNT(*) as count FROM sales");
                    $totalResult = $stmt->fetch();
                    $totalSales = intval($totalResult['count'] ?? 0);
                    
                    $stmt = $pdo->query("SELECT AVG(total_amount) as avg_value FROM sales");
                    $avgResult = $stmt->fetch();
                    $avgOrderValue = floatval($avgResult['avg_value'] ?? 0);
                    
                    return [
                        'total_sales' => $totalSales,
                        'average_order_value' => round($avgOrderValue, 2),
                        'sales_by_payment_method' => []
                    ];
                } catch (PDOException $e) {
                    return [
                        'total_sales' => 0,
                        'average_order_value' => 0,
                        'sales_by_payment_method' => []
                    ];
                }
            }
            
            $stmt = $pdo->query("SELECT COUNT(*) as count FROM user_sales");
            $totalResult = $stmt->fetch();
            $totalSales = intval($totalResult['count'] ?? 0);
            
            $stmt = $pdo->query("SELECT AVG(JSON_EXTRACT(sale_data, '$.totalAmount')) as avg_value FROM user_sales");
            $avgResult = $stmt->fetch();
            $avgOrderValue = floatval($avgResult['avg_value'] ?? 0);
            
            return [
                'total_sales' => $totalSales,
                'average_order_value' => round($avgOrderValue, 2),
                'sales_by_payment_method' => []
            ];
        } catch (PDOException $e) {
            return [
                'total_sales' => 0,
                'average_order_value' => 0,
                'sales_by_payment_method' => []
            ];
        }
    } catch (Exception $e) {
        return ['error' => $e->getMessage()];
    }
}

/**
 * Get revenue statistics
 */
function getRevenueStats() {
    try {
        $pdo = getDbConnection();
        if (!$pdo) {
            return [
                'total_revenue' => 0,
                'revenue_today' => 0,
                'revenue_this_month' => 0,
                'revenue_this_year' => 0
            ];
        }
        
        try {
            // Check if user_sales table exists
            $stmt = $pdo->query("SELECT COUNT(*) as count FROM user_sales LIMIT 1");
            $hasSales = $stmt->fetch();
            
            if (!$hasSales) {
                // Try old sales table
                try {
                    $stmt = $pdo->query("SELECT SUM(total_amount) as total FROM sales");
                    $totalResult = $stmt->fetch();
                    $totalRevenue = floatval($totalResult['total'] ?? 0);
                    
                    $stmt = $pdo->query("SELECT SUM(total_amount) as total FROM sales WHERE DATE(created_at) = DATE(NOW())");
                    $todayResult = $stmt->fetch();
                    $revenueToday = floatval($todayResult['total'] ?? 0);
                    
                    return [
                        'total_revenue' => round($totalRevenue, 2),
                        'revenue_today' => round($revenueToday, 2),
                        'revenue_this_month' => 0,
                        'revenue_this_year' => 0
                    ];
                } catch (PDOException $e) {
                    return [
                        'total_revenue' => 0,
                        'revenue_today' => 0,
                        'revenue_this_month' => 0,
                        'revenue_this_year' => 0
                    ];
                }
            }
            
            $stmt = $pdo->query("SELECT SUM(JSON_EXTRACT(sale_data, '$.totalAmount')) as total FROM user_sales");
            $totalResult = $stmt->fetch();
            $totalRevenue = floatval($totalResult['total'] ?? 0);
            
            $stmt = $pdo->query("SELECT SUM(JSON_EXTRACT(sale_data, '$.totalAmount')) as total FROM user_sales WHERE DATE(created_at) = DATE(NOW())");
            $todayResult = $stmt->fetch();
            $revenueToday = floatval($todayResult['total'] ?? 0);
            
            return [
                'total_revenue' => round($totalRevenue, 2),
                'revenue_today' => round($revenueToday, 2),
                'revenue_this_month' => 0,
                'revenue_this_year' => 0
            ];
        } catch (PDOException $e) {
            return [
                'total_revenue' => 0,
                'revenue_today' => 0,
                'revenue_this_month' => 0,
                'revenue_this_year' => 0
            ];
        }
    } catch (Exception $e) {
        return ['error' => $e->getMessage()];
    }
}

/**
 * Get system activity statistics
 */
function getActivityStats() {
    try {
        $pdo = getDbConnection();
        if (!$pdo) {
            return [
                'users_active_last_24h' => 0,
                'product_adders_24h' => 0,
                'sellers_24h' => 0,
                'new_users_last_week' => 0,
                'new_users_last_month' => 0,
                'database_size_mb' => 0
            ];
        }
        
        try {
            // Try to get data from user_sales table
            $stmt = $pdo->query("SELECT COUNT(DISTINCT user_phone) as count FROM user_sales WHERE created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)");
            $activeResult = $stmt->fetch();
            $usersActiveLast24h = intval($activeResult['count'] ?? 0);
        } catch (PDOException $e) {
            $usersActiveLast24h = 0;
        }
        
        try {
            // Try to get data from users table
            $stmt = $pdo->query("SELECT COUNT(*) as count FROM users WHERE created_at > DATE_SUB(NOW(), INTERVAL 7 DAY)");
            $weekResult = $stmt->fetch();
            $newUsersLastWeek = intval($weekResult['count'] ?? 0);
            
            $stmt = $pdo->query("SELECT COUNT(*) as count FROM users WHERE created_at > DATE_SUB(NOW(), INTERVAL 30 DAY)");
            $monthResult = $stmt->fetch();
            $newUsersLastMonth = intval($monthResult['count'] ?? 0);
        } catch (PDOException $e) {
            $newUsersLastWeek = 0;
            $newUsersLastMonth = 0;
        }
        
        try {
            // Get database size
            $dbName = DB_NAME;
            $stmt = $pdo->query("SELECT ROUND(SUM(DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024, 2) as size_mb FROM information_schema.TABLES WHERE TABLE_SCHEMA = '$dbName'");
            $sizeResult = $stmt->fetch();
            $dbSizeMb = floatval($sizeResult['size_mb'] ?? 0);
        } catch (PDOException $e) {
            $dbSizeMb = 0;
        }
        
        return [
            'users_active_last_24h' => $usersActiveLast24h,
            'product_adders_24h' => 0,
            'sellers_24h' => 0,
            'new_users_last_week' => $newUsersLastWeek,
            'new_users_last_month' => $newUsersLastMonth,
            'database_size_mb' => $dbSizeMb
        ];
    } catch (Exception $e) {
        return ['error' => $e->getMessage()];
    }
}
