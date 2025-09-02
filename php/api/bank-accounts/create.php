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
$required = ['holderName', 'bankName', 'accountNumber', 'ifscCode'];
foreach ($required as $field) {
    if (!isset($input[$field]) || empty($input[$field])) {
        http_response_code(400);
        echo json_encode(['error' => ucfirst($field) . ' is required']);
        exit();
    }
}

$database = new Database();
$db = $database->getConnection();
$user = getCurrentUser();

// Create bank account
$query = "INSERT INTO bank_accounts (
    user_id, holder_name, bank_name, account_number, ifsc_code
) VALUES (
    :user_id, :holder_name, :bank_name, :account_number, :ifsc_code
)";

$stmt = $db->prepare($query);
$stmt->bindParam(':user_id', $user['id']);
$stmt->bindParam(':holder_name', $input['holderName']);
$stmt->bindParam(':bank_name', $input['bankName']);
$stmt->bindParam(':account_number', $input['accountNumber']);
$stmt->bindParam(':ifsc_code', $input['ifscCode']);

if ($stmt->execute()) {
    $accountId = $db->lastInsertId();
    
    // Get created account
    $query = "SELECT * FROM bank_accounts WHERE id = :id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':id', $accountId);
    $stmt->execute();
    $account = $stmt->fetch(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'message' => 'Bank account created successfully',
        'account' => $account
    ]);
} else {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to create bank account']);
}
?>