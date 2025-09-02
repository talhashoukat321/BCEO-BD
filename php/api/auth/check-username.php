<?php
require_once '../../config/database.php';
require_once '../../includes/session.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit();
}

if (!isset($_GET['username'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Username parameter required']);
    exit();
}

$username = $_GET['username'];

$database = new Database();
$db = $database->getConnection();

$query = "SELECT COUNT(*) FROM users WHERE username = :username";
$stmt = $db->prepare($query);
$stmt->bindParam(':username', $username);
$stmt->execute();

$exists = $stmt->fetchColumn() > 0;

echo json_encode([
    'available' => !$exists,
    'message' => $exists ? 'Username already exists' : 'Username is available'
]);
?>