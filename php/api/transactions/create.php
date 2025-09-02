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
$required = ['type', 'amount'];
foreach ($required as $field) {
    if (!isset($input[$field])) {
        http_response_code(400);
        echo json_encode(['error' => ucfirst($field) . ' is required']);
        exit();
    }
}

$database = new Database();
$db = $database->getConnection();
$user = getCurrentUser();

// Create transaction record
$query = "INSERT INTO transactions (
    user_id, type, amount, description, status, transaction_no, recharge_info
) VALUES (
    :user_id, :type, :amount, :description, :status, :transaction_no, :recharge_info
)";

$stmt = $db->prepare($query);
$stmt->bindParam(':user_id', $user['id']);
$stmt->bindParam(':type', $input['type']);
$stmt->bindParam(':amount', $input['amount']);
$stmt->bindParam(':description', $input['description'] ?? null);
$stmt->bindParam(':status', $input['status'] ?? 'pending');
$stmt->bindParam(':transaction_no', $input['transactionNo'] ?? null);
$stmt->bindParam(':recharge_info', $input['rechargeInfo'] ?? null);

if ($stmt->execute()) {
    $transactionId = $db->lastInsertId();
    
    // Get created transaction
    $query = "SELECT * FROM transactions WHERE id = :id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':id', $transactionId);
    $stmt->execute();
    $transaction = $stmt->fetch(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'message' => 'Transaction created successfully',
        'transaction' => $transaction
    ]);
} else {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to create transaction']);
}
?>