import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

export const sequelize = new Sequelize(
  process.env.DB_NAME || "gbridge_db",
  process.env.DB_USER || "root",
  process.env.DB_PASSWORD || "",
  {
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 3306,
    dialect: "mysql",
    logging: process.env.NODE_ENV === "development" ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  }
);

export async function initDatabase() {
  try {
    await sequelize.authenticate();
    console.log("✓ Database connection established successfully");
    return sequelize;
  } catch (error) {
    console.error("✗ Unable to connect to database:", error.message);
    throw error;
  }
}
