import { AppDataSource } from "../config/DataSource.js";
import { WorkingMode } from "../entities/WorkingMode.js";
import { Level } from "../entities/Level.js";
import { logger } from "./Logger.js";

const DEFAULT_WORKING_MODES = [
  { name: "Full-time", nameVi: "Toàn thời gian", description: "Full-time employment" },
  { name: "Part-time", nameVi: "Bán thời gian", description: "Part-time employment" },
  { name: "Remote", nameVi: "Làm việc từ xa", description: "Remote work" },
  { name: "Hybrid", nameVi: "Làm việc kết hợp", description: "Hybrid work (remote + office)" },
  { name: "Contract", nameVi: "Hợp đồng", description: "Contract-based work" },
  { name: "Freelance", nameVi: "Tự do", description: "Freelance work" },
];

const DEFAULT_LEVELS = [
  { name: "Beginner", description: "Beginner level proficiency", order: 1 },
  { name: "Elementary", description: "Elementary level proficiency", order: 2 },
  { name: "Intermediate", description: "Intermediate level proficiency", order: 3 },
  { name: "Upper Intermediate", description: "Upper intermediate level proficiency", order: 4 },
  { name: "Advanced", description: "Advanced level proficiency", order: 5 },
  { name: "Native", description: "Native speaker level", order: 6 },
];

/**
 * Seed working modes if they don't exist
 */
async function seedWorkingModes() {
  try {
    const workingModeRepository = AppDataSource.getRepository(WorkingMode);
    
    for (const modeData of DEFAULT_WORKING_MODES) {
      const existing = await workingModeRepository.findOne({
        where: { name: modeData.name },
      });
      
      if (!existing) {
        await workingModeRepository.save(modeData);
        logger.info(`Seeded working mode: ${modeData.name}`);
      }
    }
    
    logger.info("Working modes seeding completed");
  } catch (error) {
    logger.error("Error seeding working modes", error);
  }
}

/**
 * Seed proficiency levels if they don't exist
 */
async function seedLevels() {
  try {
    const levelRepository = AppDataSource.getRepository(Level);
    
    for (const levelData of DEFAULT_LEVELS) {
      const existing = await levelRepository.findOne({
        where: { name: levelData.name },
      });
      
      if (!existing) {
        await levelRepository.save(levelData);
        logger.info(`Seeded level: ${levelData.name}`);
      }
    }
    
    logger.info("Levels seeding completed");
  } catch (error) {
    logger.error("Error seeding levels", error);
  }
}

/**
 * Seed all default data
 * This function should be called after database initialization
 */
export async function seedDefaultData() {
  try {
    if (!AppDataSource.isInitialized) {
      logger.warn("Database not initialized, skipping seed");
      return;
    }

    logger.info("Starting data seeding...");
    await seedWorkingModes();
    await seedLevels();
    logger.info("Data seeding completed successfully");
  } catch (error) {
    logger.error("Error during data seeding", error);
    // Don't throw - seeding failure shouldn't prevent server startup
  }
}

