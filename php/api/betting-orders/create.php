<?php
require_once '../../config/database.php';
require_once '../../includes/session.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit();
}

requireLogin();

$input = json_decode(file_get_contents('php://input'), true);

// Validate required fields
$required = ['asset', 'amount', 'direction', 'duration', 'entryPrice'];
foreach ($required as $field) {
    if (!isset($input[$field])) {
        http_response_code(400);
        echo json_encode(['error' => ucfirst($field) . ' is required']);
        exit();
    }
}

$amount = floatval($input['amount']);
if ($amount < 1000) {
    http_response_code(400);
    echo json_encode(['error' => 'Amount cannot be less than 1000']);
    exit();
}

$database = new Database();
$db = $database->getConnection();

// Get current user
$user = getCurrentUser();
if (!$user) {
    http_response_code(401);
    echo json_encode(['error' => 'User not found']);
    exit();
}

// Check if user has sufficient balance
if (floatval($user['available_balance']) < $amount) {
    http_response_code(400);
    echo json_encode(['error' => 'Insufficient balance']);
    exit();
}

// Determine actual direction based on user's backend setting
$actualDirection = $input['actualDirection'] ?? $input['direction'];
$backendDirection = $user['direction'];

$finalDirection = $actualDirection;
if ($backendDirection !== 'Actual') {
    $finalDirection = $backendDirection;
}

// Deduct amount from user's available balance
$newAvailableBalance = floatval($user['available_balance']) - $amount;
$query = "UPDATE users SET available_balance = :balance WHERE id = :id";
$stmt = $db->prepare($query);
$stmt->bindParam(':balance', $newAvailableBalance);
$stmt->bindParam(':id', $user['id']);
$stmt->execute();

// Create betting order
$query = "INSERT INTO betting_orders (
    user_id, asset, amount, direction, actual_direction, 
    duration, entry_price, status, created_at
) VALUES (
    :user_id, :asset, :amount, :direction, :actual_direction,
    :duration, :entry_price, 'active', NOW()
)";

$stmt = $db->prepare($query);
$stmt->bindParam(':user_id', $user['id']);
$stmt->bindParam(':asset', $input['asset']);
$stmt->bindParam(':amount', $amount);
$stmt->bindParam(':direction', $finalDirection);
$stmt->bindParam(':actual_direction', $actualDirection);
$stmt->bindParam(':duration', $input['duration']);
$stmt->bindParam(':entry_price', $input['entryPrice']);

if ($stmt->execute()) {
    $orderId = $db->lastInsertId();
    
    // Schedule order completion (we'll use a cron job for this)
    // For now, we'll return success
    
    echo json_encode([
        'message' => 'Order created successfully',
        'orderId' => $orderId
    ]);
} else {
    // Refund the balance if order creation failed
    $refundBalance = floatval($user['available_balance']);
    $query = "UPDATE users SET available_balance = :balance WHERE id = :id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':balance', $refundBalance);
    $stmt->bindParam(':id', $user['id']);
    $stmt->execute();
    
    http_response_code(500);
    echo json_encode(['error' => 'Failed to create order']);
}
?>