<?php
require_once '../../includes/session.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit();
}

// Destroy session
session_destroy();

echo json_encode(['message' => 'Logout successful']);
?>