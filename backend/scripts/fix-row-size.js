import "reflect-metadata";
import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

async function fixRowSize() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "gbridge_db",
  });

  try {
    console.log("Optimizing table columns to fix row size...\n");

    // Fix messages table - convert fileUrl to TEXT
    console.log("Fixing messages table...");
    await connection.query(`
      ALTER TABLE messages 
      MODIFY COLUMN fileUrl TEXT NULL,
      MODIFY COLUMN content TEXT NOT NULL
    `);
    console.log("✅ Messages table fixed");

    // Fix job_applications table - convert resumeUrl to TEXT
    console.log("\nFixing job_applications table...");
    await connection.query(`
      ALTER TABLE job_applications 
      MODIFY COLUMN resumeUrl TEXT NULL,
      MODIFY COLUMN coverLetter TEXT NULL,
      MODIFY COLUMN reviewNotes TEXT NULL
    `);
    console.log("✅ Job_applications table fixed");

    // Jobs table columns (descriptions, responsibility, benefits, reviewNotes) are already TEXT
    console.log("\n✅ Jobs table columns already TEXT type");

    // Fix payments table - convert many VARCHAR fields to TEXT
    console.log("\nFixing payments table...");
    await connection.query(`
      ALTER TABLE payments 
      MODIFY COLUMN vnpaySecureHash TEXT NULL,
      MODIFY COLUMN transactionId TEXT NULL,
      MODIFY COLUMN vnpayTransactionNo TEXT NULL,
      MODIFY COLUMN paypalOrderId TEXT NULL,
      MODIFY COLUMN momoTransId TEXT NULL,
      MODIFY COLUMN momoRequestId TEXT NULL,
      MODIFY COLUMN paypalPayerId TEXT NULL,
      MODIFY COLUMN paypalPaymentId TEXT NULL,
      MODIFY COLUMN paypalCaptureId TEXT NULL
    `);
    console.log("✅ Payments table fixed");

    // Fix booking_requests table - convert location to TEXT
    console.log("\nFixing booking_requests table...");
    await connection.query(`
      ALTER TABLE booking_requests 
      MODIFY COLUMN location TEXT NULL
    `);
    console.log("✅ Booking_requests table fixed");

    // Fix users table - convert VARCHAR(255) fields to TEXT
    console.log("\nFixing users table...");
    await connection.query(`
      ALTER TABLE users 
      MODIFY COLUMN passwordHash TEXT NOT NULL,
      MODIFY COLUMN avatar TEXT NULL,
      MODIFY COLUMN resetPasswordToken TEXT NULL
    `);
    console.log("✅ Users table fixed");

    // Fix client_profiles table - convert VARCHAR(255) fields to TEXT
    console.log("\nFixing client_profiles table...");
    await connection.query(`
      ALTER TABLE client_profiles 
      MODIFY COLUMN companyName TEXT NOT NULL,
      MODIFY COLUMN website TEXT NULL,
      MODIFY COLUMN logo TEXT NULL,
      MODIFY COLUMN headquarters TEXT NULL
    `);
    console.log("✅ Client_profiles table fixed");

    // Fix organizations table - convert VARCHAR(255) fields to TEXT
    console.log("\nFixing organizations table...");
    await connection.query(`
      ALTER TABLE organizations 
      MODIFY COLUMN logo TEXT NULL,
      MODIFY COLUMN website TEXT NULL
    `);
    console.log("✅ Organizations table fixed");

    console.log("\n✅ All tables optimized successfully!");
  } catch (error) {
    console.error("Error optimizing tables:", error);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

fixRowSize();
