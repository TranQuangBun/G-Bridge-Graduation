import { DataSource } from "typeorm";
import dotenv from "dotenv";
import * as entities from "../entities/index.js";
import { logger } from "../utils/Logger.js";

dotenv.config();

const entitySchemas = Object.values(entities).filter(
  (item) =>
    item &&
    typeof item === "object" &&
    item.constructor &&
    item.constructor.name === "EntitySchema"
);

if (entitySchemas.length === 0) {
  logger.warn(
    "No EntitySchema found. Please check entities/index.js exports.",
    {
      entityCount: entitySchemas.length,
    }
  );
}

export const AppDataSource = new DataSource({
  type: "mysql",
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "3306"),
  username: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "gbridge_db",
  entities: entitySchemas,
  synchronize: false, // Disabled temporarily to avoid row size issues - use migrations instead
  logging: false,
  charset: "utf8mb4",
  extra: {
    connectionLimit: 5,
  },
});

export async function initDatabase(retries = 15, delay = 3000) {
  // Add initial delay to give MySQL more time to fully initialize
  await new Promise((resolve) => setTimeout(resolve, 2000));

  for (let i = 0; i < retries; i++) {
    try {
      await AppDataSource.initialize();
      logger.info("Database connection established", {
        host: AppDataSource.options.host,
        port: AppDataSource.options.port,
        database: AppDataSource.options.database,
        synchronize: AppDataSource.options.synchronize,
      });

      // Log synchronize status
      if (AppDataSource.options.synchronize) {
        logger.info(
          "Auto-sync enabled: Tables will be created/updated from entities"
        );
      } else {
        logger.warn("Auto-sync disabled: Use migrations to create tables");
      }

      // Seed default data after database is initialized
      try {
        const { seedDefaultData } = await import("../utils/seedData.js");
        await seedDefaultData();
      } catch (seedError) {
        logger.warn("Failed to seed default data (non-critical)", seedError);
      }

      return AppDataSource;
    } catch (error) {
      if (i === retries - 1) {
        logger.error("Error connecting to database after all retries", error);
        throw error;
      }
      logger.info("Waiting for database connection", {
        attempt: i + 1,
        maxRetries: retries,
        delay: `${delay}ms`,
      });
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}
