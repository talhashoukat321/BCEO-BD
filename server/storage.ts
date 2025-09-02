import {
  users,
  bankAccounts,
  transactions,
  bettingOrders,
  withdrawalRequests,
  announcements,
  messages,
  sessions,
  type User,
  type InsertUser,
  type BankAccount,
  type InsertBankAccount,
  type Transaction,
  type InsertTransaction,
  type BettingOrder,
  type InsertBettingOrder,
  type WithdrawalRequest,
  type InsertWithdrawalRequest,
  type Announcement,
  type InsertAnnouncement,
  type Message,
  type InsertMessage,
  type Session,
  type InsertSession,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, lte } from "drizzle-orm";

export interface IStorage {
  // User management
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  getAllUsers(): Promise<User[]>;
  
  // Bank accounts
  getBankAccountsByUserId(userId: number): Promise<BankAccount[]>;
  createBankAccount(bankAccount: InsertBankAccount): Promise<BankAccount>;
  getBankAccount(id: number): Promise<BankAccount | undefined>;
  updateBankAccount(id: number, updates: Partial<BankAccount>): Promise<BankAccount | undefined>;
  deleteBankAccount(id: number): Promise<boolean>;
  
  // Transactions
  getTransactionsByUserId(userId: number): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  updateTransaction(id: number, updates: Partial<Transaction>): Promise<Transaction | undefined>;
  getAllTransactions(): Promise<Transaction[]>;
  
  // Betting orders
  getBettingOrdersByUserId(userId: number): Promise<BettingOrder[]>;
  createBettingOrder(order: InsertBettingOrder): Promise<BettingOrder>;
  updateBettingOrder(id: number, updates: Partial<BettingOrder>): Promise<BettingOrder | undefined>;
  getAllBettingOrders(): Promise<BettingOrder[]>;
  getActiveBettingOrders(): Promise<BettingOrder[]>;
  
  // Withdrawal requests
  getWithdrawalRequestsByUserId(userId: number): Promise<WithdrawalRequest[]>;
  createWithdrawalRequest(request: InsertWithdrawalRequest): Promise<WithdrawalRequest>;
  updateWithdrawalRequest(id: number, updates: Partial<WithdrawalRequest>): Promise<WithdrawalRequest | undefined>;
  getPendingWithdrawalRequests(): Promise<WithdrawalRequest[]>;
  
  // Announcements
  getActiveAnnouncements(): Promise<Announcement[]>;
  createAnnouncement(announcement: InsertAnnouncement): Promise<Announcement>;
  updateAnnouncement(id: number, updates: Partial<Announcement>): Promise<Announcement | undefined>;
  getAllAnnouncements(): Promise<Announcement[]>;
  getAllBankAccountsWithUsers(): Promise<any[]>;
  
  // Messages
  getMessagesByUserId(userId: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  updateMessage(id: number, updates: Partial<Message>): Promise<Message | undefined>;
  markMessageAsRead(id: number): Promise<boolean>;
  
  // Sessions
  createSession(session: InsertSession): Promise<Session>;
  getSession(sessionId: string): Promise<Session | undefined>;
  deleteSession(sessionId: string): Promise<boolean>;
  cleanupExpiredSessions(): Promise<number>;
}

export class DatabaseStorage implements IStorage {
  constructor() {
    // Initialize with sample data if needed
    this.initializeSampleData();
  }

  private async initializeSampleData() {
    try {
      // Check if we already have users
      const existingUsers = await db.select().from(users).limit(1);
      if (existingUsers.length > 0) {
        return; // Data already exists
      }

      // Create admin user
      const [adminUser] = await db.insert(users).values({
        username: "admin",
        email: "admin@cryptoinvest.com",
        password: "admin123",
        name: "Administrator",
        role: "admin",
      }).returning();

      // Create sample customer users
      const [customerUser] = await db.insert(users).values({
        username: "sarah",
        email: "sarah@email.com",
        password: "password123",
        name: "Sarah Johnson",
        role: "customer",
        balance: "10500.00",
        availableBalance: "10000.00",
        frozenBalance: "500.00",
      }).returning();

      const [johnUser] = await db.insert(users).values({
        username: "john",
        email: "john@email.com",
        password: "password123",
        name: "John Smith",
        role: "customer",
        balance: "8500.00",
        availableBalance: "8000.00",
        frozenBalance: "500.00",
      }).returning();

      // Create sample transactions
      if (customerUser) {
        await db.insert(transactions).values([
          {
            userId: customerUser.id,
            type: "deposit",
            amount: "1000.00",
            status: "completed",
            description: "Initial deposit",
          },
          {
            userId: customerUser.id,
            type: "trade_win",
            amount: "500.00",
            status: "completed",
            description: "BTC/USDT trade win",
          }
        ]);

        // Create sample betting orders
        const now = new Date();
        const expiresAt = new Date(now.getTime() + 120000); // 2 minutes from now

        await db.insert(bettingOrders).values([
          {
            userId: customerUser.id,
            orderId: `${Date.now()}-1`,
            asset: "BTC/USD",
            amount: "100.00",
            direction: "Buy Up",
            duration: 120,
            entryPrice: "45000.00",
            expiresAt,
          },
          {
            userId: customerUser.id,
            orderId: `${Date.now()}-2`,
            asset: "ETH/USD",
            amount: "50.00",
            direction: "Buy Down",
            duration: 60,
            entryPrice: "3000.00",
            expiresAt: new Date(now.getTime() + 60000),
            status: "completed",
            result: "win",
            exitPrice: "2950.00",
          }
        ]);

        // Create sample messages
        await db.insert(messages).values([
          {
            fromUserId: adminUser.id,
            toUserId: customerUser.id,
            title: "Welcome to CryptoInvest Platform",
            content: "Thank you for joining our platform. Your account has been successfully created.",
            type: "General",
          }
        ]);
      }

      console.log("Sample data initialized successfully");
    } catch (error) {
      console.error("Error initializing sample data:", error);
    }
  }

  // User management
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const [user] = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return user || undefined;
  }

  async deleteUser(id: number): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return (result.rowCount || 0) > 0;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  // Bank accounts
  async getBankAccountsByUserId(userId: number): Promise<BankAccount[]> {
    return await db.select().from(bankAccounts).where(eq(bankAccounts.userId, userId));
  }

  async createBankAccount(insertBankAccount: InsertBankAccount): Promise<BankAccount> {
    const [bankAccount] = await db.insert(bankAccounts).values(insertBankAccount).returning();
    return bankAccount;
  }

  async getBankAccount(id: number): Promise<BankAccount | undefined> {
    const [bankAccount] = await db.select().from(bankAccounts).where(eq(bankAccounts.id, id));
    return bankAccount || undefined;
  }

  async updateBankAccount(id: number, updates: Partial<BankAccount>): Promise<BankAccount | undefined> {
    const [bankAccount] = await db.update(bankAccounts).set(updates).where(eq(bankAccounts.id, id)).returning();
    return bankAccount || undefined;
  }

  async deleteBankAccount(id: number): Promise<boolean> {
    const result = await db.delete(bankAccounts).where(eq(bankAccounts.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Transactions
  async getTransactionsByUserId(userId: number): Promise<Transaction[]> {
    return await db.select().from(transactions)
      .where(eq(transactions.userId, userId))
      .orderBy(desc(transactions.createdAt));
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const [transaction] = await db.insert(transactions).values(insertTransaction).returning();
    return transaction;
  }

  async updateTransaction(id: number, updates: Partial<Transaction>): Promise<Transaction | undefined> {
    const [transaction] = await db.update(transactions).set(updates).where(eq(transactions.id, id)).returning();
    return transaction || undefined;
  }

  async getAllTransactions(): Promise<Transaction[]> {
    return await db.select().from(transactions).orderBy(desc(transactions.createdAt));
  }

  // Betting orders
  async getBettingOrdersByUserId(userId: number): Promise<BettingOrder[]> {
    return await db.select().from(bettingOrders)
      .where(eq(bettingOrders.userId, userId))
      .orderBy(desc(bettingOrders.createdAt));
  }

  async createBettingOrder(insertOrder: InsertBettingOrder): Promise<BettingOrder> {
    // Store actual duration in seconds (60, 120, 180) as provided by the user
    const [order] = await db.insert(bettingOrders).values({
      ...insertOrder,
      orderId: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      expiresAt: new Date(Date.now() + insertOrder.duration * 1000), // duration is already in seconds
    }).returning();
    return order;
  }

  async updateBettingOrder(id: number, updates: Partial<BettingOrder>): Promise<BettingOrder | undefined> {
    const [order] = await db.update(bettingOrders).set(updates).where(eq(bettingOrders.id, id)).returning();
    return order || undefined;
  }

  async getAllBettingOrders(): Promise<BettingOrder[]> {
    return await db.select().from(bettingOrders).orderBy(desc(bettingOrders.createdAt));
  }

  async getActiveBettingOrders(): Promise<BettingOrder[]> {
    return await db.select().from(bettingOrders)
      .where(eq(bettingOrders.status, "active"))
      .orderBy(desc(bettingOrders.createdAt));
  }

  // Withdrawal requests
  async getWithdrawalRequestsByUserId(userId: number): Promise<WithdrawalRequest[]> {
    return await db.select().from(withdrawalRequests)
      .where(eq(withdrawalRequests.userId, userId))
      .orderBy(desc(withdrawalRequests.createdAt));
  }

  async createWithdrawalRequest(insertRequest: InsertWithdrawalRequest): Promise<WithdrawalRequest> {
    const [request] = await db.insert(withdrawalRequests).values(insertRequest).returning();
    return request;
  }

  async updateWithdrawalRequest(id: number, updates: Partial<WithdrawalRequest>): Promise<WithdrawalRequest | undefined> {
    const [request] = await db.update(withdrawalRequests).set(updates).where(eq(withdrawalRequests.id, id)).returning();
    return request || undefined;
  }

  async getPendingWithdrawalRequests(): Promise<WithdrawalRequest[]> {
    return await db.select().from(withdrawalRequests)
      .where(eq(withdrawalRequests.status, "pending"))
      .orderBy(desc(withdrawalRequests.createdAt));
  }

  // Announcements
  async getActiveAnnouncements(): Promise<Announcement[]> {
    return await db.select().from(announcements)
      .where(eq(announcements.isActive, true))
      .orderBy(desc(announcements.createdAt));
  }

  async createAnnouncement(insertAnnouncement: InsertAnnouncement): Promise<Announcement> {
    const [announcement] = await db.insert(announcements).values(insertAnnouncement).returning();
    return announcement;
  }

  async updateAnnouncement(id: number, updates: Partial<Announcement>): Promise<Announcement | undefined> {
    const [announcement] = await db.update(announcements).set(updates).where(eq(announcements.id, id)).returning();
    return announcement || undefined;
  }

  async getAllAnnouncements(): Promise<Announcement[]> {
    return await db.select().from(announcements).orderBy(desc(announcements.createdAt));
  }

  async getAllBankAccountsWithUsers(): Promise<any[]> {
    const result = await db.select({
      id: bankAccounts.id,
      accountHolderName: bankAccounts.accountHolderName,
      accountNumber: bankAccounts.accountNumber,
      bankName: bankAccounts.bankName,
      branchName: bankAccounts.branchName,
      ifscCode: bankAccounts.ifscCode,
      isDefault: bankAccounts.isDefault,
      userId: bankAccounts.userId,
      userName: users.username,
      email: users.email,
    }).from(bankAccounts)
      .leftJoin(users, eq(bankAccounts.userId, users.id));
    
    return result;
  }

  // Messages
  async getMessagesByUserId(userId: number): Promise<Message[]> {
    return await db.select().from(messages)
      .where(eq(messages.toUserId, userId))
      .orderBy(desc(messages.createdAt));
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const [message] = await db.insert(messages).values(insertMessage).returning();
    return message;
  }

  async updateMessage(id: number, updates: Partial<Message>): Promise<Message | undefined> {
    const [message] = await db.update(messages).set(updates).where(eq(messages.id, id)).returning();
    return message || undefined;
  }

  async markMessageAsRead(id: number): Promise<boolean> {
    const result = await db.update(messages).set({ isRead: true }).where(eq(messages.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Sessions
  async createSession(insertSession: InsertSession): Promise<Session> {
    const [session] = await db.insert(sessions).values(insertSession).returning();
    return session;
  }

  async getSession(sessionId: string): Promise<Session | undefined> {
    const [session] = await db.select().from(sessions).where(eq(sessions.id, sessionId));
    return session || undefined;
  }

  async deleteSession(sessionId: string): Promise<boolean> {
    const result = await db.delete(sessions).where(eq(sessions.id, sessionId));
    return (result.rowCount || 0) > 0;
  }

  async cleanupExpiredSessions(): Promise<number> {
    const now = new Date();
    const result = await db.delete(sessions).where(eq(sessions.expiresAt, now));
    return result.rowCount || 0;
  }

  // Check expired betting orders and complete them with exact timing
  async checkExpiredOrders(): Promise<void> {
    const now = new Date();
    const expiredOrders = await db.select().from(bettingOrders)
      .where(
        and(
          eq(bettingOrders.status, "active"),
          lte(bettingOrders.expiresAt, now)
        )
      );

    for (const order of expiredOrders) {
      // Calculate profit based on duration: 60s=20%, 120s=30%, 180s=50%
      const profitPercentage = order.duration === 60 ? 0.20 : 
                              order.duration === 120 ? 0.30 : 
                              order.duration === 180 ? 0.50 : 0.20;
      
      const orderAmount = parseFloat(order.amount);
      const profit = orderAmount * profitPercentage;
      
      // Update order to completed
      await this.updateBettingOrder(order.id, {
        status: "completed",
        result: "win", // Always win for now (as per existing logic)
        exitPrice: order.entryPrice,
      });

      // Update user balance
      const user = await this.getUser(order.userId);
      if (user) {
        const newBalance = (parseFloat(user.availableBalance) + orderAmount + profit).toFixed(2);
        await this.updateUser(order.userId, {
          availableBalance: newBalance,
          balance: newBalance
        });
      }

      console.log(`Order ${order.orderId} completed with ${profitPercentage * 100}% profit: +${profit.toFixed(2)} (Duration: ${order.duration}s)`);
    }
  }
}

export const storage = new DatabaseStorage();