<?php
require_once '../../config/database.php';
require_once '../../includes/session.php';

if ($_SERVER['REQUEST_METHOD'] !== 'PATCH') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit();
}

requireLogin();

$input = json_decode(file_get_contents('php://input'), true);
$user = getCurrentUser();

// Extract user ID from URL
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$pathParts = explode('/', $path);
$userId = end($pathParts);

// Admin can update any user, customers can only update themselves
if ($user['role'] !== 'admin' && $user['id'] != $userId) {
    http_response_code(403);
    echo json_encode(['error' => 'Forbidden']);
    exit();
}

$database = new Database();
$db = $database->getConnection();

// Build dynamic update query
$updateFields = [];
$params = [':id' => $userId];

// Allowed fields for update
$allowedFields = [
    'balance', 'available_balance', 'frozen_balance', 'reputation', 
    'direction', 'is_banned', 'withdrawal_prohibited', 'profile_image',
    'signature', 'gender', 'name', 'remark'
];

foreach ($input as $field => $value) {
    if (in_array($field, $allowedFields)) {
        $updateFields[] = "$field = :$field";
        $params[":$field"] = $value;
    }
}

if (empty($updateFields)) {
    http_response_code(400);
    echo json_encode(['error' => 'No valid fields to update']);
    exit();
}

$query = "UPDATE users SET " . implode(', ', $updateFields) . " WHERE id = :id";
$stmt = $db->prepare($query);

if ($stmt->execute($params)) {
    // Get updated user
    $query = "SELECT * FROM users WHERE id = :id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':id', $userId);
    $stmt->execute();
    $updatedUser = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // Remove sensitive data
    unset($updatedUser['password_hash']);
    unset($updatedUser['fund_password_hash']);
    
    echo json_encode($updatedUser);
} else {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to update user']);
}
?>