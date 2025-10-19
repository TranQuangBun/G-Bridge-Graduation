import { initDatabase } from "./config/database.js";
import { syncDatabase } from "./models/index.js";
import { seedJobData } from "./seeds/jobSeeds.js";

async function runMigration() {
  try {
    console.log("🔄 Starting database migration...\n");

    // Initialize database
    console.log("1️⃣ Initializing database connection...");
    await initDatabase();

    // Sync models
    console.log("\n2️⃣ Syncing database models...");
    await syncDatabase(false); // Set to true to recreate all tables

    // Seed data
    console.log("\n3️⃣ Seeding job-related data...");
    await seedJobData();

    console.log("\n✅ Migration completed successfully!");
    console.log("\n" + "=".repeat(60));
    console.log("Database is ready for use!");
    console.log("=".repeat(60));

    process.exit(0);
  } catch (error) {
    console.error("\n❌ Migration failed:", error);
    process.exit(1);
  }
}

runMigration();
