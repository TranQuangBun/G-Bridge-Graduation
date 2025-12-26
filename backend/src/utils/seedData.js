import { AppDataSource } from "../config/DataSource.js";
import { WorkingMode } from "../entities/WorkingMode.js";
import { Level } from "../entities/Level.js";
import { ApplicationStatus } from "../entities/ApplicationStatus.js";
import { JobApplication } from "../entities/JobApplication.js";
import { ApplicationStatusEnum } from "../entities/JobApplication.js";
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

const DEFAULT_APPLICATION_STATUSES = [
  { name: "pending", nameVi: "Đang chờ", description: "Application is pending review" },
  { name: "approved", nameVi: "Đã chấp nhận", description: "Application has been approved" },
  { name: "rejected", nameVi: "Đã từ chối", description: "Application has been rejected" },
  { name: "withdrawn", nameVi: "Đã rút lại", description: "Application has been withdrawn by applicant" },
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
 * Seed application statuses if they don't exist
 */
async function seedApplicationStatuses() {
  try {
    const applicationStatusRepository = AppDataSource.getRepository(ApplicationStatus);
    
    for (const statusData of DEFAULT_APPLICATION_STATUSES) {
      const existing = await applicationStatusRepository.findOne({
        where: { name: statusData.name },
      });
      
      if (!existing) {
        await applicationStatusRepository.save(statusData);
        logger.info(`Seeded application status: ${statusData.name}`);
      }
    }
    
    logger.info("Application statuses seeding completed");
  } catch (error) {
    logger.error("Error seeding application statuses", error);
  }
}

/**
 * Update existing job applications to set statusId from status field
 * This handles migration from enum to foreign key
 */
async function updateApplicationStatusIds() {
  try {
    const applicationStatusRepository = AppDataSource.getRepository(ApplicationStatus);
    const jobApplicationRepository = AppDataSource.getRepository(JobApplication);
    
    // Get all status mappings
    const statusMap = {};
    for (const statusName of Object.values(ApplicationStatusEnum)) {
      const statusEntity = await applicationStatusRepository.findOne({
        where: { name: statusName },
      });
      if (statusEntity) {
        statusMap[statusName] = statusEntity.id;
      }
    }
    
    // Find all applications without statusId
    const applicationsWithoutStatusId = await jobApplicationRepository.find({
      where: { statusId: null },
    });
    
    if (applicationsWithoutStatusId.length > 0) {
      logger.info(`Updating ${applicationsWithoutStatusId.length} job applications with statusId...`);
      
      for (const application of applicationsWithoutStatusId) {
        const statusName = application.status || ApplicationStatusEnum.PENDING;
        const statusId = statusMap[statusName] || statusMap[ApplicationStatusEnum.PENDING];
        
        if (statusId) {
          await jobApplicationRepository.update(application.id, {
            statusId: statusId,
            status: statusName, // Keep status field for backward compatibility
          });
        }
      }
      
      logger.info("Application statusId update completed");
    }
  } catch (error) {
    logger.error("Error updating application statusIds", error);
  }
}

/**
 * Seed all default data
 * This function should be called after database initialization
 * IMPORTANT: ApplicationStatuses must be seeded before any JobApplication operations
 */
export async function seedDefaultData() {
  try {
    if (!AppDataSource.isInitialized) {
      logger.warn("Database not initialized, skipping seed");
      return;
    }

    logger.info("Starting data seeding...");
    // Seed ApplicationStatuses first (required for JobApplication foreign key)
    await seedApplicationStatuses();
    // Update existing applications to set statusId
    await updateApplicationStatusIds();
    await seedWorkingModes();
    await seedLevels();
    logger.info("Data seeding completed successfully");
  } catch (error) {
    logger.error("Error during data seeding", error);
    // Don't throw - seeding failure shouldn't prevent server startup
  }
}

