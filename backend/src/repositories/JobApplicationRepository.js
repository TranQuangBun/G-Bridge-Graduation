import { BaseRepository } from "./BaseRepository.js";
import { JobApplication } from "../entities/JobApplication.js";

export class JobApplicationRepository extends BaseRepository {
  constructor() {
    super(JobApplication);
  }

  async findByJobId(jobId, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    return await this.repository.findAndCount({
      where: { jobId: parseInt(jobId) },
      relations: ["job", "interpreter", "interpreter.interpreterProfile"],
      take: limit,
      skip: offset,
      order: { applicationDate: "DESC" },
    });
  }

  async findByInterpreterId(interpreterId, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    return await this.repository.findAndCount({
      where: { interpreterId: parseInt(interpreterId) },
      relations: ["job", "interpreter", "job.organization"],
      take: limit,
      skip: offset,
      order: { applicationDate: "DESC" },
    });
  }

  async findByStatus(status, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    return await this.repository.findAndCount({
      where: { status },
      relations: ["job", "interpreter"],
      take: limit,
      skip: offset,
      order: { applicationDate: "DESC" },
    });
  }

  async findByJobAndInterpreter(jobId, interpreterId) {
    return await this.repository.findOne({
      where: {
        jobId: parseInt(jobId),
        interpreterId: parseInt(interpreterId),
      },
      relations: ["job", "interpreter"],
    });
  }

  async findByFilters(filters, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    const whereClause = {};

    if (filters.jobId) {
      whereClause.jobId = parseInt(filters.jobId);
    }

    if (filters.interpreterId) {
      whereClause.interpreterId = parseInt(filters.interpreterId);
    }

    if (filters.status) {
      whereClause.status = filters.status;
    }

    return await this.repository.findAndCount({
      where: whereClause,
      relations: ["job", "interpreter", "job.organization"],
      take: limit,
      skip: offset,
      order: { applicationDate: "DESC" },
    });
  }
}

