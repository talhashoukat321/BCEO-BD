<?php
require_once '../../config/database.php';
require_once '../../includes/session.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit();
}

$input = json_decode(file_get_contents('php://input'), true);

// Validate required fields
$required = ['username', 'email', 'password', 'name', 'fundPassword'];
foreach ($required as $field) {
    if (!isset($input[$field]) || empty($input[$field])) {
        http_response_code(400);
        echo json_encode(['error' => ucfirst($field) . ' is required']);
        exit();
    }
}

// Validate username (no spaces)
if (strpos($input['username'], ' ') !== false) {
    http_response_code(400);
    echo json_encode(['error' => 'Username cannot contain spaces']);
    exit();
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

// Check if email already exists
$query = "SELECT COUNT(*) FROM users WHERE email = :email";
$stmt = $db->prepare($query);
$stmt->bindParam(':email', $input['email']);
$stmt->execute();

if ($stmt->fetchColumn() > 0) {
    http_response_code(409);
    echo json_encode(['error' => 'Email already exists']);
    exit();
}

// Generate invitation code
$invitationCode = '10' . str_pad(rand(1000, 9999), 4, '0', STR_PAD_LEFT);

// Hash passwords
$passwordHash = password_hash($input['password'], PASSWORD_DEFAULT);
$fundPasswordHash = password_hash($input['fundPassword'], PASSWORD_DEFAULT);

// Insert new user
$query = "INSERT INTO users (
    username, email, password_hash, name, fund_password_hash, 
    agent_invitation_code, invitation_code, reputation,
    balance, available_balance
) VALUES (
    :username, :email, :password_hash, :name, :fund_password_hash,
    :agent_invitation_code, :invitation_code, :reputation,
    :balance, :available_balance
)";

$stmt = $db->prepare($query);
$stmt->bindParam(':username', $input['username']);
$stmt->bindParam(':email', $input['email']);
$stmt->bindParam(':password_hash', $passwordHash);
$stmt->bindParam(':name', $input['name']);
$stmt->bindParam(':fund_password_hash', $fundPasswordHash);
$stmt->bindParam(':agent_invitation_code', $input['agentInvitationCode'] ?? null);
$stmt->bindParam(':invitation_code', $invitationCode);
$stmt->bindValue(':reputation', 100);
$stmt->bindValue(':balance', 0.00);
$stmt->bindValue(':available_balance', 0.00);

if ($stmt->execute()) {
    echo json_encode([
        'message' => 'Registration successful',
        'user' => [
            'username' => $input['username'],
            'email' => $input['email'],
            'name' => $input['name']
        ]
    ]);
} else {
    http_response_code(500);
    echo json_encode(['error' => 'Registration failed']);
}
?>