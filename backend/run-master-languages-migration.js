import { sequelize } from "./src/config/database.js";
import fs from "fs";

async function runMigration() {
  try {
    const sql = fs.readFileSync(
      "./migrations/create-master-languages.sql",
      "utf8"
    );

    // Split by semicolon and execute each statement
    const statements = sql.split(";").filter((s) => s.trim());

    for (const statement of statements) {
      if (statement.trim()) {
        console.log(`\nExecuting: ${statement.substring(0, 60)}...`);
        await sequelize.query(statement);
        console.log("✓ Success");
      }
    }

    console.log("\n✅ Migration completed successfully!");
  } catch (error) {
    console.error("❌ Migration error:", error.message);
  } finally {
    await sequelize.close();
  }
}

runMigration();
