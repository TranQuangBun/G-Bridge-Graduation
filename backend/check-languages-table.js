import { sequelize } from "./src/config/database.js";

async function checkLanguagesTable() {
  try {
    const [results] = await sequelize.query("DESCRIBE languages");
    console.log("\n📋 Structure of languages table:");
    console.table(results);

    const [data] = await sequelize.query("SELECT * FROM languages LIMIT 10");
    console.log("\n📊 Sample data from languages table:");
    console.table(data);
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await sequelize.close();
  }
}

checkLanguagesTable();
