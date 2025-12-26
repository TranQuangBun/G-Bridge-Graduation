import { BaseRepository } from "./BaseRepository.js";
import { JobRequiredLanguage } from "../entities/JobRequiredLanguage.js";

export class JobRequiredLanguageRepository extends BaseRepository {
  constructor() {
    super(JobRequiredLanguage);
  }

  async findByJobId(jobId, options = {}) {
    return await this.repository.find({
      where: { jobId: parseInt(jobId) },
      relations: ["language", "level", ...(options.relations || [])],
      ...options,
    });
  }

  async findByLanguageId(languageId, options = {}) {
    return await this.repository.find({
      where: { languageId: parseInt(languageId) },
      relations: ["job", "level", ...(options.relations || [])],
      ...options,
    });
  }

  async findByLevelId(levelId, options = {}) {
    return await this.repository.find({
      where: { levelId: parseInt(levelId) },
      relations: ["job", "language", ...(options.relations || [])],
      ...options,
    });
  }

  async deleteByJobId(jobId) {
    const result = await this.repository.delete({ jobId: parseInt(jobId) });
    return result.affected > 0;
  }

  async deleteByJobAndLanguage(jobId, languageId) {
    const result = await this.repository.delete({
      jobId: parseInt(jobId),
      languageId: parseInt(languageId),
    });
    return result.affected > 0;
  }
}

