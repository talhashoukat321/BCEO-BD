# SuperCoin PHP Backend

A complete PHP backend for the SuperCoin cryptocurrency investment platform, converted from the original TypeScript/Node.js version.

## Features

- **Authentication System**: Session-based authentication with secure login/logout
- **User Management**: Complete user registration, profile management, and admin controls
- **Banking System**: Bank account management with CRUD operations
- **Trading System**: Cryptocurrency trading orders with real-time processing
- **Withdrawal System**: Secure withdrawal requests with admin approval workflow
- **Transaction History**: Complete transaction tracking and reporting
- **Real-time Crypto Prices**: Integration with CoinGecko API for live price data
- **Admin Panel**: Comprehensive admin interface for platform management

## Technical Stack

- **Backend**: PHP 8.0+ with PDO for database operations
- **Database**: PostgreSQL with Neon Database hosting
- **Authentication**: Session-based with secure cookie handling
- **API**: RESTful API endpoints with JSON responses
- **Frontend**: Compatible with existing React frontend

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd supercoin-php
   ```

2. **Install dependencies**
   ```bash
   composer install
   ```

3. **Configure database**
   - Update database credentials in `config/database.php`
   - Ensure PostgreSQL connection is properly configured

4. **Set up web server**
   - For Apache: Ensure mod_rewrite is enabled
   - For Nginx: Configure URL rewriting for API routes
   - For development: Use PHP built-in server
     ```bash
     php -S localhost:5000 index.php
     ```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user
- `POST /api/auth/register` - User registration

### User Management
- `GET /api/users` - Get all users (admin only)
- `POST /api/users` - Create user (admin only)
- `PATCH /api/users/{id}` - Update user (admin only)
- `DELETE /api/users/{id}` - Delete user (admin only)
- `PATCH /api/profile` - Update profile (customer)

### Banking
- `GET /api/bank-accounts` - Get bank accounts
- `POST /api/bank-accounts` - Create bank account
- `PATCH /api/bank-accounts/{id}` - Update bank account
- `DELETE /api/bank-accounts/{id}` - Delete bank account

### Trading
- `GET /api/betting-orders` - Get betting orders
- `POST /api/betting-orders` - Create betting order
- `PATCH /api/betting-orders/{id}` - Update betting order
- `GET /api/betting-orders/active` - Get active orders

### Withdrawals
- `GET /api/withdrawal-requests` - Get withdrawal requests
- `POST /api/withdrawal-requests` - Create withdrawal request
- `PATCH /api/withdrawal-requests/{id}` - Update withdrawal request

### Crypto Prices
- `GET /api/crypto-prices` - Get real-time cryptocurrency prices

## Database Schema

The PHP backend uses the same PostgreSQL database schema as the original TypeScript version:

- `users` - User accounts and profiles
- `bank_accounts` - User banking information
- `transactions` - Transaction history
- `betting_orders` - Trading orders
- `withdrawal_requests` - Withdrawal requests
- `announcements` - System announcements

## Security Features

- **Session Management**: Secure session handling with proper expiration
- **Input Validation**: Comprehensive input validation and sanitization
- **SQL Injection Protection**: Prepared statements with PDO
- **CORS Configuration**: Proper CORS headers for frontend integration
- **Authentication Middleware**: Route-level authentication and authorization
- **Password Security**: Secure password handling (can be enhanced with hashing)

## Configuration

### Database Configuration
Edit `config/database.php` to update database connection settings:

```php
private $host = 'your-database-host';
private $database = 'your-database-name';
private $username = 'your-username';
private $password = 'your-password';
```

### Environment Variables
For production deployment, consider using environment variables:

```php
$this->host = $_ENV['DB_HOST'] ?? 'localhost';
$this->database = $_ENV['DB_NAME'] ?? 'supercoin';
$this->username = $_ENV['DB_USER'] ?? 'user';
$this->password = $_ENV['DB_PASS'] ?? 'password';
```

## Testing

Test the API endpoints using curl or any HTTP client:

```bash
# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Get user profile
curl -X GET http://localhost:5000/api/auth/me \
  -H "X-Session-ID: your-session-id"

# Get crypto prices
curl -X GET http://localhost:5000/api/crypto-prices
```

## Deployment

### Apache/Nginx Deployment
1. Upload files to web server
2. Configure virtual host
3. Set proper file permissions
4. Ensure mod_rewrite (Apache) or URL rewriting (Nginx) is enabled

### PHP Built-in Server (Development)
```bash
php -S 0.0.0.0:5000 index.php
```

## Frontend Integration

The PHP backend is fully compatible with the existing React frontend. No changes are required to the frontend code as all API endpoints maintain the same interface and response format.

## Migration from TypeScript

This PHP backend provides 100% feature parity with the original TypeScript/Node.js version:

- All API endpoints preserved
- Same response formats
- Identical authentication flow
- Compatible with existing frontend
- Same database schema
- All business logic maintained

## License

This project is licensed under the MIT License.