import { AppDataSource } from "../config/DataSource.js";
import { Job, JobStatus } from "../entities/Job.js";
import { Organization } from "../entities/Organization.js";
import { WorkingMode } from "../entities/WorkingMode.js";
import { Domain } from "../entities/Domain.js";
import { JobDomain } from "../entities/JobDomain.js";
import { JobRequiredLanguage } from "../entities/JobRequiredLanguage.js";
import { JobRequiredCertificate } from "../entities/JobRequiredCertificate.js";
import { JobApplication } from "../entities/JobApplication.js";
import { SavedJob } from "../entities/SavedJob.js";
import { Language } from "../entities/Language.js";
import { Level } from "../entities/Level.js";
import { Certification } from "../entities/Certification.js";
import { User } from "../entities/User.js";
import { LessThan } from "typeorm";
import { logError, AppError } from "../utils/Errors.js";
import { sendSuccess, sendError, sendPaginated } from "../utils/Response.js";
import { JobService } from "../services/JobService.js";
import { validateCreateJob, validateUpdateJob } from "../validators/JobValidators.js";
import { NotificationService } from "../services/NotificationService.js";
import { NotificationType } from "../entities/Notification.js";

const jobService = new JobService();
const notificationService = new NotificationService();

export async function getJobs(req, res) {
  try {
    const {
      page = 1,
      limit = 12,
      search = "",
      province = "",
      domainId = "",
      workingModeId = "",
      minSalary = "",
      maxSalary = "",
      status = "open",
      reviewStatus = "",
      sortBy = "createdDate",
      sortOrder = "DESC",
    } = req.query;

    const jobRepository = AppDataSource.getRepository(Job);

    // Update expired jobs
    await jobRepository.update(
      {
        expirationDate: LessThan(new Date()),
        statusOpenStop: "open",
      },
      { statusOpenStop: "expired" }
    );

    const queryBuilder = jobRepository
      .createQueryBuilder("job")
      .leftJoinAndSelect("job.organization", "organization")
      .leftJoinAndSelect("job.workingMode", "workingMode")
      .leftJoinAndSelect("job.domains", "domains")
      .leftJoinAndSelect("job.requiredLanguages", "requiredLanguages")
      .leftJoinAndSelect("requiredLanguages.language", "language")
      .leftJoinAndSelect("requiredLanguages.level", "level")
      .leftJoinAndSelect("job.requiredCertificates", "requiredCertificates")
      .leftJoinAndSelect("requiredCertificates.certificate", "certificate");

    if (search) {
      queryBuilder.where("job.title LIKE :search", { search: `%${search}%` });
    }

    if (province) {
      if (search) {
        queryBuilder.andWhere("job.province = :province", { province });
      } else {
        queryBuilder.where("job.province = :province", { province });
      }
    }

    if (workingModeId) {
      const condition = search || province ? "andWhere" : "where";
      queryBuilder[condition]("job.workingModeId = :workingModeId", {
        workingModeId: parseInt(workingModeId),
      });
    }

    if (minSalary) {
      const condition = search || province || workingModeId ? "andWhere" : "where";
      queryBuilder[condition]("job.minSalary >= :minSalary", {
        minSalary: parseFloat(minSalary),
      });
    }

    if (maxSalary) {
      const condition =
        search || province || workingModeId || minSalary ? "andWhere" : "where";
      queryBuilder[condition]("job.maxSalary <= :maxSalary", {
        maxSalary: parseFloat(maxSalary),
      });
    }

    if (status) {
      const condition =
        search || province || workingModeId || minSalary || maxSalary
          ? "andWhere"
          : "where";
      queryBuilder[condition]("job.statusOpenStop = :status", { status });
    }

    if (domainId) {
      queryBuilder.andWhere("domains.id = :domainId", {
        domainId: parseInt(domainId),
      });
    }

    if (reviewStatus) {
      queryBuilder.andWhere("job.reviewStatus = :reviewStatus", {
        reviewStatus,
      });
    }

    queryBuilder
      .orderBy(`job.${sortBy}`, sortOrder.toUpperCase())
      .take(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const [jobs, count] = await queryBuilder.getManyAndCount();

    return sendPaginated(res, jobs, {
      total: count,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(count / parseInt(limit)),
    }, "Jobs fetched successfully");
  } catch (error) {
    logError(error, "Fetching jobs");
    return sendError(res, "Error fetching jobs", 500, error);
  }
}

export async function getJobById(req, res) {
  try {
    const { id } = req.params;
    const jobRepository = AppDataSource.getRepository(Job);

    const relations = [
      "organization",
      "workingMode",
      "domains",
      "requiredLanguages",
      "requiredLanguages.language",
      "requiredLanguages.level",
      "requiredCertificates",
      "requiredCertificates.certificate",
    ];

    if (req.user) {
      relations.push("applications");
    }

    const job = await jobRepository.findOne({
      where: { id: parseInt(id) },
      relations,
    });

    if (!job) {
      return sendError(res, "Job not found", 404);
    }

    let isSaved = false;
    let hasApplied = false;
    if (req.user) {
      const savedJobRepository = AppDataSource.getRepository(SavedJob);
      const savedJob = await savedJobRepository.findOne({
        where: {
          userId: parseInt(req.user.sub || req.user.id),
          jobId: parseInt(id),
        },
      });
      isSaved = !!savedJob;

      // Check if user has applied
      if (job.applications) {
        hasApplied = job.applications.some(
          (app) => app.interpreterId === parseInt(req.user.sub || req.user.id)
        );
      } else {
        const jobApplicationRepository = AppDataSource.getRepository(JobApplication);
        const application = await jobApplicationRepository.findOne({
          where: {
            jobId: parseInt(id),
            interpreterId: parseInt(req.user.sub || req.user.id),
          },
        });
        hasApplied = !!application;
      }
    }

    return sendSuccess(res, {
      ...job,
      isSaved,
      hasApplied,
    }, "Job fetched successfully");
  } catch (error) {
    if (error instanceof AppError || error.message === "Job not found") {
      return sendError(res, error.message, error.statusCode || 404);
    }
    logError(error, "fetching job");
    return sendError(res, "Error fetching job", 500, error);
  }
}

export async function createJob(req, res) {
  try {
    // Validate input
    validateCreateJob(req.body);

    const {
      organizationId,
      workingModeId,
      title,
      province,
      commune,
      address,
      expirationDate,
      quantity,
      descriptions,
      responsibility,
      benefits,
      minSalary,
      maxSalary,
      salaryType,
      contactEmail,
      contactPhone,
      domains,
      requiredLanguages,
      requiredCertificates,
    } = req.body;

    const jobRepository = AppDataSource.getRepository(Job);
    const jobDomainRepository = AppDataSource.getRepository(JobDomain);
    const jobRequiredLanguageRepository = AppDataSource.getRepository(JobRequiredLanguage);
    const jobRequiredCertificateRepository = AppDataSource.getRepository(JobRequiredCertificate);

    const job = jobRepository.create({
      organizationId,
      workingModeId,
      title,
      province,
      commune,
      address,
      expirationDate,
      quantity,
      descriptions,
      responsibility,
      benefits,
      minSalary,
      maxSalary,
      salaryType,
      contactEmail,
      contactPhone,
      statusOpenStop: "open",
      createdDate: new Date(),
    });

    const savedJob = await jobRepository.save(job);

    // Add domains
    if (domains && domains.length > 0) {
      const domainRecords = domains.map((domainId) =>
        jobDomainRepository.create({
          jobId: savedJob.id,
          domainId,
        })
      );
      await jobDomainRepository.save(domainRecords);
    }

    if (requiredLanguages && requiredLanguages.length > 0) {
      const Language = (await import("../entities/Language.js")).Language;
      const languageRepository = AppDataSource.getRepository(Language);
      const currentUserId = req.user?.id || req.user?.sub || 1; // Use current user or default to 1
      
      const languageRecords = await Promise.all(
        requiredLanguages.map(async (lang) => {
          let languageId = lang.languageId ? parseInt(lang.languageId) : null;
          
          // If languageName is provided instead of languageId, find or create language
          if (lang.languageName && !languageId) {
            // Try to find existing language by name (prefer from current user, then any user)
            let language = await languageRepository.findOne({
              where: { 
                name: lang.languageName,
                userId: currentUserId 
              },
            });
            
            // If not found for current user, try to find from any user
            if (!language) {
              language = await languageRepository
                .createQueryBuilder("language")
                .where("language.name = :name", { name: lang.languageName })
                .orderBy("language.id", "ASC")
                .getOne();
            }
            
            // If still not found, create a new language entry for current user
            if (!language) {
              language = languageRepository.create({
                name: lang.languageName,
                userId: currentUserId,
                proficiencyLevel: "Intermediate",
                isActive: true,
              });
              language = await languageRepository.save(language);
            }
            languageId = language.id;
          } else if (!languageId) {
            throw new AppError(`Language ID or name is required for language requirement`, 400);
          }
          
          return jobRequiredLanguageRepository.create({
            jobId: savedJob.id,
            languageId: languageId,
            levelId: parseInt(lang.levelId),
            isSourceLanguage: lang.isSourceLanguage || false,
          });
        })
      );
      await jobRequiredLanguageRepository.save(languageRecords);
    }

    if (requiredCertificates && requiredCertificates.length > 0) {
      const certificateRecords = requiredCertificates.map((cert) =>
        jobRequiredCertificateRepository.create({
          jobId: savedJob.id,
          ...cert,
        })
      );
      await jobRequiredCertificateRepository.save(certificateRecords);
    }

    return sendSuccess(res, savedJob, "Job created successfully", 201);
  } catch (error) {
    if (error instanceof AppError) {
      return sendError(res, error.message, error.statusCode);
    }
    logError(error, "creating job");
    return sendError(res, "Error creating job", 500, error);
  }
}

export async function updateJob(req, res) {
  try {
    const { id } = req.params;
    
    // Validate input
    validateUpdateJob(req.body);

    const {
      organizationId,
      workingModeId,
      title,
      province,
      commune,
      address,
      expirationDate,
      quantity,
      descriptions,
      responsibility,
      benefits,
      minSalary,
      maxSalary,
      salaryType,
      contactEmail,
      contactPhone,
      statusOpenStop,
      domains,
      requiredLanguages,
      requiredCertificates,
    } = req.body;

    const jobRepository = AppDataSource.getRepository(Job);
    const jobDomainRepository = AppDataSource.getRepository(JobDomain);
    const jobRequiredLanguageRepository = AppDataSource.getRepository(JobRequiredLanguage);
    const jobRequiredCertificateRepository = AppDataSource.getRepository(JobRequiredCertificate);

    const job = await jobRepository.findOne({ where: { id: parseInt(id) } });

    if (!job) {
      return sendError(res, "Job not found", 404);
    }

    await jobRepository.update(parseInt(id), {
      organizationId,
      workingModeId,
      title,
      province,
      commune,
      address,
      expirationDate,
      quantity,
      descriptions,
      responsibility,
      benefits,
      minSalary,
      maxSalary,
      salaryType,
      contactEmail,
      contactPhone,
      statusOpenStop,
    });

    if (domains !== undefined) {
      await jobDomainRepository.delete({ jobId: parseInt(id) });
      if (domains.length > 0) {
        const domainRecords = domains.map((domainId) =>
          jobDomainRepository.create({
            jobId: parseInt(id),
            domainId,
          })
        );
        await jobDomainRepository.save(domainRecords);
      }
    }

    if (requiredLanguages !== undefined) {
      await jobRequiredLanguageRepository.delete({ jobId: parseInt(id) });
      if (requiredLanguages.length > 0) {
        const languageRecords = requiredLanguages.map((lang) =>
          jobRequiredLanguageRepository.create({
            jobId: parseInt(id),
            languageId: parseInt(lang.languageId),
            levelId: parseInt(lang.levelId),
            isSourceLanguage: lang.isSourceLanguage || false,
          })
        );
        await jobRequiredLanguageRepository.save(languageRecords);
      }
    }

    if (requiredCertificates !== undefined) {
      await jobRequiredCertificateRepository.delete({ jobId: parseInt(id) });
      if (requiredCertificates.length > 0) {
        const certificateRecords = requiredCertificates.map((cert) =>
          jobRequiredCertificateRepository.create({
            jobId: parseInt(id),
            ...cert,
          })
        );
        await jobRequiredCertificateRepository.save(certificateRecords);
      }
    }

    const updatedJob = await jobRepository.findOne({
      where: { id: parseInt(id) },
      relations: [
        "organization",
        "workingMode",
        "domains",
        "domains.domain",
        "requiredLanguages",
        "requiredLanguages.language",
        "requiredLanguages.level",
        "requiredCertificates",
        "requiredCertificates.certificate",
      ],
    });

    return sendSuccess(res, updatedJob, "Job updated successfully");
  } catch (error) {
    if (error instanceof AppError || error.message === "Job not found") {
      return sendError(res, error.message, error.statusCode || 404);
    }
    logError(error, "updating job");
    return sendError(res, "Error updating job", 500, error);
  }
}

export async function applyForJob(req, res) {
  try {
    const { jobId } = req.params;
    const { coverLetter, resumeUrl, resumeType } = req.body;
    const userId = req.user.sub || req.user.id; // JWT uses 'sub' field

    // Check if job exists and is open
    const jobRepository = AppDataSource.getRepository(Job);
    const job = await jobRepository.findOne({
      where: { id: parseInt(jobId) },
      relations: ["organization", "organization.owner"],
    });
    if (!job) {
      return sendError(res, "Job not found", 404);
    }

    if (job.statusOpenStop !== "open") {
      return sendError(res, "This job is no longer accepting applications", 400);
    }

    if (new Date() > new Date(job.expirationDate)) {
      return sendError(res, "Application deadline has passed", 400);
    }

    const jobApplicationRepository = AppDataSource.getRepository(JobApplication);
    const existingApplication = await jobApplicationRepository.findOne({
      where: {
        jobId: parseInt(jobId),
        interpreterId: parseInt(userId),
      },
    });

    if (existingApplication) {
      return sendError(res, "You have already applied for this job", 400);
    }

    const application = jobApplicationRepository.create({
      jobId: parseInt(jobId),
      interpreterId: parseInt(userId),
      coverLetter,
      resumeUrl,
      resumeType,
      status: "pending",
      appliedAt: new Date(),
    });
    await jobApplicationRepository.save(application);

    if (job.organization?.ownerUserId) {
      try {
        await notificationService.createNotification({
          recipientId: job.organization.ownerUserId,
          actorId: userId,
          type: NotificationType.JOB_APPLICATION_SUBMITTED,
          title: `New application for ${job.title}`,
          message: `${req.user.fullName || "An interpreter"} just applied`,
          metadata: {
            jobId: job.id,
            applicationId: application.id,
          },
        });
      } catch (notifyError) {
        logError(notifyError, "sending job application notification");
      }
    }

    return sendSuccess(res, application, "Application submitted successfully", 201);
  } catch (error) {
    logError(error, "applying for job");
    return sendError(res, "Error submitting application", 500, error);
  }
}

export async function toggleSaveJob(req, res) {
  try {
    const { jobId } = req.params;
    const userId = req.user.sub || req.user.id; // JWT uses 'sub' field

    // Check if job exists
    const jobRepository = AppDataSource.getRepository(Job);
    const job = await jobRepository.findOne({
      where: { id: parseInt(jobId) },
    });
    if (!job) {
      return sendError(res, "Job not found", 404);
    }

    const savedJobRepository = AppDataSource.getRepository(SavedJob);
    const savedJob = await savedJobRepository.findOne({
      where: {
        userId: parseInt(userId),
        jobId: parseInt(jobId),
      },
    });

    if (savedJob) {
      await savedJobRepository.remove(savedJob);
      return sendSuccess(res, { isSaved: false }, "Job removed from saved list");
    } else {
      const newSavedJob = savedJobRepository.create({
        userId: parseInt(userId),
        jobId: parseInt(jobId),
        savedDate: new Date(),
      });
      await savedJobRepository.save(newSavedJob);
      return sendSuccess(res, { isSaved: true }, "Job saved successfully");
    }
  } catch (error) {
    logError(error, "toggling save job");
    return sendError(res, "Error saving/unsaving job", 500, error);
  }
}

export async function getSavedJobs(req, res) {
  try {
    const userId = req.user.sub || req.user.id; // JWT uses 'sub' field
    const { page = 1, limit = 12 } = req.query;

    const savedJobRepository = AppDataSource.getRepository(SavedJob);
    const [savedJobs, count] = await savedJobRepository.findAndCount({
      where: { userId: parseInt(userId) },
      relations: [
        "job",
        "job.organization",
        "job.workingMode",
        "job.domains",
        "job.domains.domain",
      ],
      select: {
        userId: true,
        jobId: true,
        savedDate: true,
        job: {
          id: true,
          title: true,
          descriptions: true,
          minSalary: true,
          maxSalary: true,
          salaryType: true,
          province: true,
          statusOpenStop: true,
          expirationDate: true,
          createdDate: true,
          organization: {
            id: true,
            name: true,
            logo: true,
          },
          workingMode: {
            id: true,
            name: true,
            nameVi: true,
          },
          domains: {
            jobId: true,
            domainId: true,
            domain: {
              id: true,
              name: true,
              nameVi: true,
            },
          },
        },
      },
      take: parseInt(limit),
      skip: (parseInt(page) - 1) * parseInt(limit),
      order: { savedDate: "DESC" },
    });

    return sendPaginated(res, savedJobs, {
      total: count,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(count / parseInt(limit)),
    }, "Saved jobs fetched successfully");
  } catch (error) {
    logError(error, "fetching saved jobs");
    return sendError(res, "Error fetching saved jobs", 500, error);
  }
}

export async function getMyApplications(req, res) {
  try {
    const userId = req.user.sub || req.user.id; // JWT uses 'sub' field
    const userRole = req.user.role || "interpreter"; // Default to interpreter
    const { page = 1, limit = 12, status = "" } = req.query;

    const jobApplicationRepository = AppDataSource.getRepository(JobApplication);
    
    // Build query based on user role
    let queryBuilder = jobApplicationRepository
      .createQueryBuilder("application")
      .leftJoinAndSelect("application.job", "job")
      .leftJoinAndSelect("job.organization", "organization")
      .leftJoinAndSelect("job.workingMode", "workingMode")
      .leftJoinAndSelect("job.domains", "domains")
      .leftJoinAndSelect("domains.domain", "domain")
      .leftJoinAndSelect("job.requiredLanguages", "requiredLanguages")
      .leftJoinAndSelect("requiredLanguages.language", "language")
      .leftJoinAndSelect("requiredLanguages.level", "level");

    if (userRole === "client") {
      // For client: get applications for jobs they own (via organization.ownerUserId)
      queryBuilder
        .where("organization.ownerUserId = :userId", { userId: parseInt(userId) })
        .leftJoinAndSelect("application.interpreter", "interpreter");
    } else {
      // For interpreter: get their own applications
      queryBuilder.where("application.interpreterId = :userId", { userId: parseInt(userId) });
    }

    if (status) {
      queryBuilder.andWhere("application.status = :status", { status });
    }

    // Apply pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    queryBuilder
      .skip(skip)
      .take(parseInt(limit))
      .orderBy("application.applicationDate", "DESC");

    const [applications, count] = await queryBuilder.getManyAndCount();

    return sendPaginated(res, applications, {
      total: count,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(count / parseInt(limit)),
    }, "My applications fetched successfully");
  } catch (error) {
    logError(error, "fetching applications");
    return sendError(res, "Error fetching applications", 500, error);
  }
}

export async function acceptApplication(req, res) {
  try {
    const { applicationId } = req.params;
    const { reviewNotes } = req.body;
    const userId = req.user.sub || req.user.id;
    const userRole = req.user.role || "interpreter";

    // Only client (employer) can accept applications
    if (userRole !== "client") {
      return sendError(res, "Only employers can accept applications", 403);
    }

    const jobApplicationRepository = AppDataSource.getRepository(JobApplication);
    const application = await jobApplicationRepository.findOne({
      where: { id: parseInt(applicationId) },
      relations: ["job", "job.organization", "interpreter"],
    });

    if (!application) {
      return sendError(res, "Application not found", 404);
    }

    // Verify that the user owns the job (via organization)
    if (application.job?.organization?.ownerUserId !== parseInt(userId)) {
      return sendError(res, "You don't have permission to accept this application", 403);
    }

    // Update application status
    application.status = "approved";
    application.reviewedAt = new Date();
    if (reviewNotes) {
      application.reviewNotes = reviewNotes;
    }
    await jobApplicationRepository.save(application);

    // Send notification to interpreter
    if (application.interpreterId) {
      try {
        await notificationService.createNotification({
          recipientId: application.interpreterId,
          actorId: userId,
          type: NotificationType.JOB_APPLICATION_STATUS,
          title: `Application accepted for ${application.job.title}`,
          message: `Your application has been accepted!`,
          metadata: {
            jobId: application.jobId,
            applicationId: application.id,
            status: "approved",
          },
        });
      } catch (notifyError) {
        logError(notifyError, "sending application acceptance notification");
      }
    }

    return sendSuccess(res, application, "Application accepted successfully");
  } catch (error) {
    logError(error, "accepting application");
    return sendError(res, "Error accepting application", 500, error);
  }
}

export async function rejectApplication(req, res) {
  try {
    const { applicationId } = req.params;
    const { reviewNotes } = req.body;
    const userId = req.user.sub || req.user.id;
    const userRole = req.user.role || "interpreter";

    // Only client (employer) can reject applications
    if (userRole !== "client") {
      return sendError(res, "Only employers can reject applications", 403);
    }

    const jobApplicationRepository = AppDataSource.getRepository(JobApplication);
    const application = await jobApplicationRepository.findOne({
      where: { id: parseInt(applicationId) },
      relations: ["job", "job.organization", "interpreter"],
    });

    if (!application) {
      return sendError(res, "Application not found", 404);
    }

    // Verify that the user owns the job (via organization)
    if (application.job?.organization?.ownerUserId !== parseInt(userId)) {
      return sendError(res, "You don't have permission to reject this application", 403);
    }

    // Update application status
    application.status = "rejected";
    application.reviewedAt = new Date();
    if (reviewNotes) {
      application.reviewNotes = reviewNotes;
    }
    await jobApplicationRepository.save(application);

    // Send notification to interpreter
    if (application.interpreterId) {
      try {
        await notificationService.createNotification({
          recipientId: application.interpreterId,
          actorId: userId,
          type: NotificationType.JOB_APPLICATION_STATUS,
          title: `Application update for ${application.job.title}`,
          message: `Your application has been rejected.${reviewNotes ? ` Reason: ${reviewNotes}` : ""}`,
          metadata: {
            jobId: application.jobId,
            applicationId: application.id,
            status: "rejected",
          },
        });
      } catch (notifyError) {
        logError(notifyError, "sending application rejection notification");
      }
    }

    return sendSuccess(res, application, "Application rejected successfully");
  } catch (error) {
    logError(error, "rejecting application");
    return sendError(res, "Error rejecting application", 500, error);
  }
}

export async function getWorkingModes(req, res) {
  try {
    const workingModeRepository = AppDataSource.getRepository(WorkingMode);
    const workingModes = await workingModeRepository.find({
      select: ["id", "name", "nameVi", "description"],
      order: { id: "ASC" },
    });

    return sendSuccess(res, workingModes, "Working modes fetched successfully");
  } catch (error) {
    logError(error, "fetching working modes");
    return sendError(res, "Error fetching working modes", 500, error);
  }
}

export async function getDomains(req, res) {
  try {
    const domainRepository = AppDataSource.getRepository(Domain);
    const domains = await domainRepository.find({
      select: ["id", "name", "nameVi", "description"],
      order: { name: "ASC" },
    });

    return sendSuccess(res, domains, "Domains fetched successfully");
  } catch (error) {
    logError(error, "fetching domains");
    return sendError(res, "Error fetching domains", 500, error);
  }
}

export async function deleteJob(req, res) {
  try {
    const { id } = req.params;
    await jobService.deleteJob(id);
    return sendSuccess(res, null, "Job deleted successfully");
  } catch (error) {
    if (error instanceof AppError || error.message === "Job not found") {
      return sendError(res, error.message, error.statusCode || 404);
    }
    logError(error, "Deleting job");
    return sendError(res, "Error deleting job", 500, error);
  }
}

export async function getLevels(req, res) {
  try {
    const levelRepository = AppDataSource.getRepository(Level);
    const levels = await levelRepository.find({
      select: ["id", "name", "description", "order"],
      order: { order: "ASC" },
    });

    return sendSuccess(res, levels, "Levels fetched successfully");
  } catch (error) {
    logError(error, "fetching levels");
    return sendError(res, "Error fetching levels", 500, error);
  }
}

export async function approveJob(req, res) {
  try {
    const { id } = req.params;
    const { reviewNotes } = req.body;
    const reviewerId = req.user.sub || req.user.id;

    const jobRepository = AppDataSource.getRepository(Job);
    const job = await jobRepository.findOne({
      where: { id: parseInt(id) },
      relations: ["organization"],
    });

    if (!job) {
      return sendError(res, "Job not found", 404);
    }

    await jobRepository.update(job.id, {
      reviewStatus: "approved",
      reviewerId: parseInt(reviewerId),
      reviewNotes: reviewNotes || null,
      statusOpenStop: JobStatus.OPEN,
    });

    const updatedJob = await jobRepository.findOne({
      where: { id: parseInt(id) },
      relations: ["organization"],
    });

    if (updatedJob?.organization?.ownerUserId) {
      try {
        await notificationService.createNotification({
          recipientId: updatedJob.organization.ownerUserId,
          actorId: reviewerId,
          type: NotificationType.JOB_REVIEW_STATUS,
          title: `Job "${updatedJob.title}" approved`,
          message: reviewNotes || "Your job listing has been approved.",
          metadata: {
            jobId: updatedJob.id,
            status: "approved",
          },
        });
      } catch (notifyError) {
        logError(notifyError, "Sending job approval notification");
      }
    }

    return sendSuccess(res, updatedJob, "Job approved successfully");
  } catch (error) {
    logError(error, "Approving job");
    return sendError(res, "Error approving job", 500, error);
  }
}

export async function rejectJob(req, res) {
  try {
    const { id } = req.params;
    const { reviewNotes = "" } = req.body;
    const reviewerId = req.user.sub || req.user.id;

    const jobRepository = AppDataSource.getRepository(Job);
    const job = await jobRepository.findOne({
      where: { id: parseInt(id) },
      relations: ["organization"],
    });

    if (!job) {
      return sendError(res, "Job not found", 404);
    }

    await jobRepository.update(job.id, {
      reviewStatus: "rejected",
      reviewerId: parseInt(reviewerId),
      reviewNotes,
      statusOpenStop: JobStatus.CLOSED,
    });

    const updatedJob = await jobRepository.findOne({
      where: { id: parseInt(id) },
      relations: ["organization"],
    });

    if (updatedJob?.organization?.ownerUserId) {
      try {
        await notificationService.createNotification({
          recipientId: updatedJob.organization.ownerUserId,
          actorId: reviewerId,
          type: NotificationType.JOB_REVIEW_STATUS,
          title: `Job "${updatedJob.title}" rejected`,
          message:
            reviewNotes ||
            "Your job listing was rejected. Please review the requirements and submit again.",
          metadata: {
            jobId: updatedJob.id,
            status: "rejected",
          },
        });
      } catch (notifyError) {
        logError(notifyError, "Sending job rejection notification");
      }
    }

    return sendSuccess(res, updatedJob, "Job rejected successfully");
  } catch (error) {
    logError(error, "Rejecting job");
    return sendError(res, "Error rejecting job", 500, error);
  }
}
