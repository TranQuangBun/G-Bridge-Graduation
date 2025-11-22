import { BaseRepository } from "./BaseRepository.js";
import { JobDomain } from "../entities/JobDomain.js";

export class JobDomainRepository extends BaseRepository {
  constructor() {
    super(JobDomain);
  }

  async findByJobId(jobId, options = {}) {
    return await this.repository.find({
      where: { jobId: parseInt(jobId) },
      relations: ["domain", ...(options.relations || [])],
      ...options,
    });
  }

  async findByDomainId(domainId, options = {}) {
    return await this.repository.find({
      where: { domainId: parseInt(domainId) },
      relations: ["job", ...(options.relations || [])],
      ...options,
    });
  }

  async deleteByJobId(jobId) {
    const result = await this.repository.delete({ jobId: parseInt(jobId) });
    return result.affected > 0;
  }

  async deleteByDomainId(domainId) {
    const result = await this.repository.delete({ domainId: parseInt(domainId) });
    return result.affected > 0;
  }

  async deleteByJobAndDomain(jobId, domainId) {
    const result = await this.repository.delete({
      jobId: parseInt(jobId),
      domainId: parseInt(domainId),
    });
    return result.affected > 0;
  }
}

