import type { Express } from "express";
import { createServer, type Server } from "http";
import { DatabaseStorage } from "./db-storage";

const storage = new DatabaseStorage();
import { insertUserSchema, insertBankAccountSchema, insertTransactionSchema, insertBettingOrderSchema, insertWithdrawalRequestSchema, insertAnnouncementSchema } from "@shared/schema";

function generateSessionId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// Database-persistent session validation
async function getSessionUserId(req: any): Promise<number | null> {
  const sessionId = req.headers['x-session-id'] || req.cookies?.sessionId;
  if (!sessionId) return null;
  
  const session = await storage.getSession(sessionId);
  if (!session) {
    console.log(`Session ${sessionId} not found in database`);
    return null;
  }
  
  if (session.expiresAt < new Date()) {
    console.log(`Session ${sessionId} expired`);
    await storage.deleteSession(sessionId);
    return null;
  }
  
  return session.userId;
}

async function createSession(userId: number): Promise<string> {
  const sessionId = generateSessionId();
  const expiresAt = new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)); // 30 days
  
  await storage.createSession({
    id: sessionId,
    userId,
    expiresAt
  });
  
  console.log(`Created session ${sessionId} for user ${userId}`);
  return sessionId;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication middleware
  const authenticateUser = async (req: any, res: any, next: any) => {
    const userId = await getSessionUserId(req);
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    (req as any).userId = userId;
    next();
  };

  const requireAdmin = async (req: any, res: any, next: any) => {
    const userId = await getSessionUserId(req);
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const user = await storage.getUser(userId);
    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }
    (req as any).userId = userId;
    next();
  };

  // Auth routes
  // Check username availability endpoint
  app.get("/api/auth/check-username", async (req, res) => {
    try {
      const { username } = req.query;
      
      if (!username || typeof username !== 'string') {
        return res.status(400).json({ message: "Username is required" });
      }

      // Check if username already exists
      const existingUser = await storage.getUserByUsername(username);
      
      res.json({ 
        available: !existingUser,
        message: existingUser ? "Username already exists" : "Username is available"
      });
    } catch (error) {
      console.error("Username check error:", error);
      res.status(500).json({ message: "Failed to check username availability" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      const user = await storage.getUserByUsername(username);
      
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Check if account is banned
      if (user.isBanned) {
        return res.status(403).json({ message: "Account has been suspended. Please contact support." });
      }

      const sessionId = await createSession(user.id);
      res.cookie('sessionId', sessionId, { 
        httpOnly: true, 
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        sameSite: 'lax',
        secure: false // Allow HTTP for development
      });
      
      const { password: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword, sessionId });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      const result = insertUserSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid user data", errors: result.error.errors });
      }

      const { username, email } = result.data;
      
      // Check if user already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const existingEmail = await storage.getUserByEmail(email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }

      const user = await storage.createUser({
        ...result.data,
        role: "customer"
      });

      const { password: _, ...userWithoutPassword } = user;
      res.status(201).json({ user: userWithoutPassword, message: "Registration successful" });
    } catch (error) {
      res.status(500).json({ message: "Registration failed" });
    }
  });

  app.post("/api/auth/logout", async (req, res) => {
    const sessionId = req.headers['x-session-id'] || req.cookies?.sessionId;
    if (sessionId) {
      await storage.deleteSession(sessionId);
    }
    res.clearCookie('sessionId');
    res.json({ message: "Logged out successfully" });
  });

  app.get("/api/auth/me", async (req, res) => {
    try {
      const userId = getSessionUserId(req);
      if (!userId) {
        // Clear any existing cookie if session is invalid
        res.clearCookie('sessionId');
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        // Clear session if user no longer exists
        const sessionId = req.headers['x-session-id'] || req.cookies?.sessionId;
        if (sessionId) {
          await storage.deleteSession(sessionId);
        }
        res.clearCookie('sessionId');
        return res.status(404).json({ message: "User not found" });
      }
      
      const { password: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error) {
      console.error("Auth me error:", error);
      res.status(500).json({ message: "Failed to get user" });
    }
  });

  // User management routes
  app.get("/api/users", authenticateUser, requireAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      const usersWithoutPasswords = users.map(({ password, ...user }) => user);
      res.json(usersWithoutPasswords);
    } catch (error) {
      res.status(500).json({ message: "Failed to get users" });
    }
  });

  app.patch("/api/users/:id", authenticateUser, requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      
      const updatedUser = await storage.updateUser(id, updates);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const { password: _, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.delete("/api/users/:id", authenticateUser, requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      const deleted = await storage.deleteUser(id);
      if (!deleted) {
        return res.status(404).json({ message: "User not found or cannot delete admin user" });
      }
      
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // Admin create user endpoint
  app.post("/api/users", requireAdmin, async (req, res) => {
    try {
      const result = insertUserSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid user data", errors: result.error.errors });
      }

      const { username, email } = result.data;
      
      // Check if user already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const existingEmail = await storage.getUserByEmail(email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }

      // Create user with reputation defaulting to 100 for new members
      const user = await storage.createUser({
        ...result.data,
        reputation: result.data.reputation || 100, // Default VIP Level to 100
        role: result.data.role || "customer"
      });

      const { password: _, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  // Customer profile update endpoint
  app.patch("/api/profile", authenticateUser, async (req, res) => {
    try {
      const userId = getSessionUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const updates = req.body;
      
      // Convert empty strings to null for signature fields
      if (updates.signatureData === "") {
        updates.signatureData = null;
      }
      if (updates.signatureName === "") {
        updates.signatureName = null;
      }
      
      const updatedUser = await storage.updateUser(userId, updates);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const { password: _, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Customer recharge endpoint - allows customer to update their own balance
  app.patch("/api/recharge", authenticateUser, async (req, res) => {
    try {
      const userId = getSessionUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { balance, availableBalance } = req.body;
      
      const updatedUser = await storage.updateUser(userId, { 
        balance, 
        availableBalance 
      });
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const { password: _, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Failed to update balance" });
    }
  });

  // Admin create bank account for any user
  app.post("/api/admin/bank-accounts", authenticateUser, requireAdmin, async (req, res) => {
    try {
      console.log("==== ADMIN BANK ACCOUNT CREATE START ====");
      console.log("Request body:", req.body);
      
      // Manual validation for required fields
      const requiredFields = ['userId', 'accountHolderName', 'accountNumber', 'bankName'];
      for (const field of requiredFields) {
        if (!req.body[field] || req.body[field].toString().trim() === '') {
          console.log(`Missing required field: ${field}`);
          return res.status(400).json({ message: `${field} is required` });
        }
      }
      
      const bankAccountData = {
        userId: parseInt(req.body.userId),
        bindingType: req.body.bindingType || 'Bank Card',
        currency: req.body.currency || 'INR',
        accountHolderName: req.body.accountHolderName,
        accountNumber: req.body.accountNumber,
        bankName: req.body.bankName,
        branchName: req.body.branchName || null,
        ifscCode: req.body.ifscCode || null,
        isDefault: false
      };
      
      console.log("Validated admin bank account data:", bankAccountData);
      const bankAccount = await storage.createBankAccount(bankAccountData);
      console.log("Created admin bank account:", bankAccount);
      
      res.json(bankAccount);
    } catch (error) {
      console.error("Admin bank account creation error:", error);
      res.status(400).json({ message: "Invalid bank account data" });
    }
  });

  // Admin update bank account for any user
  app.patch("/api/admin/bank-accounts/:id", authenticateUser, requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid bank account ID" });
      }
      
      // Admin can update any bank account, no ownership check needed
      const existingAccount = await storage.getBankAccount(id);
      if (!existingAccount) {
        return res.status(404).json({ message: "Bank account not found" });
      }
      
      const validatedData = insertBankAccountSchema.partial().parse(req.body);
      const updatedAccount = await storage.updateBankAccount(id, validatedData);
      
      if (!updatedAccount) {
        return res.status(404).json({ message: "Bank account not found" });
      }
      
      res.json(updatedAccount);
    } catch (error) {
      console.error("Admin bank account update error:", error);
      res.status(400).json({ message: "Invalid bank account data" });
    }
  });

  // Bank account routes
  app.get("/api/bank-accounts", authenticateUser, async (req, res) => {
    try {
      const user = await storage.getUser((req as any).userId);
      let bankAccounts;
      
      if (user?.role === "admin") {
        // For admin, get all bank accounts
        const allUsers = await storage.getAllUsers();
        bankAccounts = [];
        for (const user of allUsers) {
          const userAccounts = await storage.getBankAccountsByUserId(user.id);
          bankAccounts.push(...userAccounts);
        }
      } else {
        bankAccounts = await storage.getBankAccountsByUserId((req as any).userId);
      }
      
      res.json(bankAccounts);
    } catch (error) {
      res.status(500).json({ message: "Failed to get bank accounts" });
    }
  });

  app.get("/api/bank-accounts-with-users", authenticateUser, requireAdmin, async (req, res) => {
    try {
      const accountsWithUsers = await storage.getAllBankAccountsWithUsers();
      res.json(accountsWithUsers);
    } catch (error) {
      res.status(500).json({ message: "Failed to get bank accounts with users" });
    }
  });

  app.post("/api/bank-accounts", authenticateUser, async (req, res) => {
    try {
      console.log("==== BANK ACCOUNT CREATE START ====");
      console.log("Request body:", req.body);
      
      // Manual validation for required fields only
      const requiredFields = ['accountHolderName', 'accountNumber', 'bankName'];
      for (const field of requiredFields) {
        if (!req.body[field] || req.body[field].trim() === '') {
          console.log(`Missing required field: ${field}`);
          return res.status(400).json({ message: `${field} is required` });
        }
      }
      
      const bankAccountData = {
        userId: (req as any).userId,
        bindingType: req.body.bindingType || 'Bank Card',
        currency: req.body.currency || 'INR',
        accountHolderName: req.body.accountHolderName,
        accountNumber: req.body.accountNumber,
        bankName: req.body.bankName,
        branchName: req.body.branchName || null,
        ifscCode: req.body.ifscCode || null,
        isDefault: false
      };
      
      console.log("Validated bank account data:", bankAccountData);
      const bankAccount = await storage.createBankAccount(bankAccountData);
      console.log("Created bank account:", bankAccount);
      
      res.json(bankAccount);
    } catch (error) {
      console.error("Bank account creation error:", error);
      res.status(400).json({ message: "Invalid bank account data" });
    }
  });

  app.patch("/api/bank-accounts/:id", authenticateUser, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = (req as any).userId;
      
      // First check if the bank account belongs to the user
      const existingAccount = await storage.getBankAccount(id);
      if (!existingAccount || existingAccount.userId !== userId) {
        return res.status(404).json({ message: "Bank account not found" });
      }
      
      const validatedData = insertBankAccountSchema.partial().parse(req.body);
      const updatedAccount = await storage.updateBankAccount(id, validatedData);
      
      if (!updatedAccount) {
        return res.status(404).json({ message: "Bank account not found" });
      }
      
      res.json(updatedAccount);
    } catch (error) {
      res.status(400).json({ message: "Invalid bank account data" });
    }
  });

  app.delete("/api/bank-accounts/:id", authenticateUser, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = (req as any).userId;
      
      // First check if the bank account belongs to the user
      const existingAccount = await storage.getBankAccount(id);
      if (!existingAccount || existingAccount.userId !== userId) {
        return res.status(404).json({ message: "Bank account not found" });
      }
      
      const deleted = await storage.deleteBankAccount(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Bank account not found" });
      }
      
      res.json({ message: "Bank account deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete bank account" });
    }
  });

  // Transaction routes
  app.get("/api/transactions", authenticateUser, async (req, res) => {
    try {
      const user = await storage.getUser((req as any).userId);
      let transactions;
      
      if (user?.role === "admin") {
        transactions = await storage.getAllTransactions();
      } else {
        transactions = await storage.getTransactionsByUserId((req as any).userId);
      }
      
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ message: "Failed to get transactions" });
    }
  });

  app.post("/api/transactions", authenticateUser, async (req, res) => {
    try {
      console.log("==== TRANSACTION START ====");
      console.log("Transaction data:", req.body);
      
      const validatedData = insertTransactionSchema.parse(req.body);
      const transaction = await storage.createTransaction(validatedData);
      console.log("Created transaction:", transaction);
      
      // Update user balance only for completed transactions
      if (transaction.status === "completed") {
        const user = await storage.getUser(validatedData.userId);
        console.log("User before transaction update:", user);
        
        if (user) {
        const amount = parseFloat(validatedData.amount);
        let balanceUpdate = {};
        
        switch (validatedData.type) {
          case "deposit":
            balanceUpdate = {
              balance: (parseFloat(user.balance) + amount).toFixed(2),
              availableBalance: (parseFloat(user.availableBalance) + amount).toFixed(2),
            };
            break;
          case "withdrawal":
            balanceUpdate = {
              balance: (parseFloat(user.balance) - amount).toFixed(2),
              availableBalance: (parseFloat(user.availableBalance) - amount).toFixed(2),
            };
            break;
          case "freeze":
            balanceUpdate = {
              availableBalance: (parseFloat(user.availableBalance) - amount).toFixed(2),
              frozenBalance: (parseFloat(user.frozenBalance) + amount).toFixed(2),
            };
            break;
          case "unfreeze":
            balanceUpdate = {
              availableBalance: (parseFloat(user.availableBalance) + amount).toFixed(2),
              frozenBalance: (parseFloat(user.frozenBalance) - amount).toFixed(2),
            };
            break;
        }
        
        console.log("Balance update object:", balanceUpdate);
        const updatedUser = await storage.updateUser(validatedData.userId, balanceUpdate);
        console.log("Updated user after transaction:", updatedUser);
        }
      }
      
      res.json(transaction);
    } catch (error) {
      res.status(400).json({ message: "Invalid transaction data" });
    }
  });

  // Profile image update route
  app.post("/api/user/profile-image", authenticateUser, async (req, res) => {
    try {
      const { profileImage } = req.body;
      
      if (!profileImage) {
        return res.status(400).json({ message: "Profile image is required" });
      }
      
      const updatedUser = await storage.updateUser((req as any).userId, { profileImage });
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({ message: "Profile image updated successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to update profile image" });
    }
  });

  // Transaction update route for admin approval
  app.patch("/api/transactions/:id", authenticateUser, async (req, res) => {
    try {
      const transactionId = parseInt(req.params.id);
      const updates = req.body;
      
      const transaction = await storage.updateTransaction(transactionId, updates);
      
      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      
      // If transaction is being approved (completed), update user balance
      if (updates.status === "completed" && transaction.type === "deposit") {
        const user = await storage.getUser(transaction.userId);
        if (user) {
          const amount = parseFloat(transaction.amount);
          const balanceUpdate = {
            balance: (parseFloat(user.balance) + amount).toFixed(2),
            availableBalance: (parseFloat(user.availableBalance) + amount).toFixed(2),
          };
          await storage.updateUser(transaction.userId, balanceUpdate);
        }
      }
      
      res.json(transaction);
    } catch (error) {
      res.status(500).json({ message: "Failed to update transaction" });
    }
  });

  // Update transaction with additional details (like transaction number)
  app.patch("/api/transactions/:id/details", authenticateUser, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { transactionNo, rechargeInfo } = req.body;
      
      // Find the transaction and verify it belongs to the user
      const transaction = await storage.getAllTransactions();
      const userTransaction = transaction.find(t => t.id === id && t.userId === (req as any).userId);
      
      if (!userTransaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      
      // Remove any existing Transaction No and Info from description, then add new ones
      let baseDescription = userTransaction.description || '';
      
      // Remove existing Transaction No and Info if they exist (handle multiple formats)
      if (baseDescription.includes('Transaction No:')) {
        baseDescription = baseDescription.split('Transaction No:')[0].replace(/\s*\|\s*$/, '');
      }
      
      // Create new description with updated details
      const updatedDescription = `${baseDescription} | Transaction No: ${transactionNo}${rechargeInfo ? ` | Info: ${rechargeInfo}` : ''}`;
      
      const updatedTransaction = await storage.updateTransaction(id, {
        description: updatedDescription
      });
      
      if (!updatedTransaction) {
        return res.status(404).json({ message: "Failed to update transaction" });
      }
      
      res.json(updatedTransaction);
    } catch (error) {
      console.error("Transaction update error:", error);
      res.status(500).json({ message: "Failed to update transaction details" });
    }
  });

  // Betting order routes
  app.get("/api/betting-orders", authenticateUser, async (req, res) => {
    try {
      const user = await storage.getUser((req as any).userId);
      let orders;
      
      if (user?.role === "admin") {
        orders = await storage.getAllBettingOrders();
      } else {
        orders = await storage.getBettingOrdersByUserId((req as any).userId);
      }
      
      res.json(orders);
    } catch (error) {
      res.status(500).json({ message: "Failed to get betting orders" });
    }
  });

  app.get("/api/betting-orders/active", authenticateUser, async (req, res) => {
    try {
      const user = await storage.getUser((req as any).userId);
      let orders;
      
      if (user?.role === "admin") {
        orders = await storage.getActiveBettingOrders();
      } else {
        const userOrders = await storage.getBettingOrdersByUserId((req as any).userId);
        orders = userOrders.filter(order => order.status === "active");
      }
      
      res.json(orders);
    } catch (error) {
      res.status(500).json({ message: "Failed to get active orders" });
    }
  });

  app.post("/api/betting-orders", authenticateUser, async (req, res) => {
    try {
      console.log("==== BETTING ORDER START ====");
      console.log("User ID:", (req as any).userId);
      console.log("Order data:", req.body);
      
      // Get user to check their direction setting from admin panel
      const user = await storage.getUser((req as any).userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Generate unique order ID
      const orderId = `ORD${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
      
      // Manually validate required fields (only check what frontend actually sends)
      const { amount: orderAmount, direction, actualDirection, duration, asset, entryPrice: frontendEntryPrice } = req.body;
      if (!orderAmount || !direction || !duration) {
        console.log("Missing required fields:", { amount: orderAmount, direction, duration });
        return res.status(400).json({ message: "Missing required fields: amount, direction, duration" });
      }
      
      console.log("Asset from frontend:", asset);
      console.log("EntryPrice from frontend:", frontendEntryPrice);
      
      // Use asset from frontend or fallback to BTC/USDT
      const finalAsset = asset || "BTC/USDT";
      let entryPrice = frontendEntryPrice || "115000.00"; // Use frontend price or fallback
      
      // Get current crypto price for entryPrice
      try {
        const cryptoPrices = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd")
          .then(res => res.json());
        if (cryptoPrices?.bitcoin?.usd) {
          entryPrice = cryptoPrices.bitcoin.usd.toString();
        }
      } catch (error) {
        console.log("Failed to fetch live price, using fallback");
      }
      
      // Check if user has sufficient balance
      const orderAmountNumber = parseFloat(orderAmount);
      const availableBalance = parseFloat(user.availableBalance);
      
      if (orderAmountNumber > availableBalance) {
        console.log(`Insufficient balance: ${orderAmountNumber} > ${availableBalance}`);
        return res.status(400).json({ message: "Insufficient balance" });
      }
      
      // Use customer's clicked direction if backend direction is "Actual", otherwise use admin-managed direction
      const effectiveDirection = user.direction === "Actual" ? (actualDirection || direction) : (user.direction || "Buy Up");
      console.log(`Direction: ${effectiveDirection} (backend: ${user.direction}, customer: ${actualDirection || direction})`);
      
      // Prepare complete order data with all required fields
      const orderData = {
        userId: (req as any).userId,
        asset: finalAsset, // Use asset from frontend (JUV/USDT, CHZ/USDT, etc.)
        amount: orderAmountNumber.toString(),
        direction: effectiveDirection, // Use effective direction based on backend setting
        duration: parseInt(duration),
        entryPrice,
        orderId,
        expiresAt: new Date(Date.now() + parseInt(duration) * 1000),
      };
      
      console.log("Order data:", orderData);
      
      const order = await storage.createBettingOrder(orderData);
      console.log("Created order:", order);
      
      // Deduct amount from available balance
      const newBalance = availableBalance - orderAmountNumber;
      console.log(`BALANCE UPDATE: ${availableBalance} - ${orderAmountNumber} = ${newBalance}`);
      
      await storage.updateUser((req as any).userId, {
        availableBalance: newBalance.toFixed(2),
      });
      console.log("Balance updated successfully");
      
      console.log("==== BETTING ORDER END ====");
      res.json(order);
    } catch (error) {
      console.error("Betting order error:", error);
      res.status(400).json({ message: "Invalid betting order data", error: String(error) });
    }
  });

  app.patch("/api/betting-orders/:id", authenticateUser, requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      
      const updatedOrder = await storage.updateBettingOrder(id, updates);
      if (!updatedOrder) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      res.json(updatedOrder);
    } catch (error) {
      res.status(500).json({ message: "Failed to update order" });
    }
  });

  // Withdrawal request routes
  app.get("/api/withdrawal-requests", authenticateUser, async (req, res) => {
    try {
      const user = await storage.getUser((req as any).userId);
      let requests;
      
      if (user?.role === "admin") {
        requests = await storage.getPendingWithdrawalRequests();
      } else {
        requests = await storage.getWithdrawalRequestsByUserId((req as any).userId);
      }
      
      res.json(requests);
    } catch (error) {
      res.status(500).json({ message: "Failed to get withdrawal requests" });
    }
  });

  app.post("/api/withdrawal-requests", authenticateUser, async (req, res) => {
    try {
      const userId = (req as any).userId;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if withdrawals are prohibited for this user
      if (user.withdrawalProhibited) {
        return res.status(403).json({ message: "Withdrawal is prohibited for this account. Please contact support." });
      }

      console.log("Withdrawal request data:", req.body);
      
      const validatedData = insertWithdrawalRequestSchema.parse({
        ...req.body,
        userId,
      });
      
      console.log("Validated withdrawal data:", validatedData);
      
      const request = await storage.createWithdrawalRequest(validatedData);
      res.json(request);
    } catch (error) {
      console.error("Withdrawal request validation error:", error);
      res.status(400).json({ message: "Invalid withdrawal request data", error: String(error) });
    }
  });

  app.patch("/api/withdrawal-requests/:id", authenticateUser, requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status, note } = req.body;
      
      const updateData: any = {
        status,
        processedAt: new Date(),
      };
      
      if (note) {
        updateData.note = note;
      }
      
      const updatedRequest = await storage.updateWithdrawalRequest(id, updateData);
      
      if (!updatedRequest) {
        return res.status(404).json({ message: "Request not found" });
      }
      
      // Only process transactions and balance changes for approved requests
      if (status === "approved") {
        await storage.createTransaction({
          userId: updatedRequest.userId,
          type: "withdrawal",
          amount: updatedRequest.amount,
          status: "completed",
          description: "Withdrawal approved",
        });
        
        // Deduct withdrawal amount from user's available balance ONLY for approved requests
        const user = await storage.getUser(updatedRequest.userId);
        if (user) {
          const withdrawalAmount = parseFloat(updatedRequest.amount);
          const currentAvailable = parseFloat(user.availableBalance);
          const currentTotal = parseFloat(user.balance);
          
          const newAvailable = Math.max(0, currentAvailable - withdrawalAmount);
          const newTotal = Math.max(0, currentTotal - withdrawalAmount);
          
          await storage.updateUser(updatedRequest.userId, {
            availableBalance: newAvailable.toFixed(2),
            balance: newTotal.toFixed(2),
          });
        }
      } else if (status === "rejected") {
        // For rejected requests, only create a transaction record but don't deduct balance
        await storage.createTransaction({
          userId: updatedRequest.userId,
          type: "withdrawal",
          amount: updatedRequest.amount,
          status: "rejected",
          description: `Withdrawal rejected: ${note || "No reason provided"}`,
        });
      }
      
      res.json(updatedRequest);
    } catch (error) {
      res.status(500).json({ message: "Failed to update withdrawal request" });
    }
  });

  // Announcement routes
  app.get("/api/announcements", async (req, res) => {
    try {
      const announcements = await storage.getActiveAnnouncements();
      res.json(announcements);
    } catch (error) {
      res.status(500).json({ message: "Failed to get announcements" });
    }
  });

  app.get("/api/announcements/all", authenticateUser, requireAdmin, async (req, res) => {
    try {
      const announcements = await storage.getAllAnnouncements();
      res.json(announcements);
    } catch (error) {
      res.status(500).json({ message: "Failed to get all announcements" });
    }
  });

  app.post("/api/announcements", authenticateUser, requireAdmin, async (req, res) => {
    try {
      const validatedData = insertAnnouncementSchema.parse(req.body);
      const announcement = await storage.createAnnouncement(validatedData);
      res.json(announcement);
    } catch (error) {
      res.status(400).json({ message: "Invalid announcement data" });
    }
  });

  app.post("/api/messages", authenticateUser, requireAdmin, async (req, res) => {
    try {
      const { recipientId, title, content } = req.body;
      console.log("Message request body:", req.body);
      console.log("Recipient ID type:", typeof recipientId, recipientId);
      
      const adminUserId = await getSessionUserId(req);
      console.log("Admin user ID:", adminUserId, typeof adminUserId);
      if (!adminUserId || typeof adminUserId !== 'number') {
        return res.status(401).json({ message: "Admin user not found" });
      }
      
      // Ensure recipientId is a number
      const toUserId = typeof recipientId === 'string' ? parseInt(recipientId) : recipientId;
      if (!toUserId || isNaN(toUserId)) {
        return res.status(400).json({ message: "Invalid recipient ID" });
      }
      
      if (!title || !content) {
        return res.status(400).json({ message: "Title and content are required" });
      }
      
      console.log("Creating message with data:", {
        fromUserId: adminUserId,
        toUserId: toUserId,
        title: title,
        content: content,
        type: "General"
      });
      
      const message = await storage.createMessage({
        fromUserId: adminUserId,
        toUserId: toUserId,
        title: title,
        content: content,
        type: "General"
      });
      res.json(message);
    } catch (error) {
      console.error("Message creation error:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  app.delete("/api/users/:id", authenticateUser, requireAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const success = await storage.deleteUser(userId);
      if (success) {
        res.json({ message: "User deleted successfully" });
      } else {
        res.status(404).json({ message: "User not found or cannot delete admin user" });
      }
    } catch (error: any) {
      console.error("Delete user error:", error);
      if (error.message.includes("User not found")) {
        res.status(404).json({ message: "User not found or cannot delete admin user" });
      } else {
        res.status(500).json({ message: "Failed to delete user" });
      }
    }
  });

  app.patch("/api/announcements/:id", authenticateUser, requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      
      const updatedAnnouncement = await storage.updateAnnouncement(id, updates);
      if (!updatedAnnouncement) {
        return res.status(404).json({ message: "Announcement not found" });
      }
      
      res.json(updatedAnnouncement);
    } catch (error) {
      res.status(500).json({ message: "Failed to update announcement" });
    }
  });

  // Message routes
  app.get("/api/messages", authenticateUser, async (req, res) => {
    try {
      const userId = await getSessionUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const messages = await storage.getMessagesByUserId(userId);
      res.json(messages);
    } catch (error) {
      console.error("Get messages error:", error);
      res.status(500).json({ message: "Failed to get messages" });
    }
  });

  app.post("/api/messages", authenticateUser, requireAdmin, async (req, res) => {
    try {
      const message = await storage.createMessage(req.body);
      res.json(message);
    } catch (error) {
      res.status(500).json({ message: "Failed to create message" });
    }
  });

  app.patch("/api/messages/:id/read", authenticateUser, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.markMessageAsRead(id);
      
      if (!success) {
        return res.status(404).json({ message: "Message not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to mark message as read" });
    }
  });

  // Database seeding endpoint
  app.post("/api/seed-database", async (req, res) => {
    try {
      // Create test users
      const testUsers = [
        {
          username: "admin",
          email: "admin@cryptoinvest.com",
          password: "admin123",
          name: "Administrator",
          role: "admin",
          balance: "10000.00",
          availableBalance: "10000.00",
          frozenBalance: "0.00",
          reputation: 100,
          winLoseSetting: "To Win",
          direction: "Actual",
          isActive: true,
          isBanned: false,
          withdrawalProhibited: false,
          invitationCode: "100025",
          type: "Admin",
          generalAgent: "System",
          registrationTime: new Date(),
          remark: "System Administrator"
        },
        {
          username: "sarah",
          email: "sarah@email.com",
          password: "password123",
          name: "Sarah Johnson",
          role: "customer",
          balance: "10500.00",
          availableBalance: "10000.00",
          frozenBalance: "500.00",
          reputation: 100,
          winLoseSetting: "To Win",
          direction: "Actual",
          isActive: true,
          isBanned: false,
          withdrawalProhibited: false,
          invitationCode: "100026",
          type: "VIP",
          generalAgent: "Admin",
          registrationTime: new Date(),
          remark: "VIP Customer"
        },
        {
          username: "john",
          email: "john@email.com",
          password: "password123",
          name: "John Smith",
          role: "customer",
          balance: "8500.00",
          availableBalance: "8000.00",
          frozenBalance: "500.00",
          reputation: 100,
          winLoseSetting: "To Win",
          direction: "Actual",
          isActive: true,
          isBanned: false,
          withdrawalProhibited: false,
          invitationCode: "100027",
          type: "Normal",
          generalAgent: "Admin",
          registrationTime: new Date(),
          remark: "Regular Customer"
        }
      ];

      let created = 0;
      for (const userData of testUsers) {
        try {
          const existingUser = await storage.getUserByUsername(userData.username);
          if (!existingUser) {
            await storage.createUser(userData);
            created++;
          }
        } catch (error) {
          console.log(`User ${userData.username} already exists`);
        }
      }

      res.json({ message: `Database seeded successfully. Created ${created} new users.` });
    } catch (error) {
      console.error("Database seeding error:", error);
      res.status(500).json({ message: "Failed to seed database" });
    }
  });

  // Real-time crypto prices endpoint using CoinGecko API
  app.get("/api/crypto-prices", async (req, res) => {
    try {
      // Fetch real-time data from CoinGecko
      const response = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,dogecoin,chiliz,bitcoin-cash,paris-saint-germain-fan-token,juventus-fan-token,atletico-madrid,litecoin,eos,tron,ethereum-classic,bitshares&vs_currencies=usd&include_24hr_change=true'
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch crypto prices');
      }
      
      const data = await response.json();
      
      // Transform the data to match our format
      const transformedData = {
        "BTC/USDT": {
          price: data.bitcoin.usd.toFixed(2),
          change: data.bitcoin.usd_24h_change ? `${data.bitcoin.usd_24h_change >= 0 ? '+' : ''}${data.bitcoin.usd_24h_change.toFixed(2)}%` : "0.00%",
          changeType: data.bitcoin.usd_24h_change >= 0 ? "positive" : "negative"
        },
        "ETH/USDT": {
          price: data.ethereum.usd.toFixed(2),
          change: data.ethereum.usd_24h_change ? `${data.ethereum.usd_24h_change >= 0 ? '+' : ''}${data.ethereum.usd_24h_change.toFixed(2)}%` : "0.00%",
          changeType: data.ethereum.usd_24h_change >= 0 ? "positive" : "negative"
        },
        "DOGE/USDT": {
          price: data.dogecoin.usd.toFixed(5),
          change: data.dogecoin.usd_24h_change ? `${data.dogecoin.usd_24h_change >= 0 ? '+' : ''}${data.dogecoin.usd_24h_change.toFixed(2)}%` : "0.00%",
          changeType: data.dogecoin.usd_24h_change >= 0 ? "positive" : "negative"
        },
        "CHZ/USDT": {
          price: data.chiliz.usd.toFixed(5),
          change: data.chiliz.usd_24h_change ? `${data.chiliz.usd_24h_change >= 0 ? '+' : ''}${data.chiliz.usd_24h_change.toFixed(2)}%` : "0.00%",
          changeType: data.chiliz.usd_24h_change >= 0 ? "positive" : "negative"
        },
        "BCH/USDT": {
          price: data['bitcoin-cash'].usd.toFixed(2),
          change: data['bitcoin-cash'].usd_24h_change ? `${data['bitcoin-cash'].usd_24h_change >= 0 ? '+' : ''}${data['bitcoin-cash'].usd_24h_change.toFixed(2)}%` : "0.00%",
          changeType: data['bitcoin-cash'].usd_24h_change >= 0 ? "positive" : "negative"
        },
        "PSG/USD": {
          price: data['paris-saint-germain-fan-token'].usd.toFixed(3),
          change: data['paris-saint-germain-fan-token'].usd_24h_change ? `${data['paris-saint-germain-fan-token'].usd_24h_change >= 0 ? '+' : ''}${data['paris-saint-germain-fan-token'].usd_24h_change.toFixed(2)}%` : "0.00%",
          changeType: data['paris-saint-germain-fan-token'].usd_24h_change >= 0 ? "positive" : "negative"
        },
        "JUV/USD": {
          price: data['juventus-fan-token'].usd.toFixed(3),
          change: data['juventus-fan-token'].usd_24h_change ? `${data['juventus-fan-token'].usd_24h_change >= 0 ? '+' : ''}${data['juventus-fan-token'].usd_24h_change.toFixed(2)}%` : "0.00%",
          changeType: data['juventus-fan-token'].usd_24h_change >= 0 ? "positive" : "negative"
        },
        "ATM/USD": {
          price: data['atletico-madrid'].usd.toFixed(3),
          change: data['atletico-madrid'].usd_24h_change ? `${data['atletico-madrid'].usd_24h_change >= 0 ? '+' : ''}${data['atletico-madrid'].usd_24h_change.toFixed(2)}%` : "0.00%",
          changeType: data['atletico-madrid'].usd_24h_change >= 0 ? "positive" : "negative"
        },
        "LTC/USDT": {
          price: data.litecoin.usd.toFixed(2),
          change: data.litecoin.usd_24h_change ? `${data.litecoin.usd_24h_change >= 0 ? '+' : ''}${data.litecoin.usd_24h_change.toFixed(2)}%` : "0.00%",
          changeType: data.litecoin.usd_24h_change >= 0 ? "positive" : "negative"
        },
        "EOS/USD": {
          price: data.eos.usd.toFixed(4),
          change: data.eos.usd_24h_change ? `${data.eos.usd_24h_change >= 0 ? '+' : ''}${data.eos.usd_24h_change.toFixed(2)}%` : "0.00%",
          changeType: data.eos.usd_24h_change >= 0 ? "positive" : "negative"
        },
        "TRX/USD": {
          price: data.tron.usd.toFixed(4),
          change: data.tron.usd_24h_change ? `${data.tron.usd_24h_change >= 0 ? '+' : ''}${data.tron.usd_24h_change.toFixed(2)}%` : "0.00%",
          changeType: data.tron.usd_24h_change >= 0 ? "positive" : "negative"
        },
        "ETC/USD": {
          price: data['ethereum-classic'].usd.toFixed(2),
          change: data['ethereum-classic'].usd_24h_change ? `${data['ethereum-classic'].usd_24h_change >= 0 ? '+' : ''}${data['ethereum-classic'].usd_24h_change.toFixed(2)}%` : "0.00%",
          changeType: data['ethereum-classic'].usd_24h_change >= 0 ? "positive" : "negative"
        },
        "BTS/USD": {
          price: data.bitshares.usd.toFixed(4),
          change: data.bitshares.usd_24h_change ? `${data.bitshares.usd_24h_change >= 0 ? '+' : ''}${data.bitshares.usd_24h_change.toFixed(2)}%` : "0.00%",
          changeType: data.bitshares.usd_24h_change >= 0 ? "positive" : "negative"
        }
      };
      
      res.json(transformedData);
    } catch (error) {
      console.error('Error fetching crypto prices:', error);
      // Fallback to static data if API fails
      res.json({
        "BTC/USDT": {
          price: "42150.00",
          change: "+2.4%",
          changeType: "positive"
        },
        "ETH/USDT": {
          price: "2850.00",
          change: "-1.2%",
          changeType: "negative"
        },
        "DOGE/USDT": {
          price: "0.16147",
          change: "-1.87%",
          changeType: "negative"
        },
        "CHZ/USDT": {
          price: "0.03457",
          change: "-2.59%",
          changeType: "negative"
        },
        "BCH/USDT": {
          price: "502.8",
          change: "0.50%",
          changeType: "positive"
        },
        "PSG/USD": {
          price: "1.417",
          change: "-2.01%",
          changeType: "negative"
        },
        "JUV/USD": {
          price: "0.901",
          change: "-1.42%",
          changeType: "negative"
        },
        "ATM/USD": {
          price: "0.999",
          change: "-1.87%",
          changeType: "negative"
        },
        "LTC/USD": {
          price: "85.13",
          change: "-0.28%",
          changeType: "negative"
        },
        "EOS/USD": {
          price: "0",
          change: "0.00%",
          changeType: "positive"
        },
        "TRX/USD": {
          price: "0.2712",
          change: "0.15%",
          changeType: "positive"
        },
        "ETC/USD": {
          price: "16.19",
          change: "-2.00%",
          changeType: "negative"
        },
        "BTS/USD": {
          price: "502.8",
          change: "0.50%",
          changeType: "positive"
        }
      });
    }
  });

  // Start periodic order expiration checker
  setInterval(async () => {
    await storage.checkExpiredOrders();
  }, 10000); // Check every 10 seconds
  
  // Also run immediately to catch any orders that expired during server restart
  setTimeout(async () => {
    await storage.checkExpiredOrders();
  }, 2000); // Wait 2 seconds for server to fully start

  const httpServer = createServer(app);
  return httpServer;
}