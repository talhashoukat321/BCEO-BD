<?php
require_once '../../config/database.php';
require_once '../../includes/session.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit();
}

if (!isLoggedIn()) {
    http_response_code(401);
    echo json_encode(['error' => 'Not authenticated']);
    exit();
}

$user = getCurrentUser();

if (!$user) {
    http_response_code(401);
    echo json_encode(['error' => 'User not found']);
    exit();
}

// Remove sensitive data
unset($user['password_hash']);
unset($user['fund_password_hash']);

echo json_encode(['user' => $user]);
?>