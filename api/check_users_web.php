<?php
/**
 * GEL-STOCK PostgreSQL User Checker (Web Version)
 * Visit: http://localhost:9000/api/check_users_web.php
 */

require_once 'config.php';

header('Content-Type: text/html; charset=utf-8');

?>
<!DOCTYPE html>
<html>
<head>
    <title>GEL-STOCK - Check PostgreSQL Users</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 40px 20px;
        }
        .container {
            max-width: 1000px;
            margin: 0 auto;
            background: white;
            padding: 40px;
            border-radius: 10px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }
        h1 { color: #333; margin-bottom: 30px; }
        .status { 
            padding: 15px; 
            border-radius: 5px; 
            margin-bottom: 30px;
            font-weight: 500;
        }
        .success { 
            background: #d4edda; 
            color: #155724;
            border: 1px solid #c3e6cb;
        }
        .error { 
            background: #f8d7da; 
            color: #721c24;
            border: 1px solid #f5c6cb;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        table th {
            background: #667eea;
            color: white;
            padding: 12px;
            text-align: left;
            font-weight: 600;
        }
        table td {
            padding: 12px;
            border-bottom: 1px solid #ddd;
        }
        table tr:hover {
            background: #f5f5f5;
        }
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin: 30px 0;
        }
        .stat-card {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 5px;
            border-left: 4px solid #667eea;
        }
        .stat-number {
            font-size: 32px;
            font-weight: bold;
            color: #667eea;
        }
        .stat-label {
            color: #666;
            font-size: 14px;
            margin-top: 5px;
        }
        code {
            background: #f5f5f5;
            padding: 2px 6px;
            border-radius: 3px;
            font-family: 'Courier New', monospace;
        }
        .empty-message {
            text-align: center;
            padding: 40px;
            color: #999;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔍 GEL-STOCK PostgreSQL User Checker</h1>
        
        <?php
        try {
            $db = getDbConnection();
            
            if (!$db) {
                echo '<div class="status error">
                    <strong>❌ Database Connection Failed</strong><br>
                    Host: <code>' . DB_HOST . '</code><br>
                    Database: <code>' . DB_NAME . '</code><br>
                    Error: Could not find PostgreSQL driver (pdo_pgsql)
                </div>';
                exit;
            }
            
            echo '<div class="status success">
                <strong>✅ Connected to PostgreSQL</strong><br>
                Host: <code>' . DB_HOST . '</code> | Database: <code>' . DB_NAME . '</code>
            </div>';
            
            // Get users
            $stmt = $db->query("SELECT id, username, email, first_name, last_name, phone, role, status, created_at FROM users ORDER BY created_at DESC");
            $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            echo '<h2>Users (' . count($users) . ' total)</h2>';
            
            if (count($users) > 0) {
                echo '<table>
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Username</th>
                            <th>Email</th>
                            <th>Full Name</th>
                            <th>Phone</th>
                            <th>Role</th>
                            <th>Status</th>
                            <th>Created</th>
                        </tr>
                    </thead>
                    <tbody>';
                
                foreach ($users as $index => $user) {
                    echo '<tr>
                        <td>' . ($index + 1) . '</td>
                        <td><strong>' . htmlspecialchars($user['username']) . '</strong></td>
                        <td>' . htmlspecialchars($user['email'] ?: '—') . '</td>
                        <td>' . htmlspecialchars($user['first_name'] . ' ' . $user['last_name']) . '</td>
                        <td>' . htmlspecialchars($user['phone'] ?: '—') . '</td>
                        <td><span style="background: #e3f2fd; padding: 3px 8px; border-radius: 3px;">' . htmlspecialchars($user['role']) . '</span></td>
                        <td>' . htmlspecialchars($user['status']) . '</td>
                        <td>' . $user['created_at'] . '</td>
                    </tr>';
                }
                
                echo '</tbody></table>';
            } else {
                echo '<div class="empty-message">
                    <strong>ℹ️ No users found</strong><br>
                    Register a new user through the application to get started.
                </div>';
            }
            
            // Database statistics
            echo '<h2>Database Statistics</h2>';
            echo '<div class="stats">';
            
            $tables = ['users', 'products', 'sales', 'customers', 'suppliers'];
            foreach ($tables as $table) {
                try {
                    $result = $db->query("SELECT COUNT(*) as count FROM $table");
                    $row = $result->fetch();
                    $count = $row['count'] ?? 0;
                    echo '<div class="stat-card">
                        <div class="stat-number">' . $count . '</div>
                        <div class="stat-label">' . ucfirst($table) . '</div>
                    </div>';
                } catch (Exception $e) {
                    echo '<div class="stat-card">
                        <div class="stat-number">—</div>
                        <div class="stat-label">' . ucfirst($table) . ' (error)</div>
                    </div>';
                }
            }
            
            echo '</div>';
            
        } catch (Exception $e) {
            echo '<div class="status error">
                <strong>❌ Error:</strong> ' . htmlspecialchars($e->getMessage()) . '
            </div>';
        }
        ?>
    </div>
</body>
</html>
