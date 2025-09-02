# SuperCoin PHP Deployment Guide for Hostinger Shared Hosting

## Overview
This guide will help you deploy your SuperCoin application on Hostinger shared hosting using PHP and MySQL instead of Node.js and PostgreSQL.

## Prerequisites
- Hostinger shared hosting account
- Access to MySQL databases
- File Manager or FTP access
- Your domain configured with Hostinger

## Step 1: Create MySQL Database

1. **Login to Hostinger Control Panel**
2. **Navigate to Databases → MySQL**
3. **Create a new database:**
   - Database name: `your_username_supercoin`
   - Database user: `your_username_admin`
   - Password: Create a strong password
   - Note down these credentials

## Step 2: Upload PHP Files

### Method A: Using File Manager
1. **Access Hostinger File Manager**
2. **Navigate to public_html**
3. **Create folder structure:**
   ```
   public_html/
   ├── php/
   │   ├── api/
   │   ├── config/
   │   ├── includes/
   │   ├── database/
   │   └── cron/
   └── (your React build files)
   ```
4. **Upload all PHP files** from the `php/` directory you created

### Method B: Using FTP
```bash
# Upload via FTP client (FileZilla, etc.)
# Upload the entire php/ directory to public_html/php/
```

## Step 3: Configure Database Connection

1. **Edit `php/config/database.php`:**
```php
<?php
class Database {
    private $host = 'localhost';  // Usually localhost for Hostinger
    private $db_name = 'your_username_supercoin';  // Your database name
    private $username = 'your_username_admin';     // Your database user
    private $password = 'your_database_password';  // Your database password
    
    // ... rest of the file remains the same
}
?>
```

## Step 4: Set Up Database Schema

1. **Access phpMyAdmin** from Hostinger control panel
2. **Select your database**
3. **Import the schema:**
   - Click "Import" tab
   - Upload `php/database/schema.sql`
   - Click "Go"

**OR manually run the SQL:**
1. Click "SQL" tab
2. Copy and paste the contents of `schema.sql`
3. Click "Go"

## Step 5: Build and Upload Frontend

### Option A: Build locally and upload
```bash
# On your local machine
npm run build

# Upload the contents of dist/ to public_html/
# Your files should be:
# public_html/index.html
# public_html/assets/
# public_html/php/
```

### Option B: Use existing React build
1. Copy your built React files to `public_html/`
2. Ensure `index.html` is in the root

## Step 6: Configure API Routes

1. **Create `.htaccess` in public_html:**
```apache
RewriteEngine On

# Handle API routes
RewriteRule ^api/(.*)$ php/index.php [QSA,L]

# Handle React routing (fallback to index.html)
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteCond %{REQUEST_URI} !^/api/
RewriteRule . /index.html [L]
```

## Step 7: Set Up Cron Job for Order Processing

1. **Access Cron Jobs** in Hostinger control panel
2. **Add new cron job:**
   - Command: `/usr/bin/php /home/your_username/public_html/php/cron/process-orders.php`
   - Schedule: `* * * * *` (every minute)

**OR using cPanel:**
```bash
# Minute Hour Day Month Weekday Command
* * * * * /usr/bin/php /home/your_username/public_html/php/cron/process-orders.php
```

## Step 8: Update Frontend API Configuration

1. **Update your React app's API base URL:**
```javascript
// In your frontend code, change API calls from:
const API_BASE = 'http://localhost:5000/api'

// To:
const API_BASE = '/api'  // For production
```

2. **Update client/src/lib/queryClient.ts:**
```typescript
// Change the base URL to work with PHP API
const API_BASE = '/api';
```

## Step 9: Test the Application

1. **Visit your domain:** `https://yourdomain.com`
2. **Test login with default accounts:**
   - Admin: `admin` / `admin123`
   - Customer: `sarah` / `password123`
   - Customer: `john` / `password123`

3. **Test core functionality:**
   - User registration
   - Order placement
   - Admin panel
   - Balance updates

## Step 10: File Permissions

Set correct permissions via File Manager or FTP:
```bash
# If you have SSH access
chmod 755 public_html/php/
chmod -R 644 public_html/php/*.php
chmod 755 public_html/php/cron/
chmod 644 public_html/php/cron/*.php
```

## Directory Structure After Deployment

```
public_html/
├── index.html                    # React app entry point
├── assets/                       # React build assets
├── .htaccess                     # URL rewriting rules
└── php/
    ├── index.php                 # API router
    ├── config/
    │   └── database.php         # Database configuration
    ├── includes/
    │   └── session.php          # Session management
    ├── api/
    │   ├── auth/               # Authentication endpoints
    │   ├── betting-orders/     # Trading endpoints
    │   ├── users/              # User management
    │   ├── crypto/             # Price data
    │   ├── transactions/       # Financial transactions
    │   └── bank-accounts/      # Bank account management
    ├── database/
    │   └── schema.sql          # Database schema
    └── cron/
        └── process-orders.php  # Order processing script
```

## Troubleshooting

### Common Issues:

1. **Database Connection Error:**
   ```
   Check php/config/database.php credentials
   Ensure MySQL service is running
   Verify database exists in phpMyAdmin
   ```

2. **API 404 Errors:**
   ```
   Check .htaccess file is uploaded
   Verify mod_rewrite is enabled (usually is on Hostinger)
   Check file paths in php/index.php
   ```

3. **Cron Job Not Working:**
   ```
   Check cron job path is correct
   Verify PHP path: /usr/bin/php
   Check file permissions
   Test script manually: /usr/bin/php /path/to/process-orders.php
   ```

4. **CORS Issues:**
   ```php
   // Add to php/includes/session.php if needed:
   header('Access-Control-Allow-Origin: *');
   header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
   header('Access-Control-Allow-Headers: Content-Type, Authorization');
   ```

## Performance Optimization

1. **Enable PHP OpCache** (usually enabled by default)
2. **Use MySQL query optimization**
3. **Enable gzip compression** in .htaccess:
```apache
# Add to .htaccess
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/plain
    AddOutputFilterByType DEFLATE text/html
    AddOutputFilterByType DEFLATE text/xml
    AddOutputFilterByType DEFLATE text/css
    AddOutputFilterByType DEFLATE application/xml
    AddOutputFilterByType DEFLATE application/xhtml+xml
    AddOutputFilterByType DEFLATE application/rss+xml
    AddOutputFilterByType DEFLATE application/javascript
    AddOutputFilterByType DEFLATE application/x-javascript
</IfModule>
```

## Security Considerations

1. **Database Security:**
   - Use strong database passwords
   - Don't expose database credentials in public files
   - Regular database backups

2. **File Security:**
   - Secure file permissions
   - Don't expose sensitive configuration files
   - Use HTTPS (SSL certificate)

3. **Session Security:**
   - Sessions are handled securely in PHP
   - Consider adding CSRF protection for production

## Backup Strategy

1. **Database Backup:**
   - Use Hostinger's automatic backups
   - Manual exports via phpMyAdmin
   - Regular SQL dumps

2. **File Backup:**
   - Download via File Manager
   - FTP backups
   - Version control (Git)

## Support Resources

- **Hostinger Documentation:** https://support.hostinger.com
- **PHP Documentation:** https://php.net/docs.php
- **MySQL Documentation:** https://dev.mysql.com/doc/

## Migration Notes

The PHP version maintains 100% feature parity with the Node.js version:
- ✅ User authentication and session management
- ✅ Real-time crypto price fetching
- ✅ Trading order placement and processing
- ✅ Admin panel functionality
- ✅ Balance management and calculations
- ✅ Direction-based profit calculations
- ✅ Bank account management
- ✅ Transaction history
- ✅ Automated order completion

Your SuperCoin application is now ready for production on Hostinger shared hosting!