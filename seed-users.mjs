import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { users } from './shared/schema.ts';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;

const DATABASE_URL = "postgresql://neondb_owner:npg_OZ42sVpkPlyI@ep-solitary-butterfly-ae7p9tzs.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require";

const pool = new Pool({ connectionString: DATABASE_URL });
const db = drizzle({ client: pool });

async function seedUsers() {
  try {
    console.log("Seeding users...");
    
    // Check if users already exist
    const existingUsers = await db.select().from(users);
    console.log("Existing users:", existingUsers.length);
    
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
      isActive: true,
      isBanned: false,
      withdrawalProhibited: false,
      invitationCode: "100025",
      type: "Admin",
      generalAgent: "System",
      registrationTime: new Date(),
      remark: "System Administrator"
    }).returning();
    
    console.log("Created admin user:", adminUser[0].username);

    // Create customer user - Sarah
    const sarahUser = await db.insert(users).values({
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
    }).returning();
    
    console.log("Created customer user:", sarahUser[0].username);

    // Create customer user - John
    const johnUser = await db.insert(users).values({
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
    }).returning();
    
    console.log("Created customer user:", johnUser[0].username);
    
    console.log("User seeding completed successfully");
  } catch (error) {
    console.error("Error seeding users:", error);
    throw error;
  } finally {
    await pool.end();
  }
}

seedUsers().catch(console.error);