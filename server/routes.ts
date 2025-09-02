import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertBankAccountSchema, insertTransactionSchema, insertBettingOrderSchema, insertWithdrawalRequestSchema, insertAnnouncementSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication middleware
  const authenticateUser = (req: any, res: any, next: any) => {
    if (!req.session?.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    next();
  };

  const requireAdmin = async (req: any, res: any, next: any) => {
    if (!req.session?.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const user = await storage.getUser(req.session.userId);
    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }
    next();
  };

  // Auth routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      const user = await storage.getUserByUsername(username);
      
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      if (req.session) {
        req.session.userId = user.id;
      }
      const { password: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error) {
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    if (req.session?.destroy) {
      req.session.destroy(() => {
        res.json({ message: "Logged out successfully" });
      });
    } else {
      res.json({ message: "Logged out successfully" });
    }
  });

  app.get("/api/auth/me", authenticateUser, async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const { password: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error) {
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

  // Bank account routes
  app.get("/api/bank-accounts", authenticateUser, async (req, res) => {
    try {
      const bankAccounts = await storage.getBankAccountsByUserId(req.session.userId);
      res.json(bankAccounts);
    } catch (error) {
      res.status(500).json({ message: "Failed to get bank accounts" });
    }
  });

  app.post("/api/bank-accounts", authenticateUser, async (req, res) => {
    try {
      const validatedData = insertBankAccountSchema.parse({
        ...req.body,
        userId: req.session.userId,
      });
      
      const bankAccount = await storage.createBankAccount(validatedData);
      res.json(bankAccount);
    } catch (error) {
      res.status(400).json({ message: "Invalid bank account data" });
    }
  });

  // Transaction routes
  app.get("/api/transactions", authenticateUser, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId);
      let transactions;
      
      if (user?.role === "admin") {
        transactions = await storage.getAllTransactions();
      } else {
        transactions = await storage.getTransactionsByUserId(req.session.userId);
      }
      
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ message: "Failed to get transactions" });
    }
  });

  app.post("/api/transactions", authenticateUser, async (req, res) => {
    try {
      const validatedData = insertTransactionSchema.parse(req.body);
      const transaction = await storage.createTransaction(validatedData);
      
      // Update user balance based on transaction type
      const user = await storage.getUser(validatedData.userId);
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
        
        await storage.updateUser(validatedData.userId, balanceUpdate);
      }
      
      res.json(transaction);
    } catch (error) {
      res.status(400).json({ message: "Invalid transaction data" });
    }
  });

  // Withdrawal request routes
  app.get("/api/withdrawal-requests", authenticateUser, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId);
      let requests;
      
      if (user?.role === "admin") {
        requests = await storage.getPendingWithdrawalRequests();
      } else {
        requests = await storage.getWithdrawalRequestsByUserId(req.session.userId);
      }
      
      res.json(requests);
    } catch (error) {
      res.status(500).json({ message: "Failed to get withdrawal requests" });
    }
  });

  app.post("/api/withdrawal-requests", authenticateUser, async (req, res) => {
    try {
      const validatedData = insertWithdrawalRequestSchema.parse({
        ...req.body,
        userId: req.session.userId,
        status: "Under review",
      });
      
      // Check if user has sufficient balance
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const withdrawalAmount = parseFloat(validatedData.amount);
      const availableBalance = parseFloat(user.availableBalance);
      
      if (withdrawalAmount > availableBalance) {
        return res.status(400).json({ message: "Insufficient balance" });
      }
      
      // Create withdrawal request
      const request = await storage.createWithdrawalRequest(validatedData);
      
      // Update user balance (deduct withdrawal amount)
      const newBalance = (availableBalance - withdrawalAmount).toString();
      await storage.updateUser(req.session.userId, { 
        availableBalance: newBalance,
        balance: newBalance
      });
      
      res.json(request);
    } catch (error) {
      console.error('Withdrawal request error:', error);
      res.status(400).json({ message: "Invalid withdrawal request data" });
    }
  });

  app.patch("/api/withdrawal-requests/:id", authenticateUser, requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      
      const updatedRequest = await storage.updateWithdrawalRequest(id, { status });
      if (!updatedRequest) {
        return res.status(404).json({ message: "Withdrawal request not found" });
      }
      
      // If approved, create withdrawal transaction
      if (status === "approved") {
        await storage.createTransaction({
          userId: updatedRequest.userId,
          type: "withdrawal",
          amount: updatedRequest.amount,
          status: "completed",
          description: `Withdrawal request #${id} approved`,
        });
      }
      
      res.json(updatedRequest);
    } catch (error) {
      res.status(500).json({ message: "Failed to update withdrawal request" });
    }
  });

  // Betting order routes
  app.get("/api/betting-orders", authenticateUser, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId);
      let orders;
      
      if (user?.role === "admin") {
        orders = await storage.getAllBettingOrders();
      } else {
        orders = await storage.getBettingOrdersByUserId(req.session.userId);
      }
      
      res.json(orders);
    } catch (error) {
      res.status(500).json({ message: "Failed to get betting orders" });
    }
  });

  app.get("/api/betting-orders/active", authenticateUser, requireAdmin, async (req, res) => {
    try {
      const orders = await storage.getActiveBettingOrders();
      res.json(orders);
    } catch (error) {
      res.status(500).json({ message: "Failed to get active orders" });
    }
  });

  app.post("/api/betting-orders", authenticateUser, async (req, res) => {
    try {
      console.log("==== BETTING ORDER START ====");
      console.log("User ID from session:", req.session.userId);
      console.log("Order data:", req.body);
      console.log("Asset field specifically:", req.body.asset);
      
      // Basic validation with detailed logging
      console.log("Request body fields:", {
        amount: req.body.amount,
        direction: req.body.direction,
        duration: req.body.duration,
        asset: req.body.asset,
        hasAmount: !!req.body.amount,
        hasDirection: !!req.body.direction,
        hasDuration: !!req.body.duration,
        hasAsset: !!req.body.asset
      });
      
      if (!req.body.amount || !req.body.direction || !req.body.duration) {
        console.log("VALIDATION FAILED - Missing basic fields:", { 
          amount: req.body.amount, 
          direction: req.body.direction, 
          duration: req.body.duration,
          amountType: typeof req.body.amount,
          directionType: typeof req.body.direction,
          durationType: typeof req.body.duration
        });
        return res.status(400).json({ message: "Missing required fields: amount, direction, duration" });
      }
      
      // Get user to check their backend direction setting
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Check if user has sufficient balance
      const orderAmount = parseFloat(req.body.amount);
      const availableBalance = parseFloat(user.availableBalance);
      
      if (orderAmount > availableBalance) {
        return res.status(400).json({ message: "Insufficient balance" });
      }
      
      // Determine the final direction to store in the order
      let finalDirection = req.body.direction;
      
      console.log(`Backend direction logic - User direction: ${user.direction}, Request direction: ${req.body.direction}`);
      
      if (user.direction !== "Actual") {
        // When admin sets a specific direction, override customer's choice
        finalDirection = user.direction;
        console.log(`Using OVERRIDE direction: ${finalDirection} (backend override: ${user.direction})`);
      } else {
        console.log(`Using ACTUAL direction: ${finalDirection} (backend setting: ${user.direction})`);
      }
      
      console.log(`FINAL DIRECTION TO STORE: ${finalDirection}`);
      
      // Get current crypto price for entryPrice
      let entryPrice = "115000.00"; // Default fallback
      try {
        const cryptoPrices = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd")
          .then(res => res.json());
        if (cryptoPrices?.bitcoin?.usd) {
          entryPrice = cryptoPrices.bitcoin.usd.toString();
        }
      } catch (error) {
        console.log("Failed to fetch live price, using fallback");
      }
      
      // Create order data that matches storage expectations
      const assetFromRequest = req.body.asset;
      console.log("Asset from request body:", assetFromRequest, typeof assetFromRequest);
      const finalAsset = assetFromRequest || "BTC/USDT";
      console.log("Final asset to use:", finalAsset);
      
      const orderData = {
        userId: req.session.userId,
        asset: finalAsset,
        amount: orderAmount.toString(),
        direction: finalDirection,
        duration: parseInt(req.body.duration),
        entryPrice: entryPrice
      };
      
      console.log("Final order data:", orderData);
      
      const order = await storage.createBettingOrder(orderData);
      console.log("Created order:", order);
      
      // Deduct amount from available balance
      const newBalance = availableBalance - orderAmount;
      console.log(`BALANCE UPDATE: ${availableBalance} - ${orderAmount} = ${newBalance}`);
      
      await storage.updateUser(req.session.userId, {
        availableBalance: newBalance.toFixed(2),
      });
      
      console.log("==== BETTING ORDER END ====");
      res.json(order);
    } catch (error) {
      console.error("Betting order error:", error);
      if (error instanceof Error) {
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
      }
      res.status(500).json({ message: "Failed to create betting order", error: error instanceof Error ? error.message : "Unknown error" });
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
      const user = await storage.getUser(req.session.userId);
      let requests;
      
      if (user?.role === "admin") {
        requests = await storage.getPendingWithdrawalRequests();
      } else {
        requests = await storage.getWithdrawalRequestsByUserId(req.session.userId);
      }
      
      res.json(requests);
    } catch (error) {
      res.status(500).json({ message: "Failed to get withdrawal requests" });
    }
  });

  app.post("/api/withdrawal-requests", authenticateUser, async (req, res) => {
    try {
      const validatedData = insertWithdrawalRequestSchema.parse({
        ...req.body,
        userId: req.session.userId,
      });
      
      const request = await storage.createWithdrawalRequest(validatedData);
      res.json(request);
    } catch (error) {
      res.status(400).json({ message: "Invalid withdrawal request data" });
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
      
      // If approved, create withdrawal transaction
      if (status === "approved") {
        await storage.createTransaction({
          userId: updatedRequest.userId,
          type: "withdrawal",
          amount: updatedRequest.amount,
          status: "completed",
          description: "Withdrawal approved",
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

  // Real-time crypto prices endpoint with exact data from images
  app.get("/api/crypto-prices", (req, res) => {
    // Generate slight price variations to simulate real-time updates
    const baseTime = Date.now();
    const variation = (Math.sin(baseTime / 10000) * 0.02) + (Math.random() - 0.5) * 0.01;
    
    const baseData = {
      "BTC/USDT": { basePrice: 115112.9065, baseChange: -2.65 },
      "ETH/USDT": { basePrice: 4239.2141, baseChange: -7.08 },
      "DOGE/USDT": { basePrice: 0.2223, baseChange: -7.96 },
      "CHZ/USDT": { basePrice: 0.0397, baseChange: -6.39 },
      "PSG/USDT": { basePrice: 1.8354, baseChange: -2.87 },
      "ATM/USDT": { basePrice: 1.4263, baseChange: -5.63 },
      "JUV/USDT": { basePrice: 1.3628, baseChange: -4.91 },
      "KSM/USDT": { basePrice: 14.6653, baseChange: -7.50 },
      "LTC/USDT": { basePrice: 116.4456, baseChange: -4.81 },
      "EOS/USDT": { basePrice: 0.7240, baseChange: -1.23 },
      "BTS/USDT": { basePrice: 10.2999, baseChange: -9.28 },
      "LINK/USDT": { basePrice: 24.4868, baseChange: -6.86 }
    };

    const result = {};
    
    for (const [symbol, data] of Object.entries(baseData)) {
      const priceVariation = data.basePrice * variation;
      const changeVariation = Math.random() * 0.5 - 0.25; // Small random change in percentage
      
      const currentPrice = data.basePrice + priceVariation;
      const currentChange = data.baseChange + changeVariation;
      
      result[symbol] = {
        price: currentPrice.toFixed(currentPrice < 1 ? 4 : currentPrice < 100 ? 2 : 0),
        change: currentChange.toFixed(2),
        changeType: currentChange >= 0 ? "positive" : "negative"
      };
    }
    
    res.json(result);
  });

  const httpServer = createServer(app);
  return httpServer;
}
