# SuperCoin - Hostinger Deployment Guide

## Prerequisites

Before deploying to Hostinger, ensure you have:
- Hostinger hosting account with Node.js support
- PostgreSQL database access on Hostinger
- SSH access to your Hostinger server
- Domain name configured

## Step 1: Prepare Your Application for Production

### 1.1 Build the Application
```bash
npm run build
```

### 1.2 Environment Variables
Create a `.env` file with your production settings:
```
NODE_ENV=production
DATABASE_URL=postgresql://username:password@hostname:port/database_name
PORT=5000
```

## Step 2: Database Setup on Hostinger

### 2.1 Create PostgreSQL Database
1. Login to Hostinger control panel
2. Navigate to "Databases" → "PostgreSQL"
3. Create a new database
4. Note down the connection details:
   - Database name
   - Username
   - Password
   - Host
   - Port

### 2.2 Set Database URL
Update your DATABASE_URL with Hostinger's PostgreSQL credentials:
```
DATABASE_URL=postgresql://[username]:[password]@[host]:[port]/[database_name]
```

## Step 3: Upload Files to Hostinger

### 3.1 Using File Manager
1. Access Hostinger File Manager
2. Navigate to `public_html` (or your domain folder)
3. Upload all project files except:
   - `node_modules/`
   - `.git/`
   - `dist/` (will be rebuilt)

### 3.2 Using SSH/FTP
If you have SSH access:
```bash
# Connect to your server
ssh username@your-server-ip

# Navigate to your domain directory
cd public_html

# Clone or upload your project files
```

## Step 4: Install Dependencies

### 4.1 SSH Method
```bash
# Install Node.js dependencies
npm install

# Build the application
npm run build
```

### 4.2 Alternative: Upload node_modules
If npm install doesn't work, zip your local `node_modules` folder and upload it.

## Step 5: Database Migration

### 5.1 Run Database Schema
Connect to your PostgreSQL database and run the schema setup:
```bash
# If you have Drizzle CLI access
npm run db:push

# Or manually run SQL schema from shared/schema.ts
```

### 5.2 Seed Initial Data
```bash
# Run seed script if available
npm run seed
```

## Step 6: Configure Hostinger for Node.js

### 6.1 Node.js App Setup
1. In Hostinger control panel, go to "Advanced" → "Node.js"
2. Create new Node.js application:
   - **Node.js version**: 18 or 20
   - **Application root**: `/public_html` (or your domain folder)
   - **Application URL**: your domain
   - **Application startup file**: `dist/index.js`
   - **Environment**: production

### 6.2 Environment Variables
In the Node.js app settings, add:
```
NODE_ENV=production
DATABASE_URL=your_postgresql_connection_string
PORT=5000
```

### 6.3 Package.json Scripts
Ensure your package.json has:
```json
{
  "scripts": {
    "start": "node dist/index.js",
    "build": "npm run build:server && npm run build:client",
    "build:server": "esbuild server/index.ts --bundle --platform=node --outfile=dist/index.js --external:pg --external:express",
    "build:client": "vite build"
  }
}
```

## Step 7: File Structure on Server

Your Hostinger server should have:
```
public_html/
├── dist/
│   ├── index.js (server build)
│   └── public/ (client build)
├── server/
├── client/
├── shared/
├── package.json
├── .env
└── node_modules/
```

## Step 8: Start the Application

### 8.1 Using Hostinger Control Panel
1. Go to Node.js section
2. Click "Start" on your application
3. Check the status and logs

### 8.2 Using SSH
```bash
# Start the application
npm start

# Or use PM2 for process management
npm install -g pm2
pm2 start dist/index.js --name "supercoin"
pm2 startup
pm2 save
```

## Step 9: Domain Configuration

### 9.1 Set Up Domain
1. In Hostinger control panel, go to "Domains"
2. Point your domain to the Node.js application
3. Ensure the application is accessible via your domain

### 9.2 SSL Certificate
1. Enable SSL certificate in Hostinger control panel
2. Force HTTPS redirects

## Step 10: Testing and Monitoring

### 10.1 Test Application
1. Visit your domain
2. Test login functionality (admin/admin123, sarah/password123, john/password123)
3. Test order placement and completion
4. Verify admin panel functionality

### 10.2 Monitor Logs
Check application logs in Hostinger Node.js panel or via SSH:
```bash
# View application logs
pm2 logs supercoin

# Or check Node.js logs in Hostinger panel
```

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Verify DATABASE_URL is correct
   - Check PostgreSQL service is running
   - Ensure database exists and user has permissions

2. **Static Files Not Loading**
   - Check if `dist/public` folder exists after build
   - Verify file permissions
   - Check Express static file serving configuration

3. **Application Won't Start**
   - Check Node.js version compatibility
   - Verify all dependencies are installed
   - Check for missing environment variables

4. **Port Issues**
   - Hostinger may require specific ports
   - Use PORT environment variable
   - Check firewall settings

### Performance Optimization

1. **Enable Compression**
   ```javascript
   // In server/index.ts
   import compression from 'compression';
   app.use(compression());
   ```

2. **Set Up Caching**
   ```javascript
   // Cache static assets
   app.use(express.static('dist/public', {
     maxAge: '1d'
   }));
   ```

3. **Database Connection Pooling**
   - Already configured in your application
   - Monitor connection pool usage

## Security Considerations

1. **Environment Variables**
   - Never commit .env file to repository
   - Use strong database passwords
   - Secure your DATABASE_URL

2. **HTTPS**
   - Always use SSL certificates
   - Force HTTPS redirects

3. **Database Security**
   - Use restricted database users
   - Enable PostgreSQL security features
   - Regular backups

## Backup Strategy

1. **Database Backups**
   ```bash
   # Create database backup
   pg_dump $DATABASE_URL > backup.sql
   ```

2. **File Backups**
   - Regular backups of uploaded files
   - Version control for code changes

## Support

If you encounter issues:
1. Check Hostinger documentation for Node.js hosting
2. Contact Hostinger support for server-specific issues
3. Check application logs for debugging information

---

**Note**: This guide assumes Hostinger supports Node.js hosting. If your plan doesn't include Node.js, you may need to upgrade your hosting plan or consider alternative deployment methods.