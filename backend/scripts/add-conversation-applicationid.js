import "reflect-metadata";
import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

async function addConversationApplicationId() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "gbridge_db",
  });

  try {
    console.log("Checking if applicationId field exists in conversations...");

    const [columns] = await connection.query(
      "SHOW COLUMNS FROM conversations WHERE Field = 'applicationId'"
    );

    if (columns.length === 0) {
      console.log("Adding applicationId column...");
      await connection.query(
        "ALTER TABLE conversations ADD COLUMN applicationId INT NULL COMMENT 'Related job application ID' AFTER participant2Id, ADD INDEX IDX_conversations_applicationId (applicationId)"
      );
      console.log("✅ applicationId column added");
    } else {
      console.log("✅ applicationId column already exists");
    }

    console.log("\n✅ Database schema updated successfully!");
  } catch (error) {
    console.error("Error updating database:", error);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

addConversationApplicationId();
