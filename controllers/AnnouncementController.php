<?php
require_once __DIR__ . '/BaseController.php';

class AnnouncementController extends BaseController {
    
    public function getActiveAnnouncements() {
        try {
            $sql = "
                SELECT * FROM announcements 
                WHERE is_active = true 
                ORDER BY created_at DESC
            ";
            
            $announcements = $this->db->fetchAll($sql);
            $this->success($announcements);
            
        } catch (Exception $e) {
            error_log("Get active announcements error: " . $e->getMessage());
            $this->serverError('Failed to get active announcements');
        }
    }
    
    public function getAllAnnouncements() {
        $this->requireAdmin();
        
        try {
            $announcements = $this->db->fetchAll('SELECT * FROM announcements ORDER BY created_at DESC');
            $this->success($announcements);
            
        } catch (Exception $e) {
            error_log("Get all announcements error: " . $e->getMessage());
            $this->serverError('Failed to get all announcements');
        }
    }
    
    public function createAnnouncement() {
        $this->requireAdmin();
        $data = $this->getRequestBody();
        $this->validateRequired($data, ['title', 'content']);
        
        try {
            $announcementData = [
                'title' => $data['title'],
                'content' => $data['content'],
                'is_active' => $data['is_active'] ?? true,
                'created_at' => date('Y-m-d H:i:s')
            ];
            
            $announcement = $this->db->insert('announcements', $announcementData);
            $this->created($announcement);
            
        } catch (Exception $e) {
            error_log("Create announcement error: " . $e->getMessage());
            $this->serverError('Failed to create announcement');
        }
    }
    
    public function updateAnnouncement() {
        $this->requireAdmin();
        $id = $_GET['id'] ?? null;
        $data = $this->getRequestBody();
        
        if (!$id) {
            $this->badRequest('Announcement ID is required');
        }
        
        try {
            $updateData = [];
            $allowedFields = ['title', 'content', 'is_active'];
            
            foreach ($allowedFields as $field) {
                if (isset($data[$field])) {
                    $updateData[$field] = $data[$field];
                }
            }
            
            if (empty($updateData)) {
                $this->badRequest('No valid data to update');
            }
            
            $updatedAnnouncement = $this->db->update('announcements', $updateData, ['id' => $id]);
            
            if (!$updatedAnnouncement) {
                $this->notFound('Announcement not found');
            }
            
            $this->success($updatedAnnouncement);
            
        } catch (Exception $e) {
            error_log("Update announcement error: " . $e->getMessage());
            $this->serverError('Failed to update announcement');
        }
    }
}
?>