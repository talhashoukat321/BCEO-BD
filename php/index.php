<?php
// Simple API router for Hostinger shared hosting
$request_uri = $_SERVER['REQUEST_URI'];
$path = parse_url($request_uri, PHP_URL_PATH);

// Remove base path if your app is in a subdirectory
$path = str_replace('/php', '', $path);

// API Routes
if (strpos($path, '/api/') === 0) {
    // Remove /api prefix
    $api_path = substr($path, 4);
    
    // Route to appropriate API file
    switch ($api_path) {
        // Auth routes
        case '/auth/login':
            require_once 'api/auth/login.php';
            break;
        case '/auth/register':
            require_once 'api/auth/register.php';
            break;
        case '/auth/check-username':
            require_once 'api/auth/check-username.php';
            break;
        case '/auth/me':
            require_once 'api/auth/me.php';
            break;
        case '/auth/logout':
            require_once 'api/auth/logout.php';
            break;
            
        // Betting orders routes
        case '/betting-orders':
            if ($_SERVER['REQUEST_METHOD'] === 'POST') {
                require_once 'api/betting-orders/create.php';
            } else {
                require_once 'api/betting-orders/list.php';
            }
            break;
            
        // Crypto prices route
        case '/crypto/prices':
            require_once 'api/crypto/prices.php';
            break;
            
        // Transactions routes
        case '/transactions':
            if ($_SERVER['REQUEST_METHOD'] === 'POST') {
                require_once 'api/transactions/create.php';
            } else {
                require_once 'api/transactions/list.php';
            }
            break;
            
        // Bank accounts routes
        case '/bank-accounts':
            if ($_SERVER['REQUEST_METHOD'] === 'POST') {
                require_once 'api/bank-accounts/create.php';
            } else {
                require_once 'api/bank-accounts/list.php';
            }
            break;
            
        // Users routes
        case '/users':
            if ($_SERVER['REQUEST_METHOD'] === 'POST') {
                require_once 'api/users/create.php';
            } else {
                require_once 'api/users/list.php';
            }
            break;
            
        // User update route (PATCH /api/users/{id})
        default:
            if (preg_match('/^\/users\/(\d+)$/', $api_path) && $_SERVER['REQUEST_METHOD'] === 'PATCH') {
                require_once 'api/users/update.php';
            } else {
                http_response_code(404);
                echo json_encode(['error' => 'API endpoint not found']);
            }
            break;
    }
} else {
    // Serve the React frontend
    // In production, this would serve your built React app
    echo '<!DOCTYPE html>
<html>
<head>
    <title>SuperCoin - Cryptocurrency Trading Platform</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body>
    <div id="root">
        <div style="text-align: center; padding: 50px;">
            <h1>SuperCoin</h1>
            <p>Please upload your built React frontend files to this directory.</p>
            <p>The PHP API is ready and running at /php/api/</p>
        </div>
    </div>
</body>
</html>';
}
?>