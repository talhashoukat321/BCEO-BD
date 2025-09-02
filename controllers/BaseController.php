<?php
// Base controller with common functionality
class BaseController {
    protected $db;
    
    public function __construct() {
        $this->db = Database::getInstance();
    }
    
    protected function getCurrentUser() {
        $sessionId = $this->getSessionId();
        if (!$sessionId) {
            return null;
        }
        
        $userId = $_SESSION['user_id'] ?? null;
        if (!$userId) {
            return null;
        }
        
        return $this->db->fetchOne('SELECT * FROM users WHERE id = :id', ['id' => $userId]);
    }
    
    protected function requireAuth() {
        $user = $this->getCurrentUser();
        if (!$user) {
            $this->unauthorized('Authentication required');
        }
        return $user;
    }
    
    protected function requireAdmin() {
        $user = $this->requireAuth();
        if ($user['role'] !== 'admin') {
            $this->forbidden('Admin access required');
        }
        return $user;
    }
    
    protected function getSessionId() {
        return $_SERVER['HTTP_X_SESSION_ID'] ?? $_COOKIE['sessionId'] ?? null;
    }
    
    protected function getRequestBody() {
        $input = file_get_contents('php://input');
        return json_decode($input, true) ?? [];
    }
    
    protected function success($data = null, $message = null) {
        $response = [];
        if ($message) $response['message'] = $message;
        if ($data !== null) $response = array_merge($response, is_array($data) ? $data : ['data' => $data]);
        
        http_response_code(200);
        echo json_encode($response);
        exit;
    }
    
    protected function created($data = null, $message = null) {
        $response = [];
        if ($message) $response['message'] = $message;
        if ($data !== null) $response = array_merge($response, is_array($data) ? $data : ['data' => $data]);
        
        http_response_code(201);
        echo json_encode($response);
        exit;
    }
    
    protected function badRequest($message = 'Bad request') {
        http_response_code(400);
        echo json_encode(['message' => $message]);
        exit;
    }
    
    protected function unauthorized($message = 'Unauthorized') {
        http_response_code(401);
        echo json_encode(['message' => $message]);
        exit;
    }
    
    protected function forbidden($message = 'Forbidden') {
        http_response_code(403);
        echo json_encode(['message' => $message]);
        exit;
    }
    
    protected function notFound($message = 'Not found') {
        http_response_code(404);
        echo json_encode(['message' => $message]);
        exit;
    }
    
    protected function serverError($message = 'Internal server error') {
        http_response_code(500);
        echo json_encode(['message' => $message]);
        exit;
    }
    
    protected function validateRequired($data, $required) {
        foreach ($required as $field) {
            if (!isset($data[$field]) || empty($data[$field])) {
                $this->badRequest("Field '{$field}' is required");
            }
        }
    }
    
    protected function sanitizeUserData($user) {
        unset($user['password']);
        return $user;
    }
    
    protected function generateSessionId() {
        return bin2hex(random_bytes(16)) . time();
    }
}
?>