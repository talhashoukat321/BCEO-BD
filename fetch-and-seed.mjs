import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { users } from './shared/schema.ts';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;

const SOURCE_DB_URL = "postgresql://neondb_owner:npg_OZ42sVpkPlyI@ep-solitary-butterfly-ae7p9tzs.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require";
const TARGET_DB_URL = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_OZ42sVpkPlyI@ep-solitary-butterfly-ae7p9tzs.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require";

const sourcePool = new Pool({ connectionString: SOURCE_DB_URL });
const targetPool = new Pool({ connectionString: TARGET_DB_URL });

const sourceDb = drizzle({ client: sourcePool });
const targetDb = drizzle({ client: targetPool });

async function fetchAndSeedMembers() {
  try {
    console.log("Fetching all member data from source database...");
    
    // Fetch all users from source database
    const sourceUsers = await sourceDb.select().from(users);
    console.log(`Found ${sourceUsers.length} users in source database`);
    
    if (sourceUsers.length === 0) {
      console.log("No users found in source database");
      return;
    }
    
    // Display first few users for verification
    console.log("\nFirst 5 users from source:");
    sourceUsers.slice(0, 5).forEach(user => {
      console.log(`- ${user.username} (${user.role}) - ${user.email}`);
    });
    
    console.log("\nSeeding users into target database...");
    
    // Clear existing users first (handle foreign key constraints)
    await targetDb.delete(users);
    console.log("Cleared existing users");
    
    // Insert all users from source
    let successCount = 0;
    for (const user of sourceUsers) {
      try {
        await targetDb.insert(users).values(user);
        successCount++;
      } catch (error) {
        console.log(`Failed to insert user ${user.username}: ${error.message}`);
      }
    }
    
    console.log(`\nSuccessfully seeded ${successCount} out of ${sourceUsers.length} users`);
    
    // Verify the seeding
    const targetUsers = await targetDb.select().from(users);
    console.log(`\nVerification: Target database now has ${targetUsers.length} users`);
    
    // Show user breakdown by role
    const roleBreakdown = targetUsers.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {});
    
    console.log("\nUser breakdown by role:");
    Object.entries(roleBreakdown).forEach(([role, count]) => {
      console.log(`- ${role}: ${count} users`);
    });
    
  } catch (error) {
    console.error("Error fetching and seeding members:", error);
    throw error;
  } finally {
    await sourcePool.end();
    await targetPool.end();
  }
}

fetchAndSeedMembers().catch(console.error);