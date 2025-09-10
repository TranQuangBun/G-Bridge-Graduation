import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

export const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: "mysql",
    logging: false,
    define: {
      freezeTableName: true,
      underscored: true,
    },
  }
);

export async function initDatabase() {
  try {
    await sequelize.authenticate();
    console.log("✅ Database connection established");
    await sequelize.sync();
    console.log("✅ Models synchronized");
  } catch (err) {
    console.error("❌ Database connection failed:", err.message);
    process.exit(1);
  }
}
