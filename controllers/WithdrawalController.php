<?php
require_once __DIR__ . '/BaseController.php';

class WithdrawalController extends BaseController {
    
    public function getWithdrawalRequests() {
        $user = $this->requireAuth();
        
        try {
            if ($user['role'] === 'admin') {
                // Admin can see all withdrawal requests with user and bank account info
                $sql = "
                    SELECT 
                        wr.*,
                        u.username,
                        u.name as user_name,
                        ba.holder_name,
                        ba.bank_name,
                        ba.account_number,
                        ba.ifsc_code
                    FROM withdrawal_requests wr
                    JOIN users u ON wr.user_id = u.id
                    LEFT JOIN bank_accounts ba ON wr.bank_account_id = ba.id
                    ORDER BY wr.created_at DESC
                ";
                $withdrawalRequests = $this->db->fetchAll($sql);
            } else {
                // Customer can only see their own withdrawal requests
                $withdrawalRequests = $this->db->fetchAll(
                    'SELECT * FROM withdrawal_requests WHERE user_id = :user_id ORDER BY created_at DESC',
                    ['user_id' => $user['id']]
                );
            }
            
            $this->success($withdrawalRequests);
            
        } catch (Exception $e) {
            error_log("Get withdrawal requests error: " . $e->getMessage());
            $this->serverError('Failed to get withdrawal requests');
        }
    }
    
    public function createWithdrawalRequest() {
        $user = $this->requireAuth();
        $data = $this->getRequestBody();
        $this->validateRequired($data, ['amount', 'bank_account_id']);
        
        try {
            // Check if user has bank account
            $bankAccount = $this->db->fetchOne(
                'SELECT * FROM bank_accounts WHERE id = :id AND user_id = :user_id',
                ['id' => $data['bank_account_id'], 'user_id' => $user['id']]
            );
            
            if (!$bankAccount) {
                $this->badRequest('Invalid bank account or bank account not found');
            }
            
            // Check if user has sufficient balance
            $amount = floatval($data['amount']);
            $availableBalance = floatval($user['available_balance']);
            
            if ($amount > $availableBalance) {
                $this->badRequest('Insufficient balance');
            }
            
            // Check if withdrawal is prohibited
            if ($user['withdrawal_prohibited']) {
                $this->forbidden('Withdrawal is prohibited for this account');
            }
            
            $withdrawalData = [
                'user_id' => $user['id'],
                'bank_account_id' => $data['bank_account_id'],
                'amount' => $data['amount'],
                'status' => 'pending',
                'created_at' => date('Y-m-d H:i:s')
            ];
            
            $withdrawal = $this->db->insert('withdrawal_requests', $withdrawalData);
            $this->created($withdrawal);
            
        } catch (Exception $e) {
            error_log("Create withdrawal request error: " . $e->getMessage());
            $this->serverError('Failed to create withdrawal request');
        }
    }
    
    public function updateWithdrawalRequest() {
        $this->requireAdmin();
        $id = $_GET['id'] ?? null;
        $data = $this->getRequestBody();
        
        if (!$id) {
            $this->badRequest('Withdrawal request ID is required');
        }
        
        try {
            $withdrawalRequest = $this->db->fetchOne(
                'SELECT * FROM withdrawal_requests WHERE id = :id',
                ['id' => $id]
            );
            
            if (!$withdrawalRequest) {
                $this->notFound('Withdrawal request not found');
            }
            
            $updateData = [];
            $allowedFields = ['status', 'admin_note', 'processed_at'];
            
            foreach ($allowedFields as $field) {
                if (isset($data[$field])) {
                    $updateData[$field] = $data[$field];
                }
            }
            
            // If approving withdrawal, deduct from user balance
            if (isset($data['status']) && $data['status'] === 'approved') {
                $user = $this->db->fetchOne(
                    'SELECT * FROM users WHERE id = :id',
                    ['id' => $withdrawalRequest['user_id']]
                );
                
                $withdrawalAmount = floatval($withdrawalRequest['amount']);
                $currentAvailable = floatval($user['available_balance']);
                $currentTotal = floatval($user['balance']);
                
                $newAvailable = max(0, $currentAvailable - $withdrawalAmount);
                $newTotal = max(0, $currentTotal - $withdrawalAmount);
                
                $this->db->update('users', [
                    'available_balance' => number_format($newAvailable, 2, '.', ''),
                    'balance' => number_format($newTotal, 2, '.', '')
                ], ['id' => $withdrawalRequest['user_id']]);
                
                $updateData['processed_at'] = date('Y-m-d H:i:s');
                
                // Create transaction record
                $this->db->insert('transactions', [
                    'user_id' => $withdrawalRequest['user_id'],
                    'type' => 'withdrawal',
                    'amount' => $withdrawalRequest['amount'],
                    'status' => 'approved',
                    'description' => 'Withdrawal approved',
                    'created_at' => date('Y-m-d H:i:s')
                ]);
            }
            
            if (empty($updateData)) {
                $this->badRequest('No valid data to update');
            }
            
            $updatedRequest = $this->db->update('withdrawal_requests', $updateData, ['id' => $id]);
            $this->success($updatedRequest);
            
        } catch (Exception $e) {
            error_log("Update withdrawal request error: " . $e->getMessage());
            $this->serverError('Failed to update withdrawal request');
        }
    }
    
    public function getPendingWithdrawalRequests() {
        $this->requireAdmin();
        
        try {
            $sql = "
                SELECT 
                    wr.*,
                    u.username,
                    u.name as user_name,
                    ba.holder_name,
                    ba.bank_name,
                    ba.account_number,
                    ba.ifsc_code
                FROM withdrawal_requests wr
                JOIN users u ON wr.user_id = u.id
                LEFT JOIN bank_accounts ba ON wr.bank_account_id = ba.id
                WHERE wr.status = 'pending'
                ORDER BY wr.created_at DESC
            ";
            
            $pendingRequests = $this->db->fetchAll($sql);
            $this->success($pendingRequests);
            
        } catch (Exception $e) {
            error_log("Get pending withdrawal requests error: " . $e->getMessage());
            $this->serverError('Failed to get pending withdrawal requests');
        }
    }
}
?>