import { pgTable, text, serial, integer, boolean, decimal, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull().default("customer"), // customer, admin
  balance: decimal("balance", { precision: 10, scale: 2 }).notNull().default("0.00"),
  availableBalance: decimal("available_balance", { precision: 10, scale: 2 }).notNull().default("0.00"),
  frozenBalance: decimal("frozen_balance", { precision: 10, scale: 2 }).notNull().default("0.00"),
  reputation: integer("reputation").notNull().default(100), // VIP Level (auto-adjusted by betting outcomes)
  creditScore: integer("credit_score").notNull().default(100), // Credit Score (manually set by admin)
  winLoseSetting: text("win_lose_setting").notNull().default("To Win"), // To Win, To Lose, Random
  direction: text("direction").notNull().default("Actual"), // Buy Up, Buy Down, Actual
  isBanned: boolean("is_banned").notNull().default(false),
  withdrawalProhibited: boolean("withdrawal_prohibited").notNull().default(false),
  tasksBan: text("tasks_ban").notNull().default("Allowed"), // Allowed, Prohibit
  fundPassword: text("fund_password"),
  agentInvitationCode: text("agent_invitation_code"),
  invitationCode: text("invitation_code"),
  userType: text("user_type").notNull().default("Normal"), // Normal, VIP, Agent
  generalAgent: text("general_agent"),
  remark: text("remark"),
  registrationTime: timestamp("registration_time").notNull().defaultNow(),
  profileImage: text("profile_image"),
  signatureData: text("signature_data"),
  signatureName: text("signature_name"),
  isActive: boolean("is_active").notNull().default(true),
});

export const bankAccounts = pgTable("bank_accounts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  bindingType: text("binding_type").notNull().default("Bank Card"), // Bank Card, etc.
  currency: text("currency").notNull().default("INR"), // INR, USD, etc.
  accountNumber: text("account_number").notNull(),
  accountHolderName: text("account_holder_name").notNull(),
  bankName: text("bank_name").notNull(),
  branchName: text("branch_name"), // nullable - not required
  ifscCode: text("ifsc_code"), // nullable - not required (IFSC Code for Indian banking)
  isDefault: boolean("is_default").notNull().default(false),
});

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  type: text("type").notNull(), // deposit, withdrawal, trade_win, trade_loss, freeze, unfreeze
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("pending"), // pending, completed, rejected
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const bettingOrders = pgTable("betting_orders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  orderId: text("order_id").notNull().unique(),
  asset: text("asset").notNull(), // BTC/USD, ETH/USD
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  direction: text("direction").notNull(), // Buy Up, Buy Down
  duration: integer("duration").notNull(), // in seconds: 30, 60, 120, 180, 240
  entryPrice: decimal("entry_price", { precision: 10, scale: 2 }).notNull(),
  exitPrice: decimal("exit_price", { precision: 10, scale: 2 }),
  profitLoss: decimal("profit_loss", { precision: 10, scale: 2 }), // Calculated profit/loss amount
  status: text("status").notNull().default("active"), // active, completed, cancelled
  result: text("result"), // win, loss
  createdAt: timestamp("created_at").notNull().defaultNow(),
  expiresAt: timestamp("expires_at").notNull(),
});

export const withdrawalRequests = pgTable("withdrawal_requests", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  bankAccountId: integer("bank_account_id").notNull().references(() => bankAccounts.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("pending"), // pending, approved, rejected
  note: text("note"), // admin note for rejection/approval
  createdAt: timestamp("created_at").notNull().defaultNow(),
  processedAt: timestamp("processed_at"),
});

export const announcements = pgTable("announcements", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  type: text("type").notNull().default("News"), // News, Important, Maintenance, Update
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  fromUserId: integer("from_user_id").notNull().references(() => users.id), // Admin user ID
  toUserId: integer("to_user_id").notNull().references(() => users.id), // Customer user ID
  title: text("title").notNull(),
  content: text("content").notNull(),
  type: text("type").notNull().default("General"), // General, Important, Support, System
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  expiresAt: timestamp("expires_at").notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  balance: true,
  availableBalance: true,
  frozenBalance: true,
  reputation: true,
  creditScore: true,
  winLoseSetting: true,
  direction: true,
  isBanned: true,
  withdrawalProhibited: true,
  tasksBan: true,
  userType: true,
  registrationTime: true,
  isActive: true,
});

export const insertBankAccountSchema = createInsertSchema(bankAccounts).omit({
  id: true,
  isDefault: true,
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
});

export const insertBettingOrderSchema = createInsertSchema(bettingOrders).omit({
  id: true,
  exitPrice: true,
  status: true,
  result: true,
  createdAt: true,
  expiresAt: true,
});

export const insertWithdrawalRequestSchema = createInsertSchema(withdrawalRequests).omit({
  id: true,
  status: true,
  createdAt: true,
  processedAt: true,
});

export const insertAnnouncementSchema = createInsertSchema(announcements).omit({
  id: true,
  isActive: true,
  createdAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  isRead: true,
  createdAt: true,
});

export const insertSessionSchema = createInsertSchema(sessions).omit({
  createdAt: true,
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  bankAccounts: many(bankAccounts),
  transactions: many(transactions),
  bettingOrders: many(bettingOrders),
  withdrawalRequests: many(withdrawalRequests),
  sentMessages: many(messages, { relationName: "sentMessages" }),
  receivedMessages: many(messages, { relationName: "receivedMessages" }),
}));

export const bankAccountsRelations = relations(bankAccounts, ({ one }) => ({
  user: one(users, {
    fields: [bankAccounts.userId],
    references: [users.id],
  }),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(users, {
    fields: [transactions.userId],
    references: [users.id],
  }),
}));

export const bettingOrdersRelations = relations(bettingOrders, ({ one }) => ({
  user: one(users, {
    fields: [bettingOrders.userId],
    references: [users.id],
  }),
}));

export const withdrawalRequestsRelations = relations(withdrawalRequests, ({ one }) => ({
  user: one(users, {
    fields: [withdrawalRequests.userId],
    references: [users.id],
  }),
  bankAccount: one(bankAccounts, {
    fields: [withdrawalRequests.bankAccountId],
    references: [bankAccounts.id],
  }),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  sender: one(users, {
    fields: [messages.fromUserId],
    references: [users.id],
    relationName: "sentMessages",
  }),
  recipient: one(users, {
    fields: [messages.toUserId],
    references: [users.id],
    relationName: "receivedMessages",
  }),
}));

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type BankAccount = typeof bankAccounts.$inferSelect;
export type InsertBankAccount = z.infer<typeof insertBankAccountSchema>;
export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type BettingOrder = typeof bettingOrders.$inferSelect;
export type InsertBettingOrder = z.infer<typeof insertBettingOrderSchema>;
export type WithdrawalRequest = typeof withdrawalRequests.$inferSelect;
export type InsertWithdrawalRequest = z.infer<typeof insertWithdrawalRequestSchema>;
export type Announcement = typeof announcements.$inferSelect;
export type InsertAnnouncement = z.infer<typeof insertAnnouncementSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Session = typeof sessions.$inferSelect;
export type InsertSession = z.infer<typeof insertSessionSchema>;
