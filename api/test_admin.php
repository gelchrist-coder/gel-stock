<?php
// Test admin_stats.php directly
require_once 'config.php';

// Simulate the request
$_GET['adminKey'] = 'admin123';

// Include the stats file
require_once 'admin_stats.php';
?>
