-- SuperCoin MySQL Quick Start
-- Run these commands in your MySQL client

-- Step 1: Create database
CREATE DATABASE IF NOT EXISTS supercoin_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE supercoin_db;

-- Step 2: Create tables (schema)
SOURCE mysql_database_backup_2025-08-05.sql;

-- Step 3: Insert essential data (admin and sample user)
INSERT INTO users (username, email, password, name, role, balance, available_balance, frozen_balance, reputation, credit_score, win_lose_setting, direction, is_banned, withdrawal_prohibited, tasks_ban, invitation_code, user_type, general_agent, remark, is_active) VALUES 
('admin', 'admin@cryptoinvest.com', 'admin123', 'Administrator', 'admin', 9990.00, 6757.00, 0.00, 15, 100, 'To Win', 'Actual', 0, 0, 'Allowed', '100025', 'Agent', 'System', 'admin', 1),
('sarah', 'sarah@email.com', 'password123', 'Sarah Johnson', 'customer', 306450.00, 312950.00, 500.00, 5, 100, 'To Win', 'Actual', 0, 0, 'Allowed', '100026', 'Normal', 'Agent001', NULL, 1);

-- Step 4: Verify installation
SELECT 'Database created successfully' as status;
SELECT COUNT(*) as user_count FROM users;
SELECT username, role, balance FROM users;

-- Step 5: Check table structure
SHOW TABLES;
DESCRIBE users;