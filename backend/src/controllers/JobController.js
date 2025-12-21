import { AppDataSource } from "../config/DataSource.js";
import { Job, JobStatus } from "../entities/Job.js";
import { Organization } from "../entities/Organization.js";
import { WorkingMode } from "../entities/WorkingMode.js";
import { Domain } from "../entities/Domain.js";
import { JobDomain } from "../entities/JobDomain.js";
import { JobRequiredLanguage } from "../entities/JobRequiredLanguage.js";
import { JobRequiredCertificate } from "../entities/JobRequiredCertificate.js";
import {
  JobApplication,
  ApplicationStatusEnum,
} from "../entities/JobApplication.js";
import { ApplicationStatus } from "../entities/ApplicationStatus.js";
import { SavedJob } from "../entities/SavedJob.js";
import { Language } from "../entities/Language.js";
import { Level } from "../entities/Level.js";
import { Certification } from "../entities/Certification.js";
import { User } from "../entities/User.js";
import { LessThan } from "typeorm";
import { logError, AppError } from "../utils/Errors.js";
import { sendSuccess, sendError, sendPaginated } from "../utils/Response.js";
import { JobService } from "../services/JobService.js";
import {
  validateCreateJob,
  validateUpdateJob,
} from "../validators/JobValidators.js";
import { NotificationService } from "../services/NotificationService.js";
import { NotificationType } from "../entities/Notification.js";
import { ConversationService } from "../services/ConversationService.js";

const jobService = new JobService();
const notificationService = new NotificationService();
const conversationService = new ConversationService();

export async function getJobs(req, res) {
  try {
    const {
      page = 1,
      limit = 12,
      search = "",
      province = "",
      domainId = "",
      levelId = "",
      workingModeId = "",
      minSalary = "",
      maxSalary = "",
      status = "open",
      reviewStatus = "",
      organizationName = "",
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

    // Always start with a base WHERE clause to avoid andWhere issues
    // For public users, only show approved jobs with open status
    let hasWhere = false;
    
    // Default filter: only show approved jobs (unless reviewStatus is explicitly provided)
    if (!reviewStatus) {
      queryBuilder.where("job.reviewStatus = :reviewStatus", { reviewStatus: "approved" });
      hasWhere = true;
    }

    if (search) {
      const condition = hasWhere ? "andWhere" : "where";
      queryBuilder[condition]("job.title LIKE :search", { search: `%${search}%` });
      hasWhere = true;
    }

    if (province) {
      const condition = hasWhere ? "andWhere" : "where";
      queryBuilder[condition]("job.province = :province", { province });
      hasWhere = true;
    }

    if (workingModeId) {
      const condition = hasWhere ? "andWhere" : "where";
      queryBuilder[condition]("job.workingModeId = :workingModeId", {
        workingModeId: parseInt(workingModeId),
      });
      hasWhere = true;
    }

    if (minSalary) {
      const condition = hasWhere ? "andWhere" : "where";
      queryBuilder[condition]("job.maxSalary >= :minSalary", {
        minSalary: parseFloat(minSalary),
      });
      hasWhere = true;
    }

    if (maxSalary) {
      const condition = hasWhere ? "andWhere" : "where";
      queryBuilder[condition]("job.minSalary <= :maxSalary", {
        maxSalary: parseFloat(maxSalary),
      });
      hasWhere = true;
    }

    if (status) {
      const condition = hasWhere ? "andWhere" : "where";
      queryBuilder[condition]("job.statusOpenStop = :status", { status });
      hasWhere = true;
    }

    if (domainId) {
      const condition = hasWhere ? "andWhere" : "where";
      // Use EXISTS subquery for many-to-many relation
      queryBuilder[condition](
        `EXISTS (
          SELECT 1 FROM job_has_domains jhd 
          WHERE jhd.jobId = job.id 
          AND jhd.domainId = :domainId
        )`,
        { domainId: parseInt(domainId) }
      );
      hasWhere = true;
    }

    if (levelId) {
      const condition = hasWhere ? "andWhere" : "where";
      queryBuilder[condition]("level.id = :levelId", {
        levelId: parseInt(levelId),
      });
      hasWhere = true;
    }

    if (reviewStatus) {
      const condition = hasWhere ? "andWhere" : "where";
      queryBuilder[condition]("job.reviewStatus = :reviewStatus", {
        reviewStatus,
      });
      hasWhere = true;
    }

    if (organizationName) {
      const condition = hasWhere ? "andWhere" : "where";
      queryBuilder[condition]("organization.name LIKE :organizationName", {
        organizationName: `%${organizationName}%`,
      });
      hasWhere = true;
    }

    // Map sortBy field names
    const sortField = sortBy === "createdAt" ? "createdDate" : sortBy;

    queryBuilder
      .orderBy(`job.${sortField}`, sortOrder.toUpperCase())
      .take(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const [jobs, count] = await queryBuilder.getManyAndCount();

    return sendPaginated(
      res,
      jobs,
      {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / parseInt(limit)),
      },
      "Jobs fetched successfully"
    );
  } catch (error) {
    logError(error, "Fetching jobs");
    return sendError(res, "Error fetching jobs", 500, error);
  }
}

export async function getJobById(req, res) {
  try {
    const { id } = req.params;

    // Validate job ID
    if (!id) {
      return sendError(res, "Job ID is required", 400);
    }
    const parsedJobId = parseInt(id);
    if (isNaN(parsedJobId) || parsedJobId <= 0) {
      return sendError(res, "Invalid job ID", 400);
    }

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
      where: { id: parsedJobId },
      relations,
    });

    if (!job) {
      return sendError(res, "Job not found", 404);
    }

    let isSaved = false;
    let hasApplied = false;
    if (req.user) {
      const userId = req.user.sub || req.user.id;
      const parsedUserId = userId ? Number(userId) : null;

      // Only check saved/applied if userId is valid
      if (parsedUserId && Number.isInteger(parsedUserId) && parsedUserId > 0) {
        const savedJobRepository = AppDataSource.getRepository(SavedJob);
        const savedJob = await savedJobRepository.findOne({
          where: {
            userId: parsedUserId,
            jobId: parsedJobId,
          },
        });
        isSaved = !!savedJob;

        // Check if user has applied
        if (job.applications) {
          hasApplied = job.applications.some(
            (app) => app.interpreterId === parsedUserId
          );
        } else {
          const jobApplicationRepository =
            AppDataSource.getRepository(JobApplication);
          const application = await jobApplicationRepository.findOne({
            where: {
              jobId: parsedJobId,
              interpreterId: parsedUserId,
            },
          });
          hasApplied = !!application;
        }
      }
    }

    return sendSuccess(
      res,
      {
        ...job,
        isSaved,
        hasApplied,
      },
      "Job fetched successfully"
    );
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
    const organizationRepository = AppDataSource.getRepository(Organization);
    const jobDomainRepository = AppDataSource.getRepository(JobDomain);
    const jobRequiredLanguageRepository =
      AppDataSource.getRepository(JobRequiredLanguage);
    const jobRequiredCertificateRepository = AppDataSource.getRepository(
      JobRequiredCertificate
    );

    // Verify organization exists and is approved
    const organization = await organizationRepository.findOne({
      where: { id: parseInt(organizationId) },
    });

    if (!organization) {
      return sendError(res, "Organization not found", 404);
    }

    // Check if organization is approved (required before posting jobs)
    if (organization.approvalStatus !== "approved") {
      return sendError(
        res,
        "Organization must be approved before posting jobs. Please wait for admin approval.",
        403
      );
    }

    // Check if organization is active
    if (!organization.isActive) {
      return sendError(
        res,
        "Organization is not active. Please contact support.",
        403
      );
    }

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
      reviewStatus: "pending", // Job must be approved by admin before being visible
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
                userId: currentUserId,
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
            throw new AppError(
              `Language ID or name is required for language requirement`,
              400
            );
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

    // Notify all admins about new job pending review
    try {
      const User = (await import("../entities/User.js")).User;
      const userRepository = AppDataSource.getRepository(User);
      const admins = await userRepository.find({
        where: { role: "admin", isActive: true },
        select: ["id"],
      });

      for (const admin of admins) {
        await notificationService.createNotification({
          recipientId: admin.id,
          actorId: organization.ownerUserId || null,
          type: NotificationType.JOB_REVIEW_STATUS,
          title: "New job pending review",
          message: `Job "${savedJob.title}" from "${organization.name}" is pending review.`,
          metadata: {
            jobId: savedJob.id,
            organizationId: organization.id,
            type: "job_pending_review",
          },
        });
      }
    } catch (notifyError) {
      // Log error but don't fail job creation
      logError(notifyError, "Sending job creation notification to admins");
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

    // Validate job ID
    if (!id) {
      return sendError(res, "Job ID is required", 400);
    }
    const parsedJobId = Number(id);
    if (
      !Number.isInteger(parsedJobId) ||
      parsedJobId <= 0 ||
      isNaN(parsedJobId)
    ) {
      return sendError(res, "Invalid job ID", 400);
    }

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
    const jobRequiredLanguageRepository =
      AppDataSource.getRepository(JobRequiredLanguage);
    const jobRequiredCertificateRepository = AppDataSource.getRepository(
      JobRequiredCertificate
    );

    const job = await jobRepository.findOne({ where: { id: parsedJobId } });

    if (!job) {
      return sendError(res, "Job not found", 404);
    }

    // Validate and prepare update data
    const updateData = {
      title,
      province,
      commune,
      address,
      expirationDate,
      descriptions,
      responsibility,
      benefits,
      salaryType,
      contactEmail,
      contactPhone,
      statusOpenStop,
    };

    // Validate organizationId
    if (organizationId !== undefined && organizationId !== null) {
      const parsedOrgId = Number(organizationId);
      if (
        Number.isInteger(parsedOrgId) &&
        parsedOrgId > 0 &&
        !isNaN(parsedOrgId)
      ) {
        updateData.organizationId = parsedOrgId;
      } else {
        return sendError(res, "Invalid organization ID", 400);
      }
    }

    // Validate workingModeId
    if (workingModeId !== undefined && workingModeId !== null) {
      const parsedWorkingModeId = Number(workingModeId);
      if (
        Number.isInteger(parsedWorkingModeId) &&
        parsedWorkingModeId > 0 &&
        !isNaN(parsedWorkingModeId)
      ) {
        updateData.workingModeId = parsedWorkingModeId;
      } else {
        return sendError(res, "Invalid working mode ID", 400);
      }
    }

    // Validate quantity
    if (quantity !== undefined && quantity !== null) {
      const parsedQuantity = Number(quantity);
      if (
        Number.isInteger(parsedQuantity) &&
        parsedQuantity > 0 &&
        !isNaN(parsedQuantity)
      ) {
        updateData.quantity = parsedQuantity;
      } else {
        return sendError(res, "Invalid quantity", 400);
      }
    }

    // Validate minSalary
    if (minSalary !== undefined && minSalary !== null) {
      const parsedMinSalary = Number(minSalary);
      if (!isNaN(parsedMinSalary) && parsedMinSalary >= 0) {
        updateData.minSalary = parsedMinSalary;
      } else {
        return sendError(res, "Invalid minimum salary", 400);
      }
    }

    // Validate maxSalary
    if (maxSalary !== undefined && maxSalary !== null) {
      const parsedMaxSalary = Number(maxSalary);
      if (!isNaN(parsedMaxSalary) && parsedMaxSalary >= 0) {
        updateData.maxSalary = parsedMaxSalary;
      } else {
        return sendError(res, "Invalid maximum salary", 400);
      }
    }

    await jobRepository.update(parsedJobId, updateData);

    if (domains !== undefined) {
      await jobDomainRepository.delete({ jobId: parsedJobId });
      if (domains.length > 0) {
        // Validate and filter domain IDs
        const validDomainIds = domains
          .map((domainId) => {
            const parsed = Number(domainId);
            return Number.isInteger(parsed) && parsed > 0 && !isNaN(parsed)
              ? parsed
              : null;
          })
          .filter((id) => id !== null);

        if (validDomainIds.length > 0) {
          const domainRecords = validDomainIds.map((domainId) =>
            jobDomainRepository.create({
              jobId: parsedJobId,
              domainId,
            })
          );
          await jobDomainRepository.save(domainRecords);
        }
      }
    }

    if (requiredLanguages !== undefined) {
      await jobRequiredLanguageRepository.delete({ jobId: parsedJobId });
      if (requiredLanguages.length > 0) {
        const languageRepository = AppDataSource.getRepository(Language);
        const currentUserId = req.user?.id || req.user?.sub || 1;

        const languageRecords = await Promise.all(
          requiredLanguages.map(async (lang) => {
            let languageId = lang.languageId ? Number(lang.languageId) : null;

            // Validate languageId if provided
            if (languageId !== null) {
              if (
                !Number.isInteger(languageId) ||
                languageId <= 0 ||
                isNaN(languageId)
              ) {
                languageId = null;
              }
            }

            // If languageName is provided instead of languageId, find or create language
            if (lang.languageName && !languageId) {
              // Try to find existing language by name (prefer from current user, then any user)
              let language = await languageRepository.findOne({
                where: {
                  name: lang.languageName,
                  userId: currentUserId,
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
              // Skip this language requirement if neither ID nor name is valid
              return null;
            }

            // Validate levelId
            const parsedLevelId = Number(lang.levelId);
            if (
              !Number.isInteger(parsedLevelId) ||
              parsedLevelId <= 0 ||
              isNaN(parsedLevelId)
            ) {
              return null;
            }

            return jobRequiredLanguageRepository.create({
              jobId: parsedJobId,
              languageId: languageId,
              levelId: parsedLevelId,
              isSourceLanguage: lang.isSourceLanguage || false,
            });
          })
        );

        // Filter out null values and save
        const validLanguageRecords = languageRecords.filter(
          (record) => record !== null
        );
        if (validLanguageRecords.length > 0) {
          await jobRequiredLanguageRepository.save(validLanguageRecords);
        }
      }
    }

    if (requiredCertificates !== undefined) {
      await jobRequiredCertificateRepository.delete({ jobId: parsedJobId });
      if (requiredCertificates.length > 0) {
        // Validate certificate IDs
        const validCertRecords = requiredCertificates
          .map((cert) => {
            if (
              cert.certificateId !== undefined &&
              cert.certificateId !== null
            ) {
              const parsed = Number(cert.certificateId);
              if (Number.isInteger(parsed) && parsed > 0 && !isNaN(parsed)) {
                return {
                  jobId: parsedJobId,
                  certificateId: parsed,
                  ...cert,
                };
              }
            }
            return null;
          })
          .filter((record) => record !== null);

        if (validCertRecords.length > 0) {
          const certificateRecords = validCertRecords.map((cert) =>
            jobRequiredCertificateRepository.create(cert)
          );
          await jobRequiredCertificateRepository.save(certificateRecords);
        }
      }
    }

    const updatedJob = await jobRepository.findOne({
      where: { id: parsedJobId },
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
    const userId = req.user?.sub || req.user?.id;

    // Handle file upload if present
    let finalResumeUrl = resumeUrl;
    let finalResumeType = resumeType;

    if (req.file) {
      try {
        // Upload file to ImgBB
        const { uploadMulterFileToImgbb } = await import(
          "../utils/ImgbbService.js"
        );
        const uploadResult = await uploadMulterFileToImgbb(req.file, "resumes");
        finalResumeUrl = uploadResult.url;
        finalResumeType =
          req.file.mimetype === "application/pdf"
            ? "pdf"
            : req.file.mimetype.includes("word")
            ? "doc"
            : "pdf";
      } catch (uploadError) {
        logError(uploadError, "uploading resume file");
        // Fallback: save locally if ImgBB fails
        // File should still exist in req.file.path (not deleted on error)
        try {
          // Ensure file exists
          const fs = await import("fs");
          if (!fs.existsSync(req.file.path)) {
            throw new Error("File was deleted before fallback could save it");
          }

          const baseUrl =
            process.env.BACKEND_URL ||
            `http://localhost:${process.env.PORT || 4000}`;
          const fileUrl = `${baseUrl}/uploads/resumes/${req.file.filename}`;
          finalResumeUrl = fileUrl;
          finalResumeType =
            req.file.mimetype === "application/pdf"
              ? "pdf"
              : req.file.mimetype.includes("word")
              ? "doc"
              : "pdf";
          console.warn(
            "ImgBB upload failed, using local storage:",
            uploadError.message
          );
          console.log("Local file saved at:", req.file.path);
        } catch (fallbackError) {
          logError(fallbackError, "fallback resume storage");
          return sendError(
            res,
            "Failed to upload resume file",
            500,
            uploadError
          );
        }
      }
    }

    // Validate userId
    if (!userId) {
      return sendError(res, "User ID is required", 401);
    }
    const parsedUserId = Number(userId);
    if (
      !Number.isInteger(parsedUserId) ||
      parsedUserId <= 0 ||
      isNaN(parsedUserId)
    ) {
      return sendError(res, "Invalid user ID", 400);
    }

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
      return sendError(
        res,
        "This job is no longer accepting applications",
        400
      );
    }

    if (new Date() > new Date(job.expirationDate)) {
      return sendError(res, "Application deadline has passed", 400);
    }

    const jobApplicationRepository =
      AppDataSource.getRepository(JobApplication);
    const applicationStatusRepository =
      AppDataSource.getRepository(ApplicationStatus);
    const parsedJobId = parseInt(jobId);
    if (isNaN(parsedJobId)) {
      return sendError(res, "Invalid job ID", 400);
    }

    const existingApplication = await jobApplicationRepository.findOne({
      where: {
        jobId: parsedJobId,
        interpreterId: parsedUserId,
      },
    });

    if (existingApplication) {
      return sendError(res, "You have already applied for this job", 400);
    }

    // Get pending status from database
    const pendingStatus = await applicationStatusRepository.findOne({
      where: { name: ApplicationStatusEnum.PENDING },
    });

    if (!pendingStatus) {
      logError(
        new Error("Pending application status not found in database"),
        "applying for job"
      );
      return sendError(
        res,
        "System error: Application status not configured",
        500
      );
    }

    const application = jobApplicationRepository.create({
      jobId: parsedJobId,
      interpreterId: parsedUserId,
      coverLetter,
      resumeUrl: finalResumeUrl,
      resumeType: finalResumeType,
      statusId: pendingStatus.id,
      status: pendingStatus.name, // For backward compatibility
      applicationDate: new Date(),
    });
    await jobApplicationRepository.save(application);

    if (job.organization?.ownerUserId) {
      try {
        await notificationService.createNotification({
          recipientId: job.organization.ownerUserId,
          actorId: parsedUserId,
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

    return sendSuccess(
      res,
      application,
      "Application submitted successfully",
      201
    );
  } catch (error) {
    logError(error, "applying for job");
    return sendError(res, "Error submitting application", 500, error);
  }
}

export async function toggleSaveJob(req, res) {
  try {
    const { jobId } = req.params;
    const userId = req.user?.sub || req.user?.id;

    // Validate userId
    if (!userId) {
      return sendError(res, "User ID is required", 401);
    }
    const parsedUserId = Number(userId);
    if (
      !Number.isInteger(parsedUserId) ||
      parsedUserId <= 0 ||
      isNaN(parsedUserId)
    ) {
      return sendError(res, "Invalid user ID", 400);
    }

    // Check if job exists
    const jobRepository = AppDataSource.getRepository(Job);
    const job = await jobRepository.findOne({
      where: { id: parseInt(jobId) },
    });
    if (!job) {
      return sendError(res, "Job not found", 404);
    }

    const parsedJobId = parseInt(jobId);
    if (isNaN(parsedJobId)) {
      return sendError(res, "Invalid job ID", 400);
    }

    const savedJobRepository = AppDataSource.getRepository(SavedJob);
    const savedJob = await savedJobRepository.findOne({
      where: {
        userId: parsedUserId,
        jobId: parsedJobId,
      },
    });

    if (savedJob) {
      await savedJobRepository.remove(savedJob);
      return sendSuccess(
        res,
        { isSaved: false },
        "Job removed from saved list"
      );
    } else {
      const newSavedJob = savedJobRepository.create({
        userId: parsedUserId,
        jobId: parsedJobId,
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
    const userId = req.user?.sub || req.user?.id;
    const { page = 1, limit = 12 } = req.query;

    // Validate userId
    if (!userId) {
      return sendError(res, "User ID is required", 401);
    }
    const parsedUserId = Number(userId);
    if (
      !Number.isInteger(parsedUserId) ||
      parsedUserId <= 0 ||
      isNaN(parsedUserId)
    ) {
      return sendError(res, "Invalid user ID", 400);
    }

    const savedJobRepository = AppDataSource.getRepository(SavedJob);
    const [savedJobs, count] = await savedJobRepository.findAndCount({
      where: { userId: parsedUserId },
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

    return sendPaginated(
      res,
      savedJobs,
      {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / parseInt(limit)),
      },
      "Saved jobs fetched successfully"
    );
  } catch (error) {
    logError(error, "fetching saved jobs");
    return sendError(res, "Error fetching saved jobs", 500, error);
  }
}

export async function getMyApplications(req, res) {
  try {
    const userId = req.user?.sub || req.user?.id;
    const userRole = req.user?.role || "interpreter";
    const { page = 1, limit = 12, status = "" } = req.query;

    // Validate userId
    if (!userId) {
      return sendError(res, "User ID is required", 401);
    }
    const parsedUserId = Number(userId);
    if (
      !Number.isInteger(parsedUserId) ||
      parsedUserId <= 0 ||
      isNaN(parsedUserId)
    ) {
      return sendError(res, "Invalid user ID", 400);
    }

    const jobApplicationRepository =
      AppDataSource.getRepository(JobApplication);

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
        .where("organization.ownerUserId = :userId", { userId: parsedUserId })
        .leftJoinAndSelect("application.interpreter", "interpreter");
    } else {
      // For interpreter: get their own applications
      queryBuilder.where("application.interpreterId = :userId", {
        userId: parsedUserId,
      });
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

    return sendPaginated(
      res,
      applications,
      {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / parseInt(limit)),
      },
      "My applications fetched successfully"
    );
  } catch (error) {
    logError(error, "fetching applications");
    return sendError(res, "Error fetching applications", 500, error);
  }
}

export async function acceptApplication(req, res) {
  try {
    const { applicationId } = req.params;
    const { reviewNotes } = req.body;
    const userId = req.user?.sub || req.user?.id;
    const userRole = req.user?.role || "interpreter";

    // Validate userId
    if (!userId) {
      return sendError(res, "User ID is required", 401);
    }
    const parsedUserId = Number(userId);
    if (
      !Number.isInteger(parsedUserId) ||
      parsedUserId <= 0 ||
      isNaN(parsedUserId)
    ) {
      return sendError(res, "Invalid user ID", 400);
    }

    // Validate applicationId
    if (!applicationId) {
      return sendError(res, "Application ID is required", 400);
    }
    const parsedApplicationId = parseInt(applicationId);
    if (isNaN(parsedApplicationId) || parsedApplicationId <= 0) {
      return sendError(res, "Invalid application ID", 400);
    }

    // Only client (employer) can accept applications
    if (userRole !== "client") {
      return sendError(res, "Only employers can accept applications", 403);
    }

    const jobApplicationRepository =
      AppDataSource.getRepository(JobApplication);
    const application = await jobApplicationRepository.findOne({
      where: { id: parsedApplicationId },
      relations: ["job", "job.organization", "interpreter"],
    });

    if (!application) {
      return sendError(res, "Application not found", 404);
    }

    // Verify that the user owns the job (via organization)
    if (application.job?.organization?.ownerUserId !== parsedUserId) {
      return sendError(
        res,
        "You don't have permission to accept this application",
        403
      );
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
          actorId: parsedUserId,
          type: NotificationType.JOB_APPLICATION_STATUS,
          title: `Application accepted for ${application.job?.title || "job"}`,
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

    // Automatically create conversation between client and interpreter
    try {
      const clientId = application.job?.organization?.ownerUserId;
      const interpreterId = application.interpreterId;
      
      if (clientId && interpreterId) {
        await conversationService.getOrCreateConversation(
          clientId,
          interpreterId,
          true // Skip approval check since application is already approved
        );
      }
    } catch (conversationError) {
      // Log error but don't fail the acceptance
      logError(conversationError, "creating conversation from accepted application");
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
    const userId = req.user?.sub || req.user?.id;
    const userRole = req.user?.role || "interpreter";

    // Validate userId
    if (!userId) {
      return sendError(res, "User ID is required", 401);
    }
    const parsedUserId = Number(userId);
    if (
      !Number.isInteger(parsedUserId) ||
      parsedUserId <= 0 ||
      isNaN(parsedUserId)
    ) {
      return sendError(res, "Invalid user ID", 400);
    }

    // Validate applicationId
    if (!applicationId) {
      return sendError(res, "Application ID is required", 400);
    }
    const parsedApplicationId = parseInt(applicationId);
    if (isNaN(parsedApplicationId) || parsedApplicationId <= 0) {
      return sendError(res, "Invalid application ID", 400);
    }

    // Only client (employer) can reject applications
    if (userRole !== "client") {
      return sendError(res, "Only employers can reject applications", 403);
    }

    const jobApplicationRepository =
      AppDataSource.getRepository(JobApplication);
    const application = await jobApplicationRepository.findOne({
      where: { id: parsedApplicationId },
      relations: ["job", "job.organization", "interpreter"],
    });

    if (!application) {
      return sendError(res, "Application not found", 404);
    }

    // Verify that the user owns the job (via organization)
    if (application.job?.organization?.ownerUserId !== parsedUserId) {
      return sendError(
        res,
        "You don't have permission to reject this application",
        403
      );
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
          actorId: parsedUserId,
          type: NotificationType.JOB_APPLICATION_STATUS,
          title: `Application rejected for ${application.job?.title || "job"}`,
          message: reviewNotes || "Your application has been rejected.",
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

export async function getMyJobs(req, res) {
  try {
    // Validate user exists
    if (!req.user) {
      return sendError(res, "Authentication required", 401);
    }

    const userId = req.user.sub || req.user.id;
    const userRole = req.user.role || "interpreter";
    const { page = 1, limit = 12, status = "", reviewStatus = "" } = req.query;

    // Validate userId - must be a valid number
    if (!userId || userId === "undefined" || userId === "null") {
      return sendError(res, "User ID is required", 401);
    }

    const parsedUserId = Number(userId);
    if (
      !Number.isInteger(parsedUserId) ||
      parsedUserId <= 0 ||
      isNaN(parsedUserId)
    ) {
      logError(
        new Error(`Invalid userId: ${userId}, parsed: ${parsedUserId}`),
        "getMyJobs - userId validation failed"
      );
      return sendError(res, "Invalid user ID", 400);
    }

    // Only client can access this endpoint
    if (userRole !== "client") {
      return sendError(res, "Only clients can access their jobs", 403);
    }

    const jobRepository = AppDataSource.getRepository(Job);

    // Build query to get jobs where organization.ownerUserId = userId
    // Use innerJoin to ensure organization exists and has ownerUserId
    const queryBuilder = jobRepository
      .createQueryBuilder("job")
      .innerJoinAndSelect("job.organization", "organization")
      .leftJoinAndSelect("job.workingMode", "workingMode")
      .leftJoinAndSelect("job.domains", "domains")
      .leftJoinAndSelect("domains.domain", "domain")
      .leftJoinAndSelect("job.requiredLanguages", "requiredLanguages")
      .leftJoinAndSelect("requiredLanguages.language", "language")
      .leftJoinAndSelect("requiredLanguages.level", "level")
      .leftJoinAndSelect("job.requiredCertificates", "requiredCertificates")
      .leftJoinAndSelect("requiredCertificates.certificate", "certificate")
      .where("organization.ownerUserId = :userId", { userId: parsedUserId });

    if (status) {
      queryBuilder.andWhere("job.statusOpenStop = :status", { status });
    }

    if (reviewStatus) {
      queryBuilder.andWhere("job.reviewStatus = :reviewStatus", {
        reviewStatus,
      });
    }

    // Apply pagination with validation
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit) || 12)); // Max 100 items per page
    const skip = (pageNum - 1) * limitNum;

    queryBuilder.skip(skip).take(limitNum).orderBy("job.createdDate", "DESC");

    const [jobs, count] = await queryBuilder.getManyAndCount();

    return sendPaginated(
      res,
      jobs,
      {
        total: count,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(count / limitNum),
      },
      "My jobs fetched successfully"
    );
  } catch (error) {
    logError(error, "fetching my jobs");
    return sendError(res, "Error fetching my jobs", 500, error);
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

export async function closeJob(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.sub || req.user.id;

    const jobRepository = AppDataSource.getRepository(Job);
    const job = await jobRepository.findOne({
      where: { id: parseInt(id) },
      relations: ["organization"],
    });

    if (!job) {
      return sendError(res, "Job not found", 404);
    }

    // Verify that the user is the owner of the organization
    if (job.organization.ownerUserId !== parseInt(userId)) {
      return sendError(res, "You are not authorized to close this job", 403);
    }

    // Check if job is already closed
    if (job.statusOpenStop === JobStatus.CLOSED) {
      return sendError(res, "Job is already closed", 400);
    }

    // Update job status to closed
    await jobRepository.update(job.id, {
      statusOpenStop: JobStatus.CLOSED,
    });

    const updatedJob = await jobRepository.findOne({
      where: { id: parseInt(id) },
      relations: ["organization"],
    });

    return sendSuccess(res, updatedJob, "Job closed successfully");
  } catch (error) {
    logError(error, "Closing job");
    return sendError(res, "Error closing job", 500, error);
  }
}
