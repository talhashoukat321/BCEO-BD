<?php
require_once '../../config/database.php';
require_once '../../includes/session.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit();
}

requireLogin();

$database = new Database();
$db = $database->getConnection();
$user = getCurrentUser();

if ($user['role'] === 'admin') {
    // Admin sees all orders with user information
    $query = "SELECT bo.*, u.username, u.name 
              FROM betting_orders bo 
              JOIN users u ON bo.user_id = u.id 
              ORDER BY bo.created_at DESC";
    $stmt = $db->prepare($query);
} else {
    // Customers see only their orders
    $query = "SELECT * FROM betting_orders WHERE user_id = :user_id ORDER BY created_at DESC";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':user_id', $user['id']);
}

$stmt->execute();
$orders = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Format orders for frontend
foreach ($orders as &$order) {
    // Calculate profit based on direction and scale
    if ($order['status'] === 'completed') {
        $profitRate = 0;
        switch ($order['duration']) {
            case 30: $profitRate = 0.20; break;
            case 60: $profitRate = 0.30; break;
            case 120: $profitRate = 0.40; break;
            case 180: $profitRate = 0.50; break;
            case 240: $profitRate = 0.60; break;
        }
        
        $baseProfit = floatval($order['amount']) * $profitRate;
        
        // Apply direction-based calculation for display
        if ($user['role'] === 'customer') {
            // Customers always see positive profit
            $order['profit'] = abs($baseProfit);
        } else {
            // Admin sees actual profit based on direction
            $order['profit'] = $order['direction'] === 'Buy Down' ? -$baseProfit : $baseProfit;
        }
    } else {
        // For active orders, show expected profit
        $profitRate = 0;
        switch ($order['duration']) {
            case 30: $profitRate = 0.20; break;
            case 60: $profitRate = 0.30; break;
            case 120: $profitRate = 0.40; break;
            case 180: $profitRate = 0.50; break;
            case 240: $profitRate = 0.60; break;
        }
        $order['profit'] = floatval($order['amount']) * $profitRate;
    }
    
    // For display purposes, show user's backend direction if not "Actual"
    if (isset($order['actual_direction'])) {
        $userQuery = "SELECT direction FROM users WHERE id = :user_id";
        $userStmt = $db->prepare($userQuery);
        $userStmt->bindParam(':user_id', $order['user_id']);
        $userStmt->execute();
        $userData = $userStmt->fetch(PDO::FETCH_ASSOC);
        
        if ($userData && $userData['direction'] !== 'Actual') {
            $order['display_direction'] = $userData['direction'];
        } else {
            $order['display_direction'] = $order['actual_direction'];
        }
    } else {
        $order['display_direction'] = $order['direction'];
    }
}

echo json_encode($orders);
?>