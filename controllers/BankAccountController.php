<?php
require_once __DIR__ . '/BaseController.php';

class BankAccountController extends BaseController {
    
    public function getBankAccounts() {
        $user = $this->requireAuth();
        
        try {
            if ($user['role'] === 'admin') {
                // Admin can see all bank accounts
                $bankAccounts = $this->db->fetchAll('SELECT * FROM bank_accounts ORDER BY id DESC');
            } else {
                // Customer can only see their own bank accounts
                $bankAccounts = $this->db->fetchAll(
                    'SELECT * FROM bank_accounts WHERE user_id = :user_id ORDER BY id DESC',
                    ['user_id' => $user['id']]
                );
            }
            
            $this->success($bankAccounts);
            
        } catch (Exception $e) {
            error_log("Get bank accounts error: " . $e->getMessage());
            $this->serverError('Failed to get bank accounts');
        }
    }
    
    public function createBankAccount() {
        $user = $this->requireAuth();
        $data = $this->getRequestBody();
        $this->validateRequired($data, ['holder_name', 'bank_name', 'account_number', 'ifsc_code']);
        
        try {
            $bankAccountData = [
                'user_id' => $user['id'],
                'holder_name' => $data['holder_name'],
                'bank_name' => $data['bank_name'],
                'account_number' => $data['account_number'],
                'ifsc_code' => $data['ifsc_code'],
                'account_type' => $data['account_type'] ?? 'Savings',
                'created_at' => date('Y-m-d H:i:s')
            ];
            
            $bankAccount = $this->db->insert('bank_accounts', $bankAccountData);
            $this->created($bankAccount);
            
        } catch (Exception $e) {
            error_log("Create bank account error: " . $e->getMessage());
            $this->serverError('Failed to create bank account');
        }
    }
    
    public function updateBankAccount() {
        $user = $this->requireAuth();
        $id = $_GET['id'] ?? null;
        $data = $this->getRequestBody();
        
        if (!$id) {
            $this->badRequest('Bank account ID is required');
        }
        
        try {
            // Check if bank account exists and belongs to user (or user is admin)
            $bankAccount = $this->db->fetchOne(
                'SELECT * FROM bank_accounts WHERE id = :id',
                ['id' => $id]
            );
            
            if (!$bankAccount) {
                $this->notFound('Bank account not found');
            }
            
            if ($user['role'] !== 'admin' && $bankAccount['user_id'] !== $user['id']) {
                $this->forbidden('You can only update your own bank accounts');
            }
            
            // Update data
            $updateData = [];
            $allowedFields = ['holder_name', 'bank_name', 'account_number', 'ifsc_code', 'account_type'];
            
            foreach ($allowedFields as $field) {
                if (isset($data[$field])) {
                    $updateData[$field] = $data[$field];
                }
            }
            
            if (empty($updateData)) {
                $this->badRequest('No valid data to update');
            }
            
            $updatedBankAccount = $this->db->update('bank_accounts', $updateData, ['id' => $id]);
            $this->success($updatedBankAccount);
            
        } catch (Exception $e) {
            error_log("Update bank account error: " . $e->getMessage());
            $this->serverError('Failed to update bank account');
        }
    }
    
    public function deleteBankAccount() {
        $user = $this->requireAuth();
        $id = $_GET['id'] ?? null;
        
        if (!$id) {
            $this->badRequest('Bank account ID is required');
        }
        
        try {
            // Check if bank account exists and belongs to user (or user is admin)
            $bankAccount = $this->db->fetchOne(
                'SELECT * FROM bank_accounts WHERE id = :id',
                ['id' => $id]
            );
            
            if (!$bankAccount) {
                $this->notFound('Bank account not found');
            }
            
            if ($user['role'] !== 'admin' && $bankAccount['user_id'] !== $user['id']) {
                $this->forbidden('You can only delete your own bank accounts');
            }
            
            $deleted = $this->db->delete('bank_accounts', ['id' => $id]);
            
            if ($deleted) {
                $this->success(null, 'Bank account deleted successfully');
            } else {
                $this->notFound('Bank account not found');
            }
            
        } catch (Exception $e) {
            error_log("Delete bank account error: " . $e->getMessage());
            $this->serverError('Failed to delete bank account');
        }
    }
    
    public function getBankAccountsWithUsers() {
        $this->requireAdmin();
        
        try {
            $sql = "
                SELECT 
                    ba.*,
                    u.username as user_name,
                    u.name as user_full_name
                FROM bank_accounts ba
                JOIN users u ON ba.user_id = u.id
                ORDER BY ba.id DESC
            ";
            
            $bankAccounts = $this->db->fetchAll($sql);
            
            // Format for frontend compatibility
            $formattedAccounts = [];
            foreach ($bankAccounts as $account) {
                $formattedAccounts[] = [
                    'userId' => $account['user_id'],
                    'userName' => $account['user_full_name'],
                    'bankAccount' => [
                        'id' => $account['id'],
                        'holder_name' => $account['holder_name'],
                        'bank_name' => $account['bank_name'],
                        'account_number' => $account['account_number'],
                        'ifsc_code' => $account['ifsc_code'],
                        'account_type' => $account['account_type']
                    ]
                ];
            }
            
            $this->success($formattedAccounts);
            
        } catch (Exception $e) {
            error_log("Get bank accounts with users error: " . $e->getMessage());
            $this->serverError('Failed to get bank accounts with users');
        }
    }
}
?>