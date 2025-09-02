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
    // Admin sees all transactions
    $query = "SELECT t.*, u.username, u.name 
              FROM transactions t 
              JOIN users u ON t.user_id = u.id 
              ORDER BY t.created_at DESC";
    $stmt = $db->prepare($query);
} else {
    // Customers see only their transactions
    $query = "SELECT * FROM transactions WHERE user_id = :user_id ORDER BY created_at DESC";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':user_id', $user['id']);
}

$stmt->execute();
$transactions = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo json_encode($transactions);
?>