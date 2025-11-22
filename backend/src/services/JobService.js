import { JobRepository } from "../repositories/JobRepository.js";
import { AppDataSource } from "../config/DataSource.js";
import { Organization } from "../entities/Organization.js";
import { WorkingMode } from "../entities/WorkingMode.js";

export class JobService {
  constructor() {
    this.jobRepository = new JobRepository();
    this.organizationRepository = AppDataSource.getRepository(Organization);
    this.workingModeRepository = AppDataSource.getRepository(WorkingMode);
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
}

