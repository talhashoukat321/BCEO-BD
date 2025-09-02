# SuperCoin - Deployment Guide

## Project Overview
This is a full-stack cryptocurrency investment platform built with React, Express.js, and PostgreSQL.

## Tech Stack
- **Frontend**: React + TypeScript + Vite
- **Backend**: Express.js + TypeScript
- **Database**: PostgreSQL (configured for Neon Database)
- **Styling**: Tailwind CSS + shadcn/ui components
- **State Management**: TanStack Query

## Getting Project Files

### From Replit
1. Download all files from this Replit project
2. The project structure includes:
   - `client/` - React frontend
   - `server/` - Express backend
   - `shared/` - Shared TypeScript schemas
   - Configuration files (package.json, vite.config.ts, etc.)

## Server Setup Instructions

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- npm or yarn package manager

### 1. Environment Setup
Create a `.env` file in the root directory:
```env
# Database
DATABASE_URL=postgresql://username:password@host:port/database

# Server
PORT=5000
NODE_ENV=production

# Session (generate random string)
SESSION_SECRET=your-super-secret-session-key-here
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Database Setup
```bash
# Run database migrations (if using Drizzle)
npm run db:push

# Or manually create tables using the schema in shared/schema.ts
```

### 4. Build the Application
```bash
# Build both frontend and backend
npm run build
```

### 5. Start the Server
```bash
# Production mode
npm start

# Development mode
npm run dev
```

## Database Schema
The application uses the following tables:
- `users` - User accounts and profiles
- `bank_accounts` - User payment methods
- `transactions` - Financial transaction history
- `betting_orders` - Cryptocurrency trading orders
- `withdrawal_requests` - User withdrawal requests
- `announcements` - Admin announcements

## Key Features
- **Customer Interface**: 
  - Crypto trading with Buy Up/Buy Down orders
  - Real-time balance tracking
  - Transaction history
  - Profile management
  - Betting orders tracking

- **Admin Interface**:
  - User management
  - Betting order monitoring
  - Financial oversight
  - Announcement system

## Security Notes
- Session-based authentication
- Role-based access control
- Input validation with Zod schemas
- Secure password handling

## Deployment Considerations
1. **Reverse Proxy**: Use nginx or similar for production
2. **SSL**: Configure HTTPS certificates
3. **Database**: Use managed PostgreSQL service
4. **Environment Variables**: Secure configuration management
5. **Process Manager**: Use PM2 or similar for Node.js process management

## Sample nginx Configuration
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:5000;
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

## Default Admin Account
- Username: `admin`
- Password: `admin123`
- Email: `admin@cryptoinvest.com`

## Default Customer Account  
- Username: `sarah`
- Password: `password123`
- Email: `sarah@email.com`

## Support
The application includes sample data for testing:
- Sample betting orders
- Demo crypto prices
- Test user accounts

For production use, replace sample data with real integrations.