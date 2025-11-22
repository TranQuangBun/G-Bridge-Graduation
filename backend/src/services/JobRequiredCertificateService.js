import { JobRequiredCertificateRepository } from "../repositories/JobRequiredCertificateRepository.js";
import { AppDataSource } from "../config/DataSource.js";
import { Job } from "../entities/Job.js";
import { Certification } from "../entities/Certification.js";

export class JobRequiredCertificateService {
  constructor() {
    this.jobRequiredCertificateRepository =
      new JobRequiredCertificateRepository();
    this.jobRepository = AppDataSource.getRepository(Job);
    this.certificationRepository = AppDataSource.getRepository(Certification);
  }

  async getAllJobRequiredCertificates(query) {
    const {
      page = 1,
      limit = 20,
      jobId = "",
      certificateId = "",
    } = query;

    if (jobId) {
      const certificates =
        await this.jobRequiredCertificateRepository.findByJobId(jobId, {
          relations: ["certificate"],
        });
      return {
        certificates,
        pagination: {
          total: certificates.length,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(certificates.length / parseInt(limit)),
        },
      };
    }

    if (certificateId) {
      const certificates =
        await this.jobRequiredCertificateRepository.findByCertificateId(
          certificateId,
          { relations: ["job"] }
        );
      return {
        certificates,
        pagination: {
          total: certificates.length,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(certificates.length / parseInt(limit)),
        },
      };
    }

    const [certificates, total] =
      await this.jobRequiredCertificateRepository.findAndCount({
        take: parseInt(limit),
        skip: (parseInt(page) - 1) * parseInt(limit),
        relations: ["job", "certificate"],
      });

    return {
      certificates,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    };
  }

  async getJobRequiredCertificateById(id) {
    const certificate = await this.jobRequiredCertificateRepository.findById(
      parseInt(id),
      { relations: ["job", "certificate"] }
    );
    if (!certificate) {
      throw new Error("Job required certificate not found");
    }
    return certificate;
  }

  async createJobRequiredCertificate(data) {
    const { jobId, certificateId, minAchievementDetail } = data;

    if (!jobId || !certificateId) {
      throw new Error("jobId and certificateId are required");
    }

    // Verify job and certificate exist
    const job = await this.jobRepository.findOne({
      where: { id: parseInt(jobId) },
    });
    const certificate = await this.certificationRepository.findOne({
      where: { id: parseInt(certificateId) },
    });

    if (!job) {
      throw new Error("Job not found");
    }

    if (!certificate) {
      throw new Error("Certification not found");
    }

    // Check if already exists
    const existing = await this.jobRequiredCertificateRepository.findOne({
      jobId: parseInt(jobId),
      certificateId: parseInt(certificateId),
    });

    if (existing) {
      throw new Error("Job required certificate already exists");
    }

    const jobRequiredCertificate =
      await this.jobRequiredCertificateRepository.create({
        jobId: parseInt(jobId),
        certificateId: parseInt(certificateId),
        minAchievementDetail: minAchievementDetail || null,
      });

    return await this.jobRequiredCertificateRepository.findById(
      jobRequiredCertificate.id,
      { relations: ["job", "certificate"] }
    );
  }

  async updateJobRequiredCertificate(id, data) {
    const certificate = await this.jobRequiredCertificateRepository.findById(
      parseInt(id)
    );
    if (!certificate) {
      throw new Error("Job required certificate not found");
    }

    // Verify related entities if provided
    if (data.certificateId) {
      const cert = await this.certificationRepository.findOne({
        where: { id: parseInt(data.certificateId) },
      });
      if (!cert) {
        throw new Error("Certification not found");
      }
    }

    await this.jobRequiredCertificateRepository.update(parseInt(id), data);
    return await this.jobRequiredCertificateRepository.findById(parseInt(id), {
      relations: ["job", "certificate"],
    });
  }

  async deleteJobRequiredCertificate(id) {
    const deleted = await this.jobRequiredCertificateRepository.delete(
      parseInt(id)
    );
    if (!deleted) {
      throw new Error("Job required certificate not found");
    }
    return true;
  }

  async deleteByJobId(jobId) {
    return await this.jobRequiredCertificateRepository.deleteByJobId(jobId);
  }
}

