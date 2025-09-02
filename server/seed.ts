import { db } from "./db";
import { users, bettingOrders } from "@shared/schema";
import { eq } from "drizzle-orm";

export async function seedDatabase() {
  try {
    // Check if admin user already exists
    const existingAdmin = await db.select().from(users).where(eq(users.username, "admin")).limit(1);
    
    if (existingAdmin.length === 0) {
      console.log("Seeding database with initial data...");
      
      // Create admin user
      const adminUser = await db.insert(users).values({
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
        accountStatus: "Active",
        withdrawalStatus: "Allowed",
        isActive: true,
      }).returning();
      
      console.log("Created admin user:", adminUser[0].username);

      // Create customer user
      const customerUser = await db.insert(users).values({
        username: "sarah",
        email: "sarah@email.com",
        password: "password123",
        name: "Sarah Johnson",
        role: "customer",
        balance: "10500.00",
        availableBalance: "10000.00",
        frozenBalance: "500.00",
        reputation: 85,
        winLoseSetting: "To Win",
        direction: "Actual",
        accountStatus: "Active",
        withdrawalStatus: "Allowed",
        isActive: true,
      }).returning();
      
      console.log("Created customer user:", customerUser[0].username);

      // Add sample betting orders for the customer
      const baseTime = new Date('2025-06-08T13:03:49.000Z');
      
      const sampleOrders = [
        {
          userId: customerUser[0].id,
          orderId: "ORD-" + Date.now() + "-1",
          asset: "BTC/USDT",
          direction: "Buy Down",
          amount: "12000",
          entryPrice: "42150.00",
          duration: 120,
          status: "completed",
          result: "win",
          exitPrice: "41950.00",
          expiresAt: new Date(baseTime.getTime() + 120000)
        },
        {
          userId: customerUser[0].id,
          orderId: "ORD-" + Date.now() + "-2",
          asset: "BTC/USDT",
          direction: "Buy Down",
          amount: "12000",
          entryPrice: "42200.00",
          duration: 60,
          status: "completed",
          result: "win",
          exitPrice: "41800.00",
          expiresAt: new Date(baseTime.getTime() - 3600000 + 60000)
        },
        {
          userId: customerUser[0].id,
          orderId: "ORD-" + Date.now() + "-3",
          asset: "BTC/USDT",
          direction: "Buy Up",
          amount: "8000",
          entryPrice: "41900.00",
          duration: 60,
          status: "completed",
          result: "win",
          exitPrice: "42150.00",
          expiresAt: new Date(baseTime.getTime() - 7200000 + 60000)
        },
        {
          userId: customerUser[0].id,
          orderId: "ORD-" + Date.now() + "-4",
          asset: "ETH/USDT",
          direction: "Buy Up",
          amount: "5000",
          entryPrice: "2450.00",
          duration: 180,
          status: "active",
          result: null,
          exitPrice: null,
          expiresAt: new Date(Date.now() + 180000)
        },
        {
          userId: customerUser[0].id,
          orderId: "ORD-" + Date.now() + "-5",
          asset: "BTC/USDT",
          direction: "Buy Down",
          amount: "3000",
          entryPrice: "42000.00",
          duration: 90,
          status: "cancelled",
          result: null,
          exitPrice: null,
          expiresAt: new Date(Date.now() - 86400000 + 90000)
        }
      ];

      for (const order of sampleOrders) {
        await db.insert(bettingOrders).values(order);
      }
      
      console.log(`Created ${sampleOrders.length} sample betting orders`);
      console.log("Database seeding completed successfully");
    } else {
      console.log("Database already seeded, skipping...");
    }
  } catch (error) {
    console.error("Error seeding database:", error);
    throw error;
  }
}