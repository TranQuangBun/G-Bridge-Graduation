import { JobRepository } from "../repositories/JobRepository.js";
import { AppDataSource } from "../config/DataSource.js";
import { Organization } from "../entities/Organization.js";
import { WorkingMode } from "../entities/WorkingMode.js";
import { User } from "../entities/User.js";
import { JobApplication } from "../entities/JobApplication.js";
import { Not } from "typeorm";

export class JobService {
  constructor() {
    this.jobRepository = new JobRepository();
    this.organizationRepository = AppDataSource.getRepository(Organization);
    this.workingModeRepository = AppDataSource.getRepository(WorkingMode);
    this.userRepository = AppDataSource.getRepository(User);
    this.jobApplicationRepository = AppDataSource.getRepository(JobApplication);
  }

  async getAllJobs(query) {
    const {
      page = 1,
      limit = 20,
      search = "",
      organizationId = "",
      workingModeId = "",
      status = "",
      province = "",
    } = query;

    const filters = {};
    if (search) filters.search = search;
    if (organizationId) filters.organizationId = organizationId;
    if (workingModeId) filters.workingModeId = workingModeId;
    if (status) filters.status = status;
    if (province) filters.province = province;

    const [jobs, total] = await this.jobRepository.findByFilters(
      filters,
      parseInt(page),
      parseInt(limit)
    );

    return {
      jobs,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    };
  }

  async getJobById(id) {
    const job = await this.jobRepository.findByIdWithRelations(parseInt(id));
    if (!job) {
      throw new Error("Job not found");
    }
    return job;
  }

  async createJob(data) {
    const {
      organizationId,
      workingModeId,
      title,
      description,
      requirements,
      salaryMin,
      salaryMax,
      salaryType,
      province,
      district,
      address,
      expirationDate,
    } = data;

    if (!organizationId || !workingModeId || !title) {
      throw new Error("organizationId, workingModeId, and title are required");
    }

    // Verify organization and working mode exist
    const organization = await this.organizationRepository.findOne({
      where: { id: parseInt(organizationId) },
    });
    const workingMode = await this.workingModeRepository.findOne({
      where: { id: parseInt(workingModeId) },
    });

    if (!organization) {
      throw new Error("Organization not found");
    }

    // Check if organization is approved (required before posting jobs)
    if (organization.approvalStatus !== "approved") {
      throw new Error("Organization must be approved before posting jobs. Please wait for admin approval.");
    }

    // Check if organization is active
    if (!organization.isActive) {
      throw new Error("Organization is not active. Please contact support.");
    }

    if (!workingMode) {
      throw new Error("Working mode not found");
    }

    const job = await this.jobRepository.create({
      organizationId: parseInt(organizationId),
      workingModeId: parseInt(workingModeId),
      title,
      description: description || null,
      requirements: requirements || null,
      salaryMin: salaryMin ? parseFloat(salaryMin) : null,
      salaryMax: salaryMax ? parseFloat(salaryMax) : null,
      salaryType: salaryType || "NEGOTIABLE",
      province: province || null,
      district: district || null,
      address: address || null,
      expirationDate: expirationDate ? new Date(expirationDate) : null,
      statusOpenStop: "open",
      createdDate: new Date(),
    });

    return job;
  }

  async updateJob(id, data) {
    const job = await this.jobRepository.findById(parseInt(id));
    if (!job) {
      throw new Error("Job not found");
    }

    // Convert date strings to Date objects if provided
    if (data.expirationDate) {
      data.expirationDate = new Date(data.expirationDate);
    }

    const updated = await this.jobRepository.update(parseInt(id), data);
    return await this.jobRepository.findByIdWithRelations(parseInt(id));
  }

  async deleteJob(id) {
    const job = await this.jobRepository.findById(parseInt(id));
    if (!job) {
      throw new Error("Job not found");
    }
    const deleted = await this.jobRepository.delete(parseInt(id));
    if (!deleted) {
      throw new Error("Job not found");
    }
    return true;
  }

  // Get public statistics for homepage
  async getPublicStats() {
    try {
      const [
        totalJobs,
        totalInterpreters,
        totalOrganizations,
        totalApplications,
        completedApplications,
      ] = await Promise.all([
        // Total approved jobs
        this.jobRepository.repository.count({
          where: { reviewStatus: "approved" },
        }),
        // Total active interpreters
        this.userRepository.count({
          where: { role: "interpreter", isActive: true },
        }),
        // Total approved organizations
        this.organizationRepository.count({
          where: { approvalStatus: "approved" },
        }),
        // Total applications
        this.jobApplicationRepository.count(),
        // Completed applications (status is not pending)
        // Note: status is a string field, so we use Not operator
        this.jobApplicationRepository.count({
          where: { status: Not("pending") },
        }),
      ]);

      // Calculate success rate (completed / total * 100)
      const successRate =
        totalApplications > 0
          ? Math.round((completedApplications / totalApplications) * 100)
          : 0;

      return {
        totalJobs,
        totalInterpreters,
        totalOrganizations,
        successRate,
      };
    } catch (error) {
      console.error("Error fetching public stats:", error);
      throw error;
    }
  }

  // Get featured jobs for homepage (top jobs: urgent, newest, with many applications)
  async getFeaturedJobs(limit = 9) {
    try {
      const jobRepository = this.jobRepository.repository;
      
      // Get featured jobs: approved, open, ordered by createdDate DESC, limit
      const featuredJobs = await jobRepository
        .createQueryBuilder("job")
        .leftJoinAndSelect("job.organization", "organization")
        .leftJoinAndSelect("job.workingMode", "workingMode")
        .leftJoinAndSelect("job.domains", "domains")
        .leftJoinAndSelect("domains.domain", "domain")
        .leftJoinAndSelect("job.requiredLanguages", "requiredLanguages")
        .leftJoinAndSelect("requiredLanguages.language", "language")
        .leftJoinAndSelect("requiredLanguages.level", "level")
        .where("job.reviewStatus = :reviewStatus", { reviewStatus: "approved" })
        .andWhere("job.statusOpenStop = :status", { status: "open" })
        .andWhere("job.expirationDate > :now", { now: new Date() })
        .orderBy("job.createdDate", "DESC")
        .take(limit)
        .getMany();

      return featuredJobs;
    } catch (error) {
      console.error("Error fetching featured jobs:", error);
      throw error;
    }
  }
}

