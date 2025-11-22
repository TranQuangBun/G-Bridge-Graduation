import { JobDomainRepository } from "../repositories/JobDomainRepository.js";
import { AppDataSource } from "../config/DataSource.js";
import { Job } from "../entities/Job.js";
import { Domain } from "../entities/Domain.js";

export class JobDomainService {
  constructor() {
    this.jobDomainRepository = new JobDomainRepository();
    this.jobRepository = AppDataSource.getRepository(Job);
    this.domainRepository = AppDataSource.getRepository(Domain);
  }

  async getAllJobDomains(query) {
    const { page = 1, limit = 20, jobId = "", domainId = "" } = query;

    const filters = {};
    if (jobId) filters.jobId = jobId;
    if (domainId) filters.domainId = domainId;

    if (jobId) {
      const jobDomains = await this.jobDomainRepository.findByJobId(jobId, {
        relations: ["domain"],
      });
      return {
        jobDomains,
        pagination: {
          total: jobDomains.length,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(jobDomains.length / parseInt(limit)),
        },
      };
    }

    if (domainId) {
      const jobDomains = await this.jobDomainRepository.findByDomainId(domainId, {
        relations: ["job"],
      });
      return {
        jobDomains,
        pagination: {
          total: jobDomains.length,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(jobDomains.length / parseInt(limit)),
        },
      };
    }

    const [jobDomains, total] = await this.jobDomainRepository.findAndCount({
      take: parseInt(limit),
      skip: (parseInt(page) - 1) * parseInt(limit),
      relations: ["job", "domain"],
    });

    return {
      jobDomains,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    };
  }

  async getJobDomainByJobAndDomain(jobId, domainId) {
    const jobDomain = await this.jobDomainRepository.findOne(
      {
        jobId: parseInt(jobId),
        domainId: parseInt(domainId),
      },
      { relations: ["job", "domain"] }
    );
    if (!jobDomain) {
      throw new Error("Job domain not found");
    }
    return jobDomain;
  }

  async createJobDomain(data) {
    const { jobId, domainId } = data;

    if (!jobId || !domainId) {
      throw new Error("jobId and domainId are required");
    }

    // Verify job and domain exist
    const job = await this.jobRepository.findOne({
      where: { id: parseInt(jobId) },
    });
    const domain = await this.domainRepository.findOne({
      where: { id: parseInt(domainId) },
    });

    if (!job) {
      throw new Error("Job not found");
    }

    if (!domain) {
      throw new Error("Domain not found");
    }

    // Check if already exists
    const existing = await this.jobDomainRepository.findOne({
      jobId: parseInt(jobId),
      domainId: parseInt(domainId),
    });

    if (existing) {
      throw new Error("Job domain already exists");
    }

    const jobDomain = await this.jobDomainRepository.create({
      jobId: parseInt(jobId),
      domainId: parseInt(domainId),
    });

    return await this.jobDomainRepository.findOne(
      {
        jobId: parseInt(jobId),
        domainId: parseInt(domainId),
      },
      { relations: ["job", "domain"] }
    );
  }

  async deleteJobDomain(jobId, domainId) {
    const deleted = await this.jobDomainRepository.deleteByJobAndDomain(
      jobId,
      domainId
    );
    if (!deleted) {
      throw new Error("Job domain not found");
    }
    return true;
  }

  async deleteByJobId(jobId) {
    return await this.jobDomainRepository.deleteByJobId(jobId);
  }
}

