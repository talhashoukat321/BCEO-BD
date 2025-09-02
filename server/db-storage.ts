import { db } from "./db";
import { 
  users, 
  bankAccounts, 
  transactions, 
  bettingOrders, 
  withdrawalRequests, 
  announcements,
  messages,
  sessions 
} from "@shared/schema";
import type { 
  User, 
  InsertUser, 
  BankAccount, 
  InsertBankAccount, 
  Transaction, 
  InsertTransaction, 
  BettingOrder, 
  InsertBettingOrder, 
  WithdrawalRequest, 
  InsertWithdrawalRequest, 
  Announcement, 
  InsertAnnouncement,
  Message,
  InsertMessage,
  Session,
  InsertSession 
} from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";
import { IStorage } from "./storage";

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    try {
      const result = await db.update(users).set(updates).where(eq(users.id, id)).returning();
      return result[0];
    } catch (error) {
      console.error("Error updating user:", error);
      throw error;
    }
  }

  async deleteUser(id: number): Promise<boolean> {
    try {
      // Check if user exists first
      const existingUser = await db.select().from(users).where(eq(users.id, id)).limit(1);
      if (existingUser.length === 0) {
        throw new Error("User not found");
      }
      
      // Don't allow deleting admin users  
      if (existingUser[0].role === "admin") {
        throw new Error("Cannot delete admin users");
      }
      
      // Delete associated records first to handle foreign key constraints
      // Order matters due to foreign key dependencies
      
      // Get user's bank account IDs first
      const userBankAccounts = await db.select({ id: bankAccounts.id })
        .from(bankAccounts)
        .where(eq(bankAccounts.userId, id));
      
      // Delete withdrawal requests that reference these bank accounts
      for (const account of userBankAccounts) {
        await db.delete(withdrawalRequests).where(eq(withdrawalRequests.bankAccountId, account.id));
      }
      
      // Delete withdrawal requests by userId as well (in case of any direct references)
      await db.delete(withdrawalRequests).where(eq(withdrawalRequests.userId, id));
      
      // Delete bank accounts (after withdrawal requests)
      await db.delete(bankAccounts).where(eq(bankAccounts.userId, id));
      
      // Delete transactions
      await db.delete(transactions).where(eq(transactions.userId, id));
      
      // Delete betting orders
      await db.delete(bettingOrders).where(eq(bettingOrders.userId, id));
      
      // Delete messages (both sent and received)
      await db.delete(messages).where(eq(messages.fromUserId, id));
      await db.delete(messages).where(eq(messages.toUserId, id));
      
      // Finally delete the user
      await db.delete(users).where(eq(users.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting user:", error);
      throw error;
    }
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  // Bank accounts
  async getBankAccountsByUserId(userId: number): Promise<BankAccount[]> {
    return await db.select().from(bankAccounts).where(eq(bankAccounts.userId, userId));
  }

  async createBankAccount(bankAccount: InsertBankAccount): Promise<BankAccount> {
    const result = await db.insert(bankAccounts).values(bankAccount).returning();
    return result[0];
  }

  async getBankAccount(id: number): Promise<BankAccount | undefined> {
    const result = await db.select().from(bankAccounts).where(eq(bankAccounts.id, id)).limit(1);
    return result[0];
  }

  async updateBankAccount(id: number, updates: Partial<BankAccount>): Promise<BankAccount | undefined> {
    const result = await db.update(bankAccounts)
      .set(updates)
      .where(eq(bankAccounts.id, id))
      .returning();
    return result[0];
  }

  async deleteBankAccount(id: number): Promise<boolean> {
    const result = await db.delete(bankAccounts)
      .where(eq(bankAccounts.id, id))
      .returning();
    return result.length > 0;
  }

  // Transactions
  async getTransactionsByUserId(userId: number): Promise<Transaction[]> {
    return await db.select().from(transactions).where(eq(transactions.userId, userId)).orderBy(desc(transactions.createdAt));
  }

  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const result = await db.insert(transactions).values(transaction).returning();
    return result[0];
  }

  async updateTransaction(id: number, updates: Partial<Transaction>): Promise<Transaction | undefined> {
    const result = await db.update(transactions).set(updates).where(eq(transactions.id, id)).returning();
    return result[0];
  }

  async getAllTransactions(): Promise<Transaction[]> {
    return await db.select().from(transactions).orderBy(desc(transactions.createdAt));
  }

  // Betting orders
  async getBettingOrdersByUserId(userId: number): Promise<BettingOrder[]> {
    const result = await db
      .select({
        id: bettingOrders.id,
        userId: bettingOrders.userId,
        username: users.username,
        orderId: bettingOrders.orderId,
        asset: bettingOrders.asset,
        amount: bettingOrders.amount,
        direction: bettingOrders.direction,
        duration: bettingOrders.duration,
        entryPrice: bettingOrders.entryPrice,
        exitPrice: bettingOrders.exitPrice,
        status: bettingOrders.status,
        result: bettingOrders.result,
        createdAt: bettingOrders.createdAt,
        expiresAt: bettingOrders.expiresAt,
      })
      .from(bettingOrders)
      .leftJoin(users, eq(bettingOrders.userId, users.id))
      .where(eq(bettingOrders.userId, userId))
      .orderBy(desc(bettingOrders.createdAt));
    
    return result as BettingOrder[];
  }

  async createBettingOrder(order: any): Promise<BettingOrder> {
    const result = await db.insert(bettingOrders).values(order).returning();
    
    // Set up order expiration with both setTimeout and periodic check
    setTimeout(async () => {
      await this.expireOrder(result[0].id);
    }, order.duration * 1000);
    
    return result[0];
  }

  // Periodic check for expired orders (called every 10 seconds)
  async checkExpiredOrders(): Promise<void> {
    try {
      const activeOrders = await db.select()
        .from(bettingOrders)
        .where(eq(bettingOrders.status, "active"));

      for (const order of activeOrders) {
        if (order.expiresAt && new Date() > new Date(order.expiresAt)) {
          console.log(`Found expired order: ${order.orderId}, expiring now...`);
          await this.expireOrder(order.id);
        }
      }
    } catch (error) {
      console.error('Error checking expired orders:', error);
    }
  }

  private async expireOrder(orderId: number) {
    try {
      const orderResult = await db.select().from(bettingOrders).where(eq(bettingOrders.id, orderId));
      const order = orderResult[0];
      
      if (!order || order.status !== "active") return;

      // Get user for direction-based profit calculation
      const userResult = await db.select().from(users).where(eq(users.id, order.userId));
      const user = userResult[0];
      
      if (!user) return;

      // Calculate profit based on duration scale (percentage)
      const orderAmount = parseFloat(order.amount);
      const profitPercentage = this.getScaleBasedProfitPercentage(order.duration);
      const baseProfitAmount = orderAmount * (profitPercentage / 100);
      
      // Apply direction-based profit calculation using user's Member Management direction setting
      let finalProfitAmount = baseProfitAmount; // Always positive for customer display
      let result: "win" | "loss" = "win";
      let balanceImpact = baseProfitAmount; // This affects actual balance calculation
      
      if (user.direction === "Actual") {
        // When user direction is "Actual", use the order's stored direction (customer's actual choice)
        if (order.direction === "Buy Up") {
          balanceImpact = baseProfitAmount;
          result = "win";
        } else if (order.direction === "Buy Down") {
          balanceImpact = -baseProfitAmount;
          result = "loss";
        } else {
          // Fallback
          balanceImpact = baseProfitAmount;
          result = "win";
        }
      } else if (user.direction === "Buy Up") {
        // Buy Up = Profit is added to balance (positive impact)
        balanceImpact = baseProfitAmount;
        result = "win";
      } else if (user.direction === "Buy Down") {
        // Buy Down = Profit is subtracted from balance (negative impact) but shown as positive to customer
        balanceImpact = -baseProfitAmount;
        result = "loss"; // For display purposes, but profit amount stays positive
      }

      // Update user's balance
      const currentAvailable = parseFloat(user.availableBalance || user.balance || "0");
      const currentBalance = parseFloat(user.balance || "0");
      
      // Return original order amount + calculated profit to available balance (using balanceImpact)
      const newAvailable = currentAvailable + orderAmount + balanceImpact;
      // Add/subtract profit to/from total balance (using balanceImpact)
      const newBalance = currentBalance + balanceImpact;

      // Update VIP Level based on profit/loss (5 point increase/decrease, max 100)
      let newReputation = user.reputation || 100;
      if (user.direction === "Actual") {
        // Actual direction: no change to reputation
        newReputation = user.reputation || 100;
      } else if (balanceImpact > 0) {
        // Profit: increase VIP level by 5 (max 100)
        newReputation = Math.min(100, newReputation + 5);
      } else if (balanceImpact < 0) {
        // Loss: decrease VIP level by 5 (min 0)
        newReputation = Math.max(0, newReputation - 5);
      }

      // Update user balance and reputation
      await db.update(users).set({
        availableBalance: newAvailable.toFixed(2),
        balance: newBalance.toFixed(2),
        reputation: newReputation,
      }).where(eq(users.id, order.userId));

      // Update order status
      await db.update(bettingOrders).set({
        status: "completed",
        result,
        exitPrice: order.entryPrice, // Using same price for simplicity
      }).where(eq(bettingOrders.id, orderId));

      console.log(`Order ${order.orderId} expired and completed with ${profitPercentage}% profit: +${finalProfitAmount.toFixed(2)} (User Direction: ${user.direction}, Balance Impact: ${balanceImpact >= 0 ? '+' : ''}${balanceImpact.toFixed(2)})`);
    } catch (error) {
      console.error('Error expiring order:', error);
    }
  }

  private getScaleBasedProfitPercentage(duration: number): number {
    switch (duration) {
      case 30: return 20;   // 30 seconds = 20%
      case 60: return 30;   // 60 seconds = 30%
      case 120: return 40;  // 120 seconds = 40%
      case 180: return 50;  // 180 seconds = 50%
      case 240: return 60;  // 240 seconds = 60%
      default: return 20;   // Default to 20%
    }
  }

  async updateBettingOrder(id: number, updates: Partial<BettingOrder>): Promise<BettingOrder | undefined> {
    const result = await db.update(bettingOrders).set(updates).where(eq(bettingOrders.id, id)).returning();
    return result[0];
  }

  async getAllBettingOrders(): Promise<BettingOrder[]> {
    const result = await db
      .select({
        id: bettingOrders.id,
        userId: bettingOrders.userId,
        username: users.username,
        orderId: bettingOrders.orderId,
        asset: bettingOrders.asset,
        amount: bettingOrders.amount,
        direction: bettingOrders.direction,
        duration: bettingOrders.duration,
        entryPrice: bettingOrders.entryPrice,
        exitPrice: bettingOrders.exitPrice,
        status: bettingOrders.status,
        result: bettingOrders.result,
        createdAt: bettingOrders.createdAt,
        expiresAt: bettingOrders.expiresAt,
      })
      .from(bettingOrders)
      .leftJoin(users, eq(bettingOrders.userId, users.id))
      .orderBy(desc(bettingOrders.createdAt));
    
    return result as BettingOrder[];
  }

  async getActiveBettingOrders(): Promise<BettingOrder[]> {
    const result = await db
      .select({
        id: bettingOrders.id,
        userId: bettingOrders.userId,
        username: users.username,
        orderId: bettingOrders.orderId,
        asset: bettingOrders.asset,
        amount: bettingOrders.amount,
        direction: bettingOrders.direction,
        duration: bettingOrders.duration,
        entryPrice: bettingOrders.entryPrice,
        exitPrice: bettingOrders.exitPrice,
        status: bettingOrders.status,
        result: bettingOrders.result,
        createdAt: bettingOrders.createdAt,
        expiresAt: bettingOrders.expiresAt,
      })
      .from(bettingOrders)
      .leftJoin(users, eq(bettingOrders.userId, users.id))
      .where(eq(bettingOrders.status, "active"))
      .orderBy(desc(bettingOrders.createdAt));
    
    return result as BettingOrder[];
  }

  // Withdrawal requests
  async getWithdrawalRequestsByUserId(userId: number): Promise<WithdrawalRequest[]> {
    return await db.select().from(withdrawalRequests).where(eq(withdrawalRequests.userId, userId)).orderBy(desc(withdrawalRequests.createdAt));
  }

  async createWithdrawalRequest(request: InsertWithdrawalRequest): Promise<WithdrawalRequest> {
    const result = await db.insert(withdrawalRequests).values(request).returning();
    return result[0];
  }

  async updateWithdrawalRequest(id: number, updates: Partial<WithdrawalRequest>): Promise<WithdrawalRequest | undefined> {
    const result = await db.update(withdrawalRequests).set(updates).where(eq(withdrawalRequests.id, id)).returning();
    return result[0];
  }

  async getPendingWithdrawalRequests(): Promise<WithdrawalRequest[]> {
    return await db.select().from(withdrawalRequests).where(eq(withdrawalRequests.status, "pending")).orderBy(desc(withdrawalRequests.createdAt));
  }

  // Announcements
  async getActiveAnnouncements(): Promise<Announcement[]> {
    return await db.select().from(announcements).where(eq(announcements.isActive, true)).orderBy(desc(announcements.createdAt));
  }

  async createAnnouncement(announcement: InsertAnnouncement): Promise<Announcement> {
    const result = await db.insert(announcements).values(announcement).returning();
    return result[0];
  }

  async updateAnnouncement(id: number, updates: Partial<Announcement>): Promise<Announcement | undefined> {
    const result = await db.update(announcements).set(updates).where(eq(announcements.id, id)).returning();
    return result[0];
  }

  async getAllAnnouncements(): Promise<Announcement[]> {
    return await db.select().from(announcements).orderBy(desc(announcements.createdAt));
  }

  async getAllBankAccountsWithUsers(): Promise<any[]> {
    return await db
      .select({
        userId: users.id,
        userName: users.name,
        userEmail: users.email,
        bankAccountId: bankAccounts.id,
        accountHolderName: bankAccounts.accountHolderName,
        bankName: bankAccounts.bankName,
        accountNumber: bankAccounts.accountNumber,
        branchName: bankAccounts.branchName,
        ifscCode: bankAccounts.ifscCode,
      })
      .from(users)
      .leftJoin(bankAccounts, eq(users.id, bankAccounts.userId))
      .where(eq(users.role, "customer"))
      .orderBy(users.id, bankAccounts.id);
  }

  // Messages
  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const result = await db.insert(messages).values(insertMessage).returning();
    return result[0];
  }

  async getMessagesByUserId(userId: number): Promise<Message[]> {
    return await db.select().from(messages).where(eq(messages.toUserId, userId)).orderBy(desc(messages.createdAt));
  }

  async markMessageAsRead(id: number): Promise<boolean> {
    try {
      await db.update(messages).set({ isRead: true }).where(eq(messages.id, id));
      return true;
    } catch (error) {
      return false;
    }
  }

  // Sessions
  async createSession(insertSession: InsertSession): Promise<Session> {
    const result = await db.insert(sessions).values(insertSession).returning();
    return result[0];
  }

  async getSession(sessionId: string): Promise<Session | undefined> {
    const result = await db.select().from(sessions).where(eq(sessions.id, sessionId)).limit(1);
    return result[0];
  }

  async deleteSession(sessionId: string): Promise<boolean> {
    try {
      await db.delete(sessions).where(eq(sessions.id, sessionId));
      return true;
    } catch (error) {
      return false;
    }
  }

  async cleanupExpiredSessions(): Promise<number> {
    try {
      const now = new Date();
      const result = await db.delete(sessions).where(eq(sessions.expiresAt, now));
      return result.rowCount || 0;
    } catch (error) {
      return 0;
    }
  }

  async updateMessage(id: number, updates: Partial<Message>): Promise<Message | undefined> {
    try {
      const result = await db.update(messages).set(updates).where(eq(messages.id, id)).returning();
      return result[0];
    } catch (error) {
      return undefined;
    }
  }
}