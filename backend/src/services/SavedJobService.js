import { SavedJobRepository } from "../repositories/SavedJobRepository.js";
import { AppDataSource } from "../config/DataSource.js";
import { User } from "../entities/User.js";
import { Job } from "../entities/Job.js";

export class SavedJobService {
  constructor() {
    this.savedJobRepository = new SavedJobRepository();
    this.userRepository = AppDataSource.getRepository(User);
    this.jobRepository = AppDataSource.getRepository(Job);
  }

  async getAllSavedJobs(query) {
    const { page = 1, limit = 20, userId = "", jobId = "" } = query;

    const filters = {};
    if (userId) filters.userId = userId;
    if (jobId) filters.jobId = jobId;

    const [savedJobs, total] = await this.savedJobRepository.findByFilters(
      filters,
      parseInt(page),
      parseInt(limit)
    );

    return {
      savedJobs,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    };
  }

  async getSavedJobById(userId, jobId) {
    const savedJob = await this.savedJobRepository.findByUserAndJob(
      userId,
      jobId
    );
    if (!savedJob) {
      throw new Error("Saved job not found");
    }
    return savedJob;
  }

  async createSavedJob(data) {
    const { userId, jobId } = data;

    if (!userId || !jobId) {
      throw new Error("userId and jobId are required");
    }

    // Check if already saved - return existing instead of throwing error
    const existing = await this.savedJobRepository.findByUserAndJob(
      userId,
      jobId
    );
    if (existing) {
      return existing; // Idempotent - return existing record
    }

    // Verify user and job exist
    const user = await this.userRepository.findOne({
      where: { id: parseInt(userId) },
    });
    const job = await this.jobRepository.findOne({
      where: { id: parseInt(jobId) },
    });

    if (!user) {
      throw new Error("User not found");
    }

    if (!job) {
      throw new Error("Job not found");
    }

    const savedJob = await this.savedJobRepository.create({
      userId: parseInt(userId),
      jobId: parseInt(jobId),
      savedDate: new Date(),
    });

    return savedJob;
  }

  async deleteSavedJob(userId, jobId) {
    const deleted = await this.savedJobRepository.deleteByUserAndJob(
      userId,
      jobId
    );
    if (!deleted) {
      throw new Error("Saved job not found");
    }
    return true;
  }
}
