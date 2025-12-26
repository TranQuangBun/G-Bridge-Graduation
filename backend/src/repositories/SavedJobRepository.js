import { BaseRepository } from "./BaseRepository.js";
import { SavedJob } from "../entities/SavedJob.js";

export class SavedJobRepository extends BaseRepository {
  constructor() {
    super(SavedJob);
  }

  async findByUserAndJob(userId, jobId) {
    return await this.repository.findOne({
      where: {
        userId: parseInt(userId),
        jobId: parseInt(jobId),
      },
      relations: ["user", "job"],
    });
  }

  async findByUser(userId, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    return await this.repository.findAndCount({
      where: { userId: parseInt(userId) },
      relations: ["user", "job"],
      take: limit,
      skip: offset,
      order: { savedDate: "DESC" },
    });
  }

  async findByJob(jobId, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    return await this.repository.findAndCount({
      where: { jobId: parseInt(jobId) },
      relations: ["user", "job"],
      take: limit,
      skip: offset,
      order: { savedDate: "DESC" },
    });
  }

  async findByFilters(filters, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    const whereClause = {};

    if (filters.userId) {
      whereClause.userId = parseInt(filters.userId);
    }

    if (filters.jobId) {
      whereClause.jobId = parseInt(filters.jobId);
    }

    return await this.repository.findAndCount({
      where: whereClause,
      relations: [
        "user",
        "job",
        "job.organization",
        "job.workingMode",
        "job.domains",
        "job.domains.domain",
        "job.requiredLanguages",
        "job.requiredLanguages.language",
      ],
      take: limit,
      skip: offset,
      order: { savedDate: "DESC" },
    });
  }

  async deleteByUserAndJob(userId, jobId) {
    const result = await this.repository.delete({
      userId: parseInt(userId),
      jobId: parseInt(jobId),
    });
    return result.affected > 0;
  }
}
