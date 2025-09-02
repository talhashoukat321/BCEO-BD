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
    // Admin sees all bank accounts with user info
    $query = "SELECT ba.*, u.username, u.name 
              FROM bank_accounts ba 
              JOIN users u ON ba.user_id = u.id 
              ORDER BY ba.created_at DESC";
    $stmt = $db->prepare($query);
} else {
    // Customers see only their bank accounts
    $query = "SELECT * FROM bank_accounts WHERE user_id = :user_id ORDER BY created_at DESC";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':user_id', $user['id']);
}

$stmt->execute();
$accounts = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo json_encode($accounts);
?>