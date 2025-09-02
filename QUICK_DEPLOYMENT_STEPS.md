# SuperCoin - Quick Deployment Steps for Hostinger

## 🚀 Fast Track Deployment (15 minutes)

### Step 1: Prepare Database (2 minutes)
1. **Login to Hostinger Control Panel**
2. **Go to: Databases → MySQL Databases**
3. **Create database:** `your_username_supercoin`
4. **Create user:** `your_username_admin` with strong password
5. **Note down:** Database name, username, password

### Step 2: Upload Files (3 minutes)
1. **Download your project files**
2. **Access File Manager in Hostinger**
3. **Navigate to public_html**
4. **Upload the entire `php/` folder**
5. **Upload your React build files to public_html root**

### Step 3: Configure Database (2 minutes)
1. **Edit `public_html/php/config/database.php`:**
```php
private $host = 'localhost';
private $db_name = 'your_username_supercoin';    // Your database name
private $username = 'your_username_admin';       // Your database user  
private $password = 'your_database_password';    // Your database password
```

### Step 4: Import Database Schema (3 minutes)
1. **Go to Databases → phpMyAdmin**
2. **Select your database**
3. **Click Import → Choose File**
4. **Upload: `php/database/schema.sql`**
5. **Click Go**

### Step 5: Set Up URL Rewriting (2 minutes)
1. **Create `.htaccess` in public_html:**
```apache
RewriteEngine On

# Handle API routes
RewriteRule ^api/(.*)$ php/index.php [QSA,L]

# Handle React routing
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteCond %{REQUEST_URI} !^/api/
RewriteRule . /index.html [L]
```

### Step 6: Set Up Cron Job (2 minutes)
1. **Go to Advanced → Cron Jobs**
2. **Add new cron job:**
   - **Minute:** `*`
   - **Hour:** `*` 
   - **Day:** `*`
   - **Month:** `*`
   - **Weekday:** `*`
   - **Command:** `/usr/bin/php /home/your_username/public_html/php/cron/process-orders.php`

### Step 7: Test Your Application (1 minute)
1. **Visit your domain:** `https://yourdomain.com`
2. **Test login:**
   - **Admin:** username: `admin`, password: `admin123`
   - **Customer:** username: `sarah`, password: `password123`

## ✅ That's it! Your app is live!

---

## File Structure After Deployment:
```
public_html/
├── index.html                 # React app
├── assets/                    # React assets
├── .htaccess                  # URL routing
└── php/
    ├── index.php             # API router
    ├── config/database.php   # Database config
    ├── api/                  # All API endpoints
    ├── includes/             # Session management
    ├── database/schema.sql   # Database schema
    └── cron/process-orders.php # Order processor
```

## 🔧 Troubleshooting:

**Can't login?** 
- Check database connection in `php/config/database.php`
- Verify schema was imported correctly

**API errors?**
- Check `.htaccess` file is uploaded
- Verify file permissions (755 for folders, 644 for files)

**Orders not completing?**
- Check cron job is set up correctly
- Test: `/usr/bin/php /path/to/process-orders.php`

## 📞 Need Help?
Check the detailed `HOSTINGER_PHP_DEPLOYMENT.md` for complete instructions and troubleshooting.

**Your SuperCoin cryptocurrency trading platform is now ready for production!** 🎉