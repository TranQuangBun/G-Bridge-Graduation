import "reflect-metadata";
import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

async function rollbackConversationApplicationId() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "gbridge_db",
  });

  try {
    console.log("Removing applicationId from conversations...");

    // Drop index first
    try {
      await connection.query(
        "ALTER TABLE conversations DROP INDEX IDX_conversations_applicationId"
      );
      console.log("✅ Index dropped");
    } catch (error) {
      console.log("Index may not exist, continuing...");
    }

    // Drop column
    const [columns] = await connection.query(
      "SHOW COLUMNS FROM conversations WHERE Field = 'applicationId'"
    );

    if (columns.length > 0) {
      await connection.query(
        "ALTER TABLE conversations DROP COLUMN applicationId"
      );
      console.log("✅ applicationId column removed");
    } else {
      console.log("✅ applicationId column doesn't exist");
    }

    console.log("\n✅ Rollback completed successfully!");
  } catch (error) {
    console.error("Error during rollback:", error);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

rollbackConversationApplicationId();
