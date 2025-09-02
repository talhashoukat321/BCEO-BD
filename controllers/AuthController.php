<?php
require_once __DIR__ . '/BaseController.php';

class AuthController extends BaseController {
    
    public function login() {
        $data = $this->getRequestBody();
        $this->validateRequired($data, ['username', 'password']);
        
        try {
            $user = $this->db->fetchOne(
                'SELECT * FROM users WHERE username = :username',
                ['username' => $data['username']]
            );
            
            if (!$user || $user['password'] !== $data['password']) {
                $this->unauthorized('Invalid credentials');
            }
            
            // Check if account is banned
            if ($user['is_banned']) {
                $this->forbidden('Account has been suspended. Please contact support.');
            }
            
            // Create session
            $sessionId = $this->generateSessionId();
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['session_id'] = $sessionId;
            
            // Set cookie
            setcookie('sessionId', $sessionId, time() + (30 * 24 * 60 * 60), '/', '', false, true);
            
            $this->success([
                'user' => $this->sanitizeUserData($user),
                'sessionId' => $sessionId
            ]);
            
        } catch (Exception $e) {
            error_log("Login error: " . $e->getMessage());
            $this->serverError('Login failed');
        }
    }
    
    public function logout() {
        session_destroy();
        setcookie('sessionId', '', time() - 3600, '/');
        $this->success(null, 'Logged out successfully');
    }
    
    public function me() {
        $user = $this->requireAuth();
        $this->success(['user' => $this->sanitizeUserData($user)]);
    }
    
    public function register() {
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
            
            // Create user
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
            $this->created(['user' => $this->sanitizeUserData($user)]);
            
        } catch (Exception $e) {
            error_log("Registration error: " . $e->getMessage());
            $this->serverError('Registration failed');
        }
    }
    
    private function generateInvitationCode() {
        return '1' . str_pad(rand(0, 99999), 5, '0', STR_PAD_LEFT);
    }
}
?>