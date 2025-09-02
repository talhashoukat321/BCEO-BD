<?php
// This script should be run every minute via cron job
// Add to crontab: * * * * * /usr/bin/php /path/to/your/php/cron/process-orders.php

require_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

// Get all active orders that should be completed
$query = "SELECT bo.*, u.direction as user_direction 
          FROM betting_orders bo 
          JOIN users u ON bo.user_id = u.id 
          WHERE bo.status = 'active' 
          AND TIMESTAMPDIFF(SECOND, bo.created_at, NOW()) >= bo.duration";

$stmt = $db->prepare($query);
$stmt->execute();
$expiredOrders = $stmt->fetchAll(PDO::FETCH_ASSOC);

foreach ($expiredOrders as $order) {
    // Calculate profit based on duration and direction
    $profitRate = 0;
    switch ($order['duration']) {
        case 30: $profitRate = 0.20; break;
        case 60: $profitRate = 0.30; break;
        case 120: $profitRate = 0.40; break;
        case 180: $profitRate = 0.50; break;
        case 240: $profitRate = 0.60; break;
    }
    
    $baseProfit = floatval($order['amount']) * $profitRate;
    
    // Determine final profit based on user's direction setting
    $finalProfit = $baseProfit;
    if ($order['user_direction'] === 'Buy Down') {
        $finalProfit = -$baseProfit; // Negative profit
    }
    
    // Calculate final amount to return to user (original amount + profit)
    $returnAmount = floatval($order['amount']) + $finalProfit;
    
    try {
        $db->beginTransaction();
        
        // Update order status
        $updateOrderQuery = "UPDATE betting_orders 
                           SET status = 'completed', 
                               profit = :profit, 
                               completed_at = NOW(),
                               exit_price = :exit_price
                           WHERE id = :id";
        
        $stmt = $db->prepare($updateOrderQuery);
        $stmt->bindParam(':profit', $finalProfit);
        $stmt->bindParam(':exit_price', $order['entry_price']); // For now, use entry price
        $stmt->bindParam(':id', $order['id']);
        $stmt->execute();
        
        // Update user balance
        $updateBalanceQuery = "UPDATE users 
                             SET available_balance = available_balance + :return_amount
                             WHERE id = :user_id";
        
        $stmt = $db->prepare($updateBalanceQuery);
        $stmt->bindParam(':return_amount', $returnAmount);
        $stmt->bindParam(':user_id', $order['user_id']);
        $stmt->execute();
        
        $db->commit();
        
        echo "Processed order {$order['id']} - User: {$order['user_id']} - Profit: {$finalProfit}\n";
        
    } catch (Exception $e) {
        $db->rollback();
        echo "Error processing order {$order['id']}: " . $e->getMessage() . "\n";
    }
}

echo "Processed " . count($expiredOrders) . " expired orders at " . date('Y-m-d H:i:s') . "\n";
?>