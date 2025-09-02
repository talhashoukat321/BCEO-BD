<?php
require_once '../../config/database.php';
require_once '../../includes/session.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit();
}

requireAdmin();

$input = json_decode(file_get_contents('php://input'), true);

// Validate required fields
$required = ['username', 'email', 'password', 'name'];
foreach ($required as $field) {
    if (!isset($input[$field]) || empty($input[$field])) {
        http_response_code(400);
        echo json_encode(['error' => ucfirst($field) . ' is required']);
        exit();
    }
}

$database = new Database();
$db = $database->getConnection();

// Check if username already exists
$query = "SELECT COUNT(*) FROM users WHERE username = :username";
$stmt = $db->prepare($query);
$stmt->bindParam(':username', $input['username']);
$stmt->execute();

if ($stmt->fetchColumn() > 0) {
    http_response_code(409);
    echo json_encode(['error' => 'Username already exists']);
    exit();
}

// Generate invitation code
$invitationCode = '10' . str_pad(rand(1000, 9999), 4, '0', STR_PAD_LEFT);

// Hash password
$passwordHash = password_hash($input['password'], PASSWORD_DEFAULT);

// Insert new user
$query = "INSERT INTO users (
    username, email, password_hash, name, role, reputation,
    balance, available_balance, invitation_code
) VALUES (
    :username, :email, :password_hash, :name, :role, :reputation,
    :balance, :available_balance, :invitation_code
)";

$stmt = $db->prepare($query);
$stmt->bindParam(':username', $input['username']);
$stmt->bindParam(':email', $input['email']);
$stmt->bindParam(':password_hash', $passwordHash);
$stmt->bindParam(':name', $input['name']);
$stmt->bindParam(':role', $input['role'] ?? 'customer');
$stmt->bindParam(':reputation', $input['reputation'] ?? 100);
$stmt->bindParam(':balance', $input['balance'] ?? 0.00);
$stmt->bindParam(':available_balance', $input['balance'] ?? 0.00);
$stmt->bindParam(':invitation_code', $invitationCode);

if ($stmt->execute()) {
    $userId = $db->lastInsertId();
    
    // Get created user
    $query = "SELECT * FROM users WHERE id = :id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':id', $userId);
    $stmt->execute();
    $newUser = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // Remove sensitive data
    unset($newUser['password_hash']);
    unset($newUser['fund_password_hash']);
    
    echo json_encode([
        'message' => 'User created successfully',
        'user' => $newUser
    ]);
} else {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to create user']);
}
?>