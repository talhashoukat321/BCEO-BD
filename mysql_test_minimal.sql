-- Minimal test to debug direction column truncation issue
SET sql_mode = '';
SET FOREIGN_KEY_CHECKS = 0;

-- Use the same schema but test just one user
USE supercoin_db;

-- Test minimal insert for first user only
INSERT INTO users (id, username, email, password, name, role, balance, available_balance, frozen_balance, reputation, win_lose_setting, direction, is_banned, withdrawal_prohibited, fund_password, agent_invitation_code, invitation_code, user_type, general_agent, remark, registration_time, profile_image, signature_data, signature_name, is_active, credit_score, tasks_ban) VALUES (15, 'Maruthi123', 'Maruthi123@example.com', 'Maruthi@123', 'Maruthi123', 'customer', 51200.00, 0.00, 51200.00, 100, 'To Win', 'Actual', 0, 0, '8861722432', NULL, NULL, 'Normal', NULL, NULL, '2025-07-09 11:03:22.854', NULL, NULL, NULL, 1, 100, 'Allowed');

-- Verify the insert worked
SELECT id, username, direction FROM users WHERE id = 15;