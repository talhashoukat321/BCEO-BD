<?php
require_once __DIR__ . '/BaseController.php';

class TransactionController extends BaseController {
    
    public function getTransactions() {
        $user = $this->requireAuth();
        
        try {
            if ($user['role'] === 'admin') {
                // Admin can see all transactions
                $transactions = $this->db->fetchAll('SELECT * FROM transactions ORDER BY created_at DESC');
            } else {
                // Customer can only see their own transactions
                $transactions = $this->db->fetchAll(
                    'SELECT * FROM transactions WHERE user_id = :user_id ORDER BY created_at DESC',
                    ['user_id' => $user['id']]
                );
            }
            
            $this->success($transactions);
            
        } catch (Exception $e) {
            error_log("Get transactions error: " . $e->getMessage());
            $this->serverError('Failed to get transactions');
        }
    }
    
    public function createTransaction() {
        $user = $this->requireAuth();
        $data = $this->getRequestBody();
        $this->validateRequired($data, ['type', 'amount']);
        
        try {
            $transactionData = [
                'user_id' => $data['user_id'] ?? $user['id'],
                'type' => $data['type'],
                'amount' => $data['amount'],
                'status' => $data['status'] ?? 'completed',
                'description' => $data['description'] ?? '',
                'created_at' => date('Y-m-d H:i:s')
            ];
            
            // Only admin can create transactions for other users
            if ($user['role'] !== 'admin' && $transactionData['user_id'] !== $user['id']) {
                $this->forbidden('You can only create transactions for yourself');
            }
            
            $transaction = $this->db->insert('transactions', $transactionData);
            $this->created($transaction);
            
        } catch (Exception $e) {
            error_log("Create transaction error: " . $e->getMessage());
            $this->serverError('Failed to create transaction');
        }
    }
}
?>