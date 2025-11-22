import { BaseRepository } from "./BaseRepository.js";
import { JobRequiredCertificate } from "../entities/JobRequiredCertificate.js";

export class JobRequiredCertificateRepository extends BaseRepository {
  constructor() {
    super(JobRequiredCertificate);
  }

  async findByJobId(jobId, options = {}) {
    return await this.repository.find({
      where: { jobId: parseInt(jobId) },
      relations: ["certificate", ...(options.relations || [])],
      ...options,
    });
  }

  async findByCertificateId(certificateId, options = {}) {
    return await this.repository.find({
      where: { certificateId: parseInt(certificateId) },
      relations: ["job", ...(options.relations || [])],
      ...options,
    });
  }

  async deleteByJobId(jobId) {
    const result = await this.repository.delete({ jobId: parseInt(jobId) });
    return result.affected > 0;
  }

  async deleteByJobAndCertificate(jobId, certificateId) {
    const result = await this.repository.delete({
      jobId: parseInt(jobId),
      certificateId: parseInt(certificateId),
    });
    return result.affected > 0;
  }
}

