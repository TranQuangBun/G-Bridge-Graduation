import { sequelize } from "../config/database.js";
import dotenv from "dotenv";

dotenv.config();

async function migrateClientProfiles() {
  try {
    console.log("🔄 Running migration for client_profiles table...");

    await sequelize.authenticate();
    console.log("✅ Database connection established");

    // Add new columns
    const queries = [
      `ALTER TABLE client_profiles 
       ADD COLUMN IF NOT EXISTS businessLicense VARCHAR(500) 
       COMMENT 'URL to business registration certificate image'`,

      `ALTER TABLE client_profiles 
       ADD COLUMN IF NOT EXISTS businessLicenseNumber VARCHAR(100) 
       COMMENT 'Business registration certificate number'`,

      `ALTER TABLE client_profiles 
       ADD COLUMN IF NOT EXISTS businessLicenseVerified BOOLEAN DEFAULT FALSE 
       COMMENT 'Whether business license has been verified by admin'`,

      `ALTER TABLE client_profiles 
       ADD COLUMN IF NOT EXISTS verificationNote TEXT 
       COMMENT 'Admin notes for verification (rejection reason, etc.)'`,

      `ALTER TABLE client_profiles 
       ADD COLUMN IF NOT EXISTS verifiedAt DATETIME 
       COMMENT 'Date when company was verified'`,
    ];

    for (const query of queries) {
      try {
        await sequelize.query(query);
        console.log("✅ Executed:", query.substring(0, 80) + "...");
      } catch (error) {
        if (error.original?.code === "ER_DUP_FIELDNAME") {
          console.log("⚠️ Column already exists, skipping...");
        } else {
          console.error("❌ Error executing query:", error.message);
        }
      }
    }

    // Update verificationStatus enum
    try {
      await sequelize.query(`
        ALTER TABLE client_profiles 
        MODIFY COLUMN verificationStatus 
        ENUM('unverified', 'pending', 'verified', 'rejected') 
        DEFAULT 'unverified' 
        COMMENT 'Document verification status by admin'
      `);
      console.log("✅ Updated verificationStatus enum");
    } catch (error) {
      console.log("⚠️ VerificationStatus enum may already be updated");
    }

    // Update companySize enum
    try {
      await sequelize.query(`
        ALTER TABLE client_profiles 
        MODIFY COLUMN companySize 
        ENUM('under_10', '10-50', '51-100', '101-200', '201-500', '500+') 
        COMMENT 'Company size (number of employees)'
      `);
      console.log("✅ Updated companySize enum");
    } catch (error) {
      console.log("⚠️ CompanySize enum may already be updated");
    }

    // Set existing records to 'unverified' if they don't have business license
    await sequelize.query(`
      UPDATE client_profiles 
      SET verificationStatus = 'unverified' 
      WHERE verificationStatus = 'pending' AND businessLicense IS NULL
    `);
    console.log("✅ Updated existing records status");

    console.log("\n✅ Migration completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

migrateClientProfiles();
