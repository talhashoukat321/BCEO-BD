<?php
require_once __DIR__ . '/BaseController.php';

class UserController extends BaseController {
    
    public function getAllUsers() {
        $this->requireAdmin();
        
        try {
            $users = $this->db->fetchAll('SELECT * FROM users ORDER BY id DESC');
            $sanitizedUsers = array_map([$this, 'sanitizeUserData'], $users);
            $this->success($sanitizedUsers);
        } catch (Exception $e) {
            $this->serverError('Failed to get users');
        }
    }
    
    public function createUser() {
        $this->requireAdmin();
        $data = $this->getRequestBody();
        $this->validateRequired($data, ['username', 'email', 'password', 'name']);
        
        try {
            // Check if user already exists
            $existingUser = $this->db->fetchOne(
                'SELECT id FROM users WHERE username = :username OR email = :email',
                ['username' => $data['username'], 'email' => $data['email']]
            );
            
            if ($existingUser) {
                $this->badRequest('Username or email already exists');
            }
            
            $userData = [
                'username' => $data['username'],
                'email' => $data['email'],
                'password' => $data['password'],
                'name' => $data['name'],
                'role' => $data['role'] ?? 'customer',
                'balance' => $data['balance'] ?? '0.00',
                'available_balance' => $data['available_balance'] ?? '0.00',
                'frozen_balance' => $data['frozen_balance'] ?? '0.00',
                'reputation' => $data['reputation'] ?? 100,
                'win_lose_setting' => $data['win_lose_setting'] ?? 'To Win',
                'direction' => $data['direction'] ?? 'Actual',
                'is_active' => true,
                'is_banned' => false,
                'withdrawal_prohibited' => false,
                'invitation_code' => $data['invitation_code'] ?? $this->generateInvitationCode(),
                'user_type' => $data['user_type'] ?? 'Normal',
                'general_agent' => $data['general_agent'] ?? 'Admin',
                'registration_time' => date('Y-m-d H:i:s'),
                'remark' => $data['remark'] ?? ''
            ];
            
            $user = $this->db->insert('users', $userData);
            $this->created($this->sanitizeUserData($user));
            
        } catch (Exception $e) {
            error_log("Create user error: " . $e->getMessage());
            $this->serverError('Failed to create user');
        }
    }
    
    public function updateUser() {
        $this->requireAdmin();
        $id = $_GET['id'] ?? null;
        $data = $this->getRequestBody();
        
        if (!$id) {
            $this->badRequest('User ID is required');
        }
        
        try {
            // Remove null values and prepare update data
            $updateData = array_filter($data, function($value) {
                return $value !== null;
            });
            
            if (empty($updateData)) {
                $this->badRequest('No data to update');
            }
            
            $user = $this->db->update('users', $updateData, ['id' => $id]);
            
            if (!$user) {
                $this->notFound('User not found');
            }
            
            $this->success($this->sanitizeUserData($user));
            
        } catch (Exception $e) {
            error_log("Update user error: " . $e->getMessage());
            $this->serverError('Failed to update user');
        }
    }
    
    public function deleteUser() {
        $this->requireAdmin();
        $id = $_GET['id'] ?? null;
        
        if (!$id) {
            $this->badRequest('User ID is required');
        }
        
        try {
            // Check if user exists and is not admin
            $user = $this->db->fetchOne('SELECT * FROM users WHERE id = :id', ['id' => $id]);
            if (!$user) {
                $this->notFound('User not found');
            }
            
            if ($user['role'] === 'admin') {
                $this->forbidden('Cannot delete admin user');
            }
            
            // Delete related records first to handle foreign key constraints
            $this->db->query('DELETE FROM withdrawal_requests WHERE user_id = :id', ['id' => $id]);
            $this->db->query('DELETE FROM betting_orders WHERE user_id = :id', ['id' => $id]);
            $this->db->query('DELETE FROM transactions WHERE user_id = :id', ['id' => $id]);
            $this->db->query('DELETE FROM bank_accounts WHERE user_id = :id', ['id' => $id]);
            $this->db->query('DELETE FROM messages WHERE to_user_id = :id OR from_user_id = :id', ['id' => $id]);
            
            // Delete user
            $deleted = $this->db->delete('users', ['id' => $id]);
            
            if ($deleted) {
                $this->success(null, 'User deleted successfully');
            } else {
                $this->notFound('User not found');
            }
            
        } catch (Exception $e) {
            error_log("Delete user error: " . $e->getMessage());
            $this->serverError('Failed to delete user');
        }
    }
    
    public function updateProfile() {
        $user = $this->requireAuth();
        $data = $this->getRequestBody();
        
        try {
            // Allow only specific fields to be updated by customers
            $allowedFields = ['name', 'profile_image', 'signature_data', 'signature_name', 'fund_password'];
            $updateData = [];
            
            foreach ($allowedFields as $field) {
                if (isset($data[$field])) {
                    $updateData[$field] = $data[$field];
                }
            }
            
            if (empty($updateData)) {
                $this->badRequest('No valid data to update');
            }
            
            $updatedUser = $this->db->update('users', $updateData, ['id' => $user['id']]);
            $this->success($this->sanitizeUserData($updatedUser));
            
        } catch (Exception $e) {
            error_log("Update profile error: " . $e->getMessage());
            $this->serverError('Failed to update profile');
        }
    }
    
    public function recharge() {
        $user = $this->requireAuth();
        $data = $this->getRequestBody();
        
        try {
            // Create a transaction record but don't update balance automatically
            // This allows admin to manually approve recharge requests
            $transactionData = [
                'user_id' => $user['id'],
                'type' => 'recharge',
                'amount' => $data['amount'] ?? '0.00',
                'status' => 'pending',
                'description' => 'Recharge request - awaiting admin approval',
                'created_at' => date('Y-m-d H:i:s')
            ];
            
            $transaction = $this->db->insert('transactions', $transactionData);
            $this->success($transaction, 'Recharge request submitted for approval');
            
        } catch (Exception $e) {
            error_log("Recharge error: " . $e->getMessage());
            $this->serverError('Failed to process recharge');
        }
    }
    
    public function seedDatabase() {
        try {
            $testUsers = [
                [
                    'username' => 'admin',
                    'email' => 'admin@cryptoinvest.com',
                    'password' => 'admin123',
                    'name' => 'Administrator',
                    'role' => 'admin',
                    'balance' => '10000.00',
                    'available_balance' => '10000.00',
                    'frozen_balance' => '0.00',
                    'reputation' => 100,
                    'win_lose_setting' => 'To Win',
                    'direction' => 'Actual',
                    'is_active' => true,
                    'is_banned' => false,
                    'withdrawal_prohibited' => false,
                    'invitation_code' => '100025',
                    'user_type' => 'Admin',
                    'general_agent' => 'System',
                    'registration_time' => date('Y-m-d H:i:s'),
                    'remark' => 'System Administrator'
                ],
                [
                    'username' => 'sarah',
                    'email' => 'sarah@email.com',
                    'password' => 'password123',
                    'name' => 'Sarah Johnson',
                    'role' => 'customer',
                    'balance' => '10500.00',
                    'available_balance' => '10000.00',
                    'frozen_balance' => '500.00',
                    'reputation' => 100,
                    'win_lose_setting' => 'To Win',
                    'direction' => 'Actual',
                    'is_active' => true,
                    'is_banned' => false,
                    'withdrawal_prohibited' => false,
                    'invitation_code' => '100026',
                    'user_type' => 'VIP',
                    'general_agent' => 'Admin',
                    'registration_time' => date('Y-m-d H:i:s'),
                    'remark' => 'VIP Customer'
                ]
            ];
            
            $created = 0;
            foreach ($testUsers as $userData) {
                $existingUser = $this->db->fetchOne(
                    'SELECT id FROM users WHERE username = :username',
                    ['username' => $userData['username']]
                );
                
                if (!$existingUser) {
                    $this->db->insert('users', $userData);
                    $created++;
                }
            }
            
            $this->success(null, "Database seeded successfully. Created {$created} new users.");
            
        } catch (Exception $e) {
            error_log("Database seeding error: " . $e->getMessage());
            $this->serverError('Failed to seed database');
        }
    }
    
    private function generateInvitationCode() {
        return '1' . str_pad(rand(0, 99999), 5, '0', STR_PAD_LEFT);
    }
}
?>