<?php
require_once __DIR__ . '/BaseController.php';

class BettingOrderController extends BaseController {
    
    public function getBettingOrders() {
        $user = $this->requireAuth();
        
        try {
            if ($user['role'] === 'admin') {
                // Admin can see all betting orders with user names
                $sql = "
                    SELECT 
                        bo.*,
                        u.username,
                        u.name as user_name
                    FROM betting_orders bo
                    JOIN users u ON bo.user_id = u.id
                    ORDER BY bo.created_at DESC
                ";
                $bettingOrders = $this->db->fetchAll($sql);
            } else {
                // Customer can only see their own betting orders
                $bettingOrders = $this->db->fetchAll(
                    'SELECT * FROM betting_orders WHERE user_id = :user_id ORDER BY created_at DESC',
                    ['user_id' => $user['id']]
                );
            }
            
            $this->success($bettingOrders);
            
        } catch (Exception $e) {
            error_log("Get betting orders error: " . $e->getMessage());
            $this->serverError('Failed to get betting orders');
        }
    }
    
    public function createBettingOrder() {
        $user = $this->requireAuth();
        $data = $this->getRequestBody();
        $this->validateRequired($data, ['asset', 'direction', 'amount', 'duration']);
        
        try {
            // Check if user has sufficient balance
            $amount = floatval($data['amount']);
            $availableBalance = floatval($user['available_balance']);
            
            if ($amount > $availableBalance) {
                $this->badRequest('Insufficient balance');
            }
            
            // Check minimum order amount
            if ($amount < 1000) {
                $this->badRequest('Amount cannot be less than 1000');
            }
            
            // Calculate profit based on duration
            $profitPercentages = [
                30 => 0.20,   // 20%
                60 => 0.30,   // 30%
                120 => 0.40,  // 40%
                180 => 0.50,  // 50%
                240 => 0.60   // 60%
            ];
            
            $duration = intval($data['duration']);
            $profitPercentage = $profitPercentages[$duration] ?? 0.20;
            
            // Create order
            $orderData = [
                'user_id' => $user['id'],
                'order_id' => 'ORD-' . time() . '-' . rand(1000, 9999),
                'asset' => $data['asset'],
                'direction' => $data['direction'],
                'amount' => $data['amount'],
                'entry_price' => $data['entry_price'] ?? '0.00',
                'duration' => $duration,
                'status' => 'active',
                'profit_percentage' => $profitPercentage,
                'created_at' => date('Y-m-d H:i:s'),
                'expires_at' => date('Y-m-d H:i:s', time() + $duration)
            ];
            
            $this->db->beginTransaction();
            
            try {
                // Create betting order
                $order = $this->db->insert('betting_orders', $orderData);
                
                // Update user balance
                $newAvailableBalance = $availableBalance - $amount;
                $newFrozenBalance = floatval($user['frozen_balance']) + $amount;
                
                $this->db->update('users', [
                    'available_balance' => number_format($newAvailableBalance, 2, '.', ''),
                    'frozen_balance' => number_format($newFrozenBalance, 2, '.', '')
                ], ['id' => $user['id']]);
                
                $this->db->commit();
                $this->created($order);
                
            } catch (Exception $e) {
                $this->db->rollback();
                throw $e;
            }
            
        } catch (Exception $e) {
            error_log("Create betting order error: " . $e->getMessage());
            $this->serverError('Failed to create betting order');
        }
    }
    
    public function updateBettingOrder() {
        $this->requireAdmin();
        $id = $_GET['id'] ?? null;
        $data = $this->getRequestBody();
        
        if (!$id) {
            $this->badRequest('Betting order ID is required');
        }
        
        try {
            $updateData = [];
            $allowedFields = ['status', 'result', 'exit_price', 'profit_loss'];
            
            foreach ($allowedFields as $field) {
                if (isset($data[$field])) {
                    $updateData[$field] = $data[$field];
                }
            }
            
            if (empty($updateData)) {
                $this->badRequest('No valid data to update');
            }
            
            $updatedOrder = $this->db->update('betting_orders', $updateData, ['id' => $id]);
            
            if (!$updatedOrder) {
                $this->notFound('Betting order not found');
            }
            
            $this->success($updatedOrder);
            
        } catch (Exception $e) {
            error_log("Update betting order error: " . $e->getMessage());
            $this->serverError('Failed to update betting order');
        }
    }
    
    public function getActiveBettingOrders() {
        $this->requireAdmin();
        
        try {
            $sql = "
                SELECT 
                    bo.*,
                    u.username,
                    u.name as user_name
                FROM betting_orders bo
                JOIN users u ON bo.user_id = u.id
                WHERE bo.status = 'active'
                ORDER BY bo.created_at DESC
            ";
            
            $activeBettingOrders = $this->db->fetchAll($sql);
            $this->success($activeBettingOrders);
            
        } catch (Exception $e) {
            error_log("Get active betting orders error: " . $e->getMessage());
            $this->serverError('Failed to get active betting orders');
        }
    }
    
    public function getAllBettingOrders() {
        $this->requireAdmin();
        
        try {
            $sql = "
                SELECT 
                    bo.*,
                    u.username,
                    u.name as user_name
                FROM betting_orders bo
                JOIN users u ON bo.user_id = u.id
                ORDER BY bo.created_at DESC
            ";
            
            $allBettingOrders = $this->db->fetchAll($sql);
            $this->success($allBettingOrders);
            
        } catch (Exception $e) {
            error_log("Get all betting orders error: " . $e->getMessage());
            $this->serverError('Failed to get all betting orders');
        }
    }
}
?>