import "reflect-metadata";
import { DataSource } from "typeorm";
import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

async function addDeleteColumns() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "gbridge_db",
  });

  try {
    console.log("Checking if deletedAt and deletedBy columns exist...");

    // Check if columns exist
    const [columns] = await connection.query(
      "SHOW COLUMNS FROM messages WHERE Field IN ('deletedAt', 'deletedBy')"
    );

    const existingColumns = columns.map((col) => col.Field);
    const hasDeletedAt = existingColumns.includes("deletedAt");
    const hasDeletedBy = existingColumns.includes("deletedBy");

    if (!hasDeletedAt) {
      console.log("Adding deletedAt column...");
      await connection.query(
        "ALTER TABLE messages ADD COLUMN deletedAt DATETIME NULL AFTER fileSize"
      );
      console.log("✅ deletedAt column added");
    } else {
      console.log("✅ deletedAt column already exists");
    }

    if (!hasDeletedBy) {
      console.log("Adding deletedBy column...");
      await connection.query(
        "ALTER TABLE messages ADD COLUMN deletedBy INT NULL AFTER deletedAt"
      );
      console.log("✅ deletedBy column added");
    } else {
      console.log("✅ deletedBy column already exists");
    }

    console.log("\n✅ Database schema updated successfully!");
  } catch (error) {
    console.error("Error updating database:", error);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

addDeleteColumns();
