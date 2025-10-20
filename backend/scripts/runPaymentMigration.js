import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import mysql from "mysql2/promise";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runMigration() {
  let connection;

  try {
    console.log("🔄 Starting payment tables migration...\n");

    // Create connection
    console.log("1️⃣ Connecting to database...");
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "gbridge_db",
      multipleStatements: true, // Allow multiple SQL statements
    });
    console.log("✅ Database connected\n");

    // Read SQL file
    console.log("2️⃣ Reading migration file...");
    const sqlPath = join(
      __dirname,
      "../src/migrations/create-payment-tables.sql"
    );
    const sql = readFileSync(sqlPath, "utf8");
    console.log("✅ Migration file loaded\n");

    // Execute SQL
    console.log("3️⃣ Executing migration...");
    console.log("   Creating tables:");
    console.log("   - subscription_plans");
    console.log("   - payments");
    console.log("   - user_subscriptions");
    console.log("   - payment_webhooks");
    console.log("   - payment_refunds\n");

    await connection.query(sql);
    console.log("✅ All tables created successfully\n");

    // Verify tables
    console.log("4️⃣ Verifying tables...");
    const [tables] = await connection.query(
      `
      SELECT TABLE_NAME, TABLE_ROWS, CREATE_TIME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME IN ('subscription_plans', 'payments', 'user_subscriptions', 'payment_webhooks', 'payment_refunds')
      ORDER BY TABLE_NAME
    `,
      [process.env.DB_NAME || "gbridge_db"]
    );

    console.log("\n📊 Tables created:");
    console.table(tables);

    // Check subscription plans data
    const [plans] = await connection.query(
      "SELECT id, name, displayName, price, currency, durationType FROM subscription_plans ORDER BY sortOrder"
    );
    console.log("\n💰 Subscription Plans seeded:");
    console.table(plans);

    console.log("\n" + "=".repeat(70));
    console.log("✅ MIGRATION COMPLETED SUCCESSFULLY!");
    console.log("=".repeat(70));
    console.log("\n📝 Next steps:");
    console.log(
      "   1. Create Sequelize models (Payment, SubscriptionPlan, UserSubscription)"
    );
    console.log("   2. Create payment controllers");
    console.log("   3. Create payment routes");
    console.log("   4. Integrate VNPay and PayPal SDKs");
    console.log("=".repeat(70) + "\n");
  } catch (error) {
    console.error("\n❌ Migration failed:");
    console.error(error.message);

    if (error.code === "ER_TABLE_EXISTS_ERROR") {
      console.log(
        "\n💡 Tables already exist. If you want to recreate them, run:"
      );
      console.log(
        "   DROP TABLE payment_refunds, payment_webhooks, user_subscriptions, payments, subscription_plans;"
      );
    }

    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log("🔌 Database connection closed");
    }
  }
}

// Run migration
runMigration();
