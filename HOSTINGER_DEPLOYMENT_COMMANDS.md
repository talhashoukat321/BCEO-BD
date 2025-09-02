# SuperCoin Hostinger Deployment Commands

This guide provides step-by-step commands to deploy SuperCoin on Hostinger hosting.

## Prerequisites

1. **Hostinger Account**: With Node.js hosting plan
2. **Database**: PostgreSQL database (you can use your existing Neon database)
3. **Domain**: Your domain connected to Hostinger
4. **SSH Access**: To your Hostinger server

## Step 1: Access Your Hostinger Server

```bash
# SSH into your Hostinger server
ssh your_username@your_server_ip
```

## Step 2: Prepare the Server Environment

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Node.js (if not already installed)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 for process management
sudo npm install -g pm2

# Create application directory
mkdir -p /var/www/supercoin
cd /var/www/supercoin
```

## Step 3: Upload Your Application Files

### Option A: Using Git (Recommended)
```bash
# If you have your code in a Git repository
git clone https://github.com/your-username/supercoin.git .

# Or upload your files using SCP from your local machine
# scp -r /path/to/your/supercoin/* your_username@your_server_ip:/var/www/supercoin/
```

### Option B: Using File Manager
1. Upload all your project files to `/var/www/supercoin/` using Hostinger's file manager
2. Make sure all files are in the root directory

## Step 4: Install Dependencies

```bash
# Navigate to your project directory
cd /var/www/supercoin

# Install all dependencies
npm install

# Install production dependencies
npm install --production
```

## Step 5: Configure Environment Variables

```bash
# Create environment file
nano .env

# Add the following configuration:
```

```env
# Database Configuration
DATABASE_URL=your_postgresql_connection_string

# Server Configuration
NODE_ENV=production
PORT=3000

# Session Configuration
SESSION_SECRET=your_secure_session_secret_here

# Additional PostgreSQL variables (if needed)
PGHOST=your_postgres_host
PGPORT=5432
PGUSER=your_postgres_user
PGPASSWORD=your_postgres_password
PGDATABASE=your_database_name
```

## Step 6: Build the Application

```bash
# Build the frontend
npm run build

# Verify build was successful
ls -la dist/
```

## Step 7: Database Setup

```bash
# Push database schema (if using Drizzle)
npm run db:push

# Or if you have a seed script
npm run seed
```

## Step 8: Configure PM2 for Production

```bash
# Create PM2 ecosystem file
nano ecosystem.config.js
```

```javascript
module.exports = {
  apps: [{
    name: 'supercoin',
    script: 'dist/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
```

```bash
# Create logs directory
mkdir -p logs

# Start application with PM2
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

## Step 9: Configure Nginx (Web Server)

```bash
# Install Nginx if not already installed
sudo apt install nginx -y

# Create Nginx configuration
sudo nano /etc/nginx/sites-available/supercoin
```

```nginx
server {
    listen 80;
    server_name your_domain.com www.your_domain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/supercoin /etc/nginx/sites-enabled/

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

## Step 10: Setup SSL Certificate (Optional but Recommended)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate
sudo certbot --nginx -d your_domain.com -d www.your_domain.com

# Verify auto-renewal
sudo crontab -l | grep certbot
```

## Step 11: Configure Firewall

```bash
# Allow HTTP and HTTPS
sudo ufw allow 'Nginx Full'
sudo ufw allow ssh
sudo ufw enable
```

## Step 12: Verify Deployment

```bash
# Check PM2 processes
pm2 status

# Check application logs
pm2 logs supercoin

# Check if the app is running
curl http://localhost:3000

# Check Nginx status
sudo systemctl status nginx
```

## Step 13: Set Up Monitoring and Backups

```bash
# Install PM2 monitoring
pm2 install pm2-logrotate

# Create backup script
nano backup.sh
```

```bash
#!/bin/bash
# Backup script
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/supercoin"
mkdir -p $BACKUP_DIR

# Backup database
pg_dump $DATABASE_URL > $BACKUP_DIR/db_backup_$DATE.sql

# Backup application files
tar -czf $BACKUP_DIR/app_backup_$DATE.tar.gz /var/www/supercoin

# Keep only last 7 days of backups
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
```

```bash
# Make backup script executable
chmod +x backup.sh

# Add to crontab for daily backups
crontab -e
# Add this line: 0 2 * * * /var/www/supercoin/backup.sh
```

## Useful Commands for Maintenance

```bash
# Restart the application
pm2 restart supercoin

# Update the application
git pull origin main
npm install
npm run build
pm2 restart supercoin

# View logs
pm2 logs supercoin
tail -f logs/combined.log

# Check server resources
pm2 monit
htop

# Check database connection
psql $DATABASE_URL
```

## Troubleshooting

### Common Issues:

1. **Port already in use**:
   ```bash
   sudo lsof -i :3000
   pm2 kill
   pm2 start ecosystem.config.js --env production
   ```

2. **Database connection issues**:
   ```bash
   # Test database connection
   psql $DATABASE_URL -c "SELECT NOW();"
   ```

3. **Permission issues**:
   ```bash
   sudo chown -R $USER:$USER /var/www/supercoin
   chmod -R 755 /var/www/supercoin
   ```

4. **Nginx not serving**:
   ```bash
   sudo nginx -t
   sudo systemctl reload nginx
   ```

## Environment Variables Required

Make sure these are set in your `.env` file:

```env
DATABASE_URL=your_postgresql_connection_string
NODE_ENV=production
PORT=3000
SESSION_SECRET=your_secure_random_string
PGHOST=your_postgres_host
PGPORT=5432
PGUSER=your_postgres_user
PGPASSWORD=your_postgres_password
PGDATABASE=your_database_name
```

## Final Verification

1. Visit your domain: `http://your_domain.com`
2. Test login functionality
3. Test all features (trading, admin panel, etc.)
4. Monitor logs for any errors
5. Check PM2 dashboard: `pm2 monit`

Your SuperCoin application should now be successfully deployed on Hostinger!