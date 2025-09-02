# SuperCoin MySQL Database Import Instructions

## Files Available:
1. `mysql_database_backup_2025-08-05.sql` - MySQL schema (table structures)
2. `mysql_data_export.sql` - PostgreSQL data export (needs conversion)
3. `complete_database_backup_2025-08-05.sql` - Original PostgreSQL backup

## Step-by-Step Import Process:

### Method 1: Schema Only (Recommended to start)
```sql
-- Step 1: Create database
CREATE DATABASE supercoin_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE supercoin_db;

-- Step 2: Import schema
SOURCE mysql_database_backup_2025-08-05.sql;
```

### Method 2: Manual Data Entry (for key records)
After creating the schema, you can manually insert key records:

```sql
-- Admin user
INSERT INTO users (username, email, password, name, role, balance, available_balance, frozen_balance, reputation, credit_score, win_lose_setting, direction, is_banned, withdrawal_prohibited, tasks_ban, invitation_code, user_type, general_agent, remark, is_active) 
VALUES ('admin', 'admin@cryptoinvest.com', 'admin123', 'Administrator', 'admin', 9990.00, 6757.00, 0.00, 15, 100, 'To Win', 'Actual', false, false, 'Allowed', '100025', 'Agent', 'System', 'admin', true);

-- Sample customer user
INSERT INTO users (username, email, password, name, role, balance, available_balance, frozen_balance, reputation, credit_score, win_lose_setting, direction, is_banned, withdrawal_prohibited, tasks_ban, invitation_code, user_type, general_agent, is_active) 
VALUES ('sarah', 'sarah@email.com', 'password123', 'Sarah Johnson', 'customer', 306450.00, 312950.00, 500.00, 5, 100, 'To Win', 'Actual', false, false, 'Allowed', '100026', 'Normal', 'Agent001', true);
```

### Method 3: Data Conversion (Advanced)
For full data import, you'll need to convert PostgreSQL INSERT statements to MySQL format:

1. Replace `true`/`false` with `1`/`0` for boolean values
2. Convert PostgreSQL timestamp format to MySQL format
3. Handle NULL values properly
4. Remove PostgreSQL-specific syntax

### Method 4: CSV Import (Alternative)
Export data as CSV from current system and import using MySQL LOAD DATA:

```sql
LOAD DATA LOCAL INFILE 'users.csv' 
INTO TABLE users 
FIELDS TERMINATED BY ',' 
ENCLOSED BY '"' 
LINES TERMINATED BY '\n' 
IGNORE 1 ROWS;
```

## Key Database Statistics:
- **Total Users:** 246 records
- **Betting Orders:** 572 records  
- **Transactions:** 91 records
- **Total Tables:** 7 tables

## Important Notes:
1. The schema is fully compatible with MySQL 5.7+ and MariaDB 10.2+
2. All foreign key relationships are preserved
3. Indexes are included for optimal performance
4. UTF8MB4 charset supports full Unicode including emojis
5. Auto-increment IDs start from 1

## Database Configuration:
Make sure your MySQL server has these settings:
```sql
SET sql_mode = 'STRICT_TRANS_TABLES,NO_ZERO_DATE,NO_ZERO_IN_DATE,ERROR_FOR_DIVISION_BY_ZERO';
SET time_zone = '+00:00';
```

## Testing After Import:
```sql
-- Check table creation
SHOW TABLES;

-- Verify data
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM betting_orders;
SELECT COUNT(*) FROM transactions;

-- Test relationships
SELECT u.username, COUNT(bo.id) as total_orders 
FROM users u 
LEFT JOIN betting_orders bo ON u.id = bo.user_id 
GROUP BY u.id 
LIMIT 10;
```

## Troubleshooting:
- If foreign key errors occur, temporarily disable: `SET FOREIGN_KEY_CHECKS = 0;`
- For charset issues, ensure your MySQL client uses UTF8MB4
- For large data sets, increase `max_allowed_packet` setting