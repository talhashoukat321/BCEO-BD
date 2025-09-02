<?php
// API Routes Configuration
require_once __DIR__ . '/../controllers/AuthController.php';
require_once __DIR__ . '/../controllers/UserController.php';
require_once __DIR__ . '/../controllers/BankAccountController.php';
require_once __DIR__ . '/../controllers/TransactionController.php';
require_once __DIR__ . '/../controllers/BettingOrderController.php';
require_once __DIR__ . '/../controllers/WithdrawalController.php';
require_once __DIR__ . '/../controllers/AnnouncementController.php';
require_once __DIR__ . '/../controllers/CryptoController.php';

// Route definitions
$routes = [
    // Authentication routes
    'POST auth/login' => [AuthController::class, 'login'],
    'POST auth/logout' => [AuthController::class, 'logout'],
    'GET auth/me' => [AuthController::class, 'me'],
    'POST auth/register' => [AuthController::class, 'register'],
    
    // User management routes
    'GET users' => [UserController::class, 'getAllUsers'],
    'POST users' => [UserController::class, 'createUser'],
    'PATCH users/{id}' => [UserController::class, 'updateUser'],
    'DELETE users/{id}' => [UserController::class, 'deleteUser'],
    'PATCH profile' => [UserController::class, 'updateProfile'],
    'PATCH recharge' => [UserController::class, 'recharge'],
    
    // Bank account routes
    'GET bank-accounts' => [BankAccountController::class, 'getBankAccounts'],
    'POST bank-accounts' => [BankAccountController::class, 'createBankAccount'],
    'PATCH bank-accounts/{id}' => [BankAccountController::class, 'updateBankAccount'],
    'DELETE bank-accounts/{id}' => [BankAccountController::class, 'deleteBankAccount'],
    'GET bank-accounts-with-users' => [BankAccountController::class, 'getBankAccountsWithUsers'],
    
    // Transaction routes
    'GET transactions' => [TransactionController::class, 'getTransactions'],
    'POST transactions' => [TransactionController::class, 'createTransaction'],
    
    // Betting order routes
    'GET betting-orders' => [BettingOrderController::class, 'getBettingOrders'],
    'POST betting-orders' => [BettingOrderController::class, 'createBettingOrder'],
    'PATCH betting-orders/{id}' => [BettingOrderController::class, 'updateBettingOrder'],
    'GET betting-orders/active' => [BettingOrderController::class, 'getActiveBettingOrders'],
    'GET betting-orders/all' => [BettingOrderController::class, 'getAllBettingOrders'],
    
    // Withdrawal routes
    'GET withdrawal-requests' => [WithdrawalController::class, 'getWithdrawalRequests'],
    'POST withdrawal-requests' => [WithdrawalController::class, 'createWithdrawalRequest'],
    'PATCH withdrawal-requests/{id}' => [WithdrawalController::class, 'updateWithdrawalRequest'],
    'GET withdrawal-requests/pending' => [WithdrawalController::class, 'getPendingWithdrawalRequests'],
    
    // Announcement routes
    'GET announcements' => [AnnouncementController::class, 'getActiveAnnouncements'],
    'GET announcements/all' => [AnnouncementController::class, 'getAllAnnouncements'],
    'POST announcements' => [AnnouncementController::class, 'createAnnouncement'],
    'PATCH announcements/{id}' => [AnnouncementController::class, 'updateAnnouncement'],
    
    // Crypto routes
    'GET crypto-prices' => [CryptoController::class, 'getCryptoPrices'],
    
    // Database seeding
    'POST seed-database' => [UserController::class, 'seedDatabase'],
];

// Convert routes to callable format
foreach ($routes as $route => $handler) {
    if (is_array($handler)) {
        $routes[$route] = function() use ($handler) {
            $controller = new $handler[0]();
            $method = $handler[1];
            return $controller->$method();
        };
    }
}
?>