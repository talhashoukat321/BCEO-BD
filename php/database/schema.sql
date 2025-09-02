-- SuperCoin Database Schema for MySQL
-- Updated with latest database structure
-- Run this in your Hostinger MySQL database

CREATE DATABASE IF NOT EXISTS supercoin;
USE supercoin;

-- Users table with all latest fields
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role ENUM('customer', 'admin') DEFAULT 'customer',
    balance DECIMAL(15,2) DEFAULT 0.00,
    available_balance DECIMAL(15,2) DEFAULT 0.00,
    frozen_balance DECIMAL(15,2) DEFAULT 0.00,
    reputation INT DEFAULT 100,
    win_lose_setting ENUM('To Win', 'To Lose', 'Random') DEFAULT 'To Win',
    direction ENUM('Buy Up', 'Buy Down', 'Actual') DEFAULT 'Actual',
    is_banned BOOLEAN DEFAULT FALSE,
    withdrawal_prohibited BOOLEAN DEFAULT FALSE,
    fund_password VARCHAR(255),
    agent_invitation_code VARCHAR(255),
    invitation_code VARCHAR(255),
    user_type ENUM('Normal', 'VIP', 'Agent') DEFAULT 'Normal',
    general_agent VARCHAR(255),
    remark TEXT,
    registration_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    profile_image TEXT,
    signature_data TEXT,
    signature_name VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    credit_score INT DEFAULT 100,
    tasks_ban ENUM('Allowed', 'Prohibited') DEFAULT 'Allowed',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Bank accounts table
CREATE TABLE bank_accounts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    account_holder_name VARCHAR(255) NOT NULL,
    account_number VARCHAR(100) NOT NULL,
    bank_name VARCHAR(255) NOT NULL,
    ifsc_code VARCHAR(20) NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Transactions table
CREATE TABLE transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    type ENUM('deposit', 'withdrawal', 'freeze', 'unfreeze', 'deduct') NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    status ENUM('pending', 'completed', 'rejected') DEFAULT 'pending',
    description TEXT,
    transaction_no VARCHAR(100),
    recharge_info TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Betting orders table with updated structure
CREATE TABLE betting_orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    order_id VARCHAR(100) NOT NULL UNIQUE,
    asset VARCHAR(50) NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    direction ENUM('Buy Up', 'Buy Down') NOT NULL,
    duration INT NOT NULL,
    entry_price DECIMAL(15,4) NOT NULL,
    exit_price DECIMAL(15,4),
    status ENUM('active', 'completed', 'cancelled') DEFAULT 'active',
    result ENUM('win', 'loss') NULL,
    profit DECIMAL(15,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    completed_at TIMESTAMP NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Withdrawal requests table
CREATE TABLE withdrawal_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    bank_account_id INT NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (bank_account_id) REFERENCES bank_accounts(id) ON DELETE CASCADE
);

-- Announcements table
CREATE TABLE announcements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    type ENUM('News', 'Update', 'Alert') DEFAULT 'News',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Messages table for admin-customer communication
CREATE TABLE messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    from_user_id INT NOT NULL,
    to_user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    type ENUM('General', 'System', 'Alert') DEFAULT 'General',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (from_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (to_user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Insert default admin user
INSERT INTO users (
    username, 
    email, 
    password, 
    name, 
    role, 
    balance, 
    available_balance, 
    reputation,
    invitation_code,
    credit_score
) VALUES (
    'admin', 
    'admin@supercoin.com', 
    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password: admin123
    'Administrator', 
    'admin', 
    1000000.00, 
    1000000.00, 
    100,
    '100025',
    100
);

-- Insert test customer users
INSERT INTO users (
    username, 
    email, 
    password, 
    name, 
    role, 
    balance, 
    available_balance, 
    reputation,
    invitation_code,
    credit_score
) VALUES 
(
    'sarah', 
    'sarah@example.com', 
    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password: password123
    'Sarah Johnson', 
    'customer', 
    50000.00, 
    45000.00, 
    100,
    '100026',
    100
),
(
    'john', 
    'john@example.com', 
    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password: password123
    'John Smith', 
    'customer', 
    25000.00, 
    25000.00, 
    100,
    '100027',
    100
);

-- Sample bank accounts for testing
INSERT INTO bank_accounts (user_id, account_holder_name, account_number, bank_name, ifsc_code, is_default) VALUES
(2, 'Sarah Johnson', '1234567890123456', 'State Bank of India', 'SBIN0001234', TRUE),
(3, 'John Smith', '9876543210987654', 'HDFC Bank', 'HDFC0002345', TRUE);

-- Sample announcements
INSERT INTO announcements (title, content, type) VALUES
('Welcome to SuperCoin', 'Welcome to our cryptocurrency trading platform. Start trading today!', 'News'),
('System Maintenance', 'Scheduled maintenance will be performed on Sunday 2:00-4:00 AM UTC.', 'Alert'),
('New Features Available', 'We have added new trading pairs and improved our order processing system.', 'Update');

-- Sample betting order for testing (expired)
INSERT INTO betting_orders (
    user_id, 
    order_id, 
    asset, 
    amount, 
    direction, 
    duration, 
    entry_price, 
    exit_price, 
    status, 
    result, 
    profit,
    expires_at,
    completed_at
) VALUES (
    2, 
    'ORD1737482400001', 
    'BTC/USDT', 
    1000.00, 
    'Buy Up', 
    30, 
    107314.24, 
    107500.00, 
    'completed', 
    'win', 
    200.00,
    DATE_SUB(NOW(), INTERVAL 1 HOUR),
    DATE_SUB(NOW(), INTERVAL 30 MINUTE)
);

-- Indexes for better performance
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_betting_orders_user_id ON betting_orders(user_id);
CREATE INDEX idx_betting_orders_status ON betting_orders(status);
CREATE INDEX idx_betting_orders_expires_at ON betting_orders(expires_at);
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_withdrawal_requests_user_id ON withdrawal_requests(user_id);
CREATE INDEX idx_withdrawal_requests_status ON withdrawal_requests(status);
CREATE INDEX idx_bank_accounts_user_id ON bank_accounts(user_id);
CREATE INDEX idx_messages_to_user_id ON messages(to_user_id);
CREATE INDEX idx_messages_is_read ON messages(is_read);

-- Set MySQL specific settings for better compatibility
SET sql_mode = 'STRICT_TRANS_TABLES,NO_ZERO_DATE,NO_ZERO_IN_DATE,ERROR_FOR_DIVISION_BY_ZERO';