<?php
require_once '../../config/database.php';
require_once '../../includes/session.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit();
}

requireAdmin();

$database = new Database();
$db = $database->getConnection();

// Get pagination parameters
$page = isset($_GET['page']) ? max(1, intval($_GET['page'])) : 1;
$limit = isset($_GET['limit']) ? max(1, min(100, intval($_GET['limit']))) : 25;
$search = isset($_GET['search']) ? trim($_GET['search']) : '';

$offset = ($page - 1) * $limit;

// Build WHERE clause for search
$whereClause = "WHERE 1=1";
$params = [];

if (!empty($search)) {
    $whereClause .= " AND (name LIKE :search OR email LIKE :search OR username LIKE :search)";
    $params[':search'] = "%$search%";
}

// Get total count for pagination
$countQuery = "SELECT COUNT(*) as total FROM users $whereClause";
$countStmt = $db->prepare($countQuery);
foreach ($params as $key => $value) {
    $countStmt->bindValue($key, $value);
}
$countStmt->execute();
$totalCount = $countStmt->fetch(PDO::FETCH_ASSOC)['total'];

// Get paginated users
$query = "SELECT 
    id, username, email, name, role, balance, available_balance, frozen_balance,
    reputation, direction, is_banned, withdrawal_prohibited, invitation_code,
    user_type, general_agent, registration_time, remark, created_at
    FROM users 
    $whereClause
    ORDER BY id DESC 
    LIMIT :limit OFFSET :offset";

$stmt = $db->prepare($query);
$stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
$stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
foreach ($params as $key => $value) {
    $stmt->bindValue($key, $value);
}
$stmt->execute();
$users = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Calculate total balance for display
foreach ($users as &$user) {
    $user['total_balance'] = floatval($user['available_balance']) + floatval($user['frozen_balance']);
}

// Calculate pagination info
$totalPages = ceil($totalCount / $limit);
$hasNextPage = $page < $totalPages;
$hasPrevPage = $page > 1;

echo json_encode([
    'users' => $users,
    'pagination' => [
        'currentPage' => $page,
        'totalPages' => $totalPages,
        'totalCount' => intval($totalCount),
        'limit' => $limit,
        'hasNextPage' => $hasNextPage,
        'hasPrevPage' => $hasPrevPage
    ]
]);
?>