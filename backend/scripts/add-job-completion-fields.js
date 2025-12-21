import "reflect-metadata";
import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

async function addJobCompletionFields() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "gbridge_db",
  });

  try {
    console.log("Checking if completion fields exist in job_applications...");

    // Check if columns exist
    const [columns] = await connection.query(
      "SHOW COLUMNS FROM job_applications WHERE Field IN ('completionRequestedBy', 'completionConfirmedBy', 'completedAt')"
    );

    const existingColumns = columns.map((col) => col.Field);
    const hasCompletionRequestedBy = existingColumns.includes(
      "completionRequestedBy"
    );
    const hasCompletionConfirmedBy = existingColumns.includes(
      "completionConfirmedBy"
    );
    const hasCompletedAt = existingColumns.includes("completedAt");

    if (!hasCompletionRequestedBy) {
      console.log("Adding completionRequestedBy column...");
      await connection.query(
        "ALTER TABLE job_applications ADD COLUMN completionRequestedBy INT NULL COMMENT 'User ID who requested completion' AFTER reviewNotes"
      );
      console.log("✅ completionRequestedBy column added");
    } else {
      console.log("✅ completionRequestedBy column already exists");
    }

    if (!hasCompletionConfirmedBy) {
      console.log("Adding completionConfirmedBy column...");
      await connection.query(
        "ALTER TABLE job_applications ADD COLUMN completionConfirmedBy INT NULL COMMENT 'User ID who confirmed completion' AFTER completionRequestedBy"
      );
      console.log("✅ completionConfirmedBy column added");
    } else {
      console.log("✅ completionConfirmedBy column already exists");
    }

    if (!hasCompletedAt) {
      console.log("Adding completedAt column...");
      await connection.query(
        "ALTER TABLE job_applications ADD COLUMN completedAt DATETIME NULL COMMENT 'When job was marked as completed' AFTER completionConfirmedBy"
      );
      console.log("✅ completedAt column added");
    } else {
      console.log("✅ completedAt column already exists");
    }

    console.log("\n✅ Database schema updated successfully!");
  } catch (error) {
    console.error("Error updating database:", error);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

addJobCompletionFields();
