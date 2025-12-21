import { JobApplicationRepository } from "../repositories/JobApplicationRepository.js";
import { AppDataSource } from "../config/DataSource.js";
import { Job } from "../entities/Job.js";
import { User } from "../entities/User.js";
import { ApplicationStatusEnum } from "../entities/JobApplication.js";
import { ApplicationStatus } from "../entities/ApplicationStatus.js";
import { NotificationService } from "./NotificationService.js";
import { NotificationType } from "../entities/Notification.js";

export class JobApplicationService {
  constructor() {
    this.jobApplicationRepository = new JobApplicationRepository();
    this.jobRepository = AppDataSource.getRepository(Job);
    this.userRepository = AppDataSource.getRepository(User);
    this.applicationStatusRepository =
      AppDataSource.getRepository(ApplicationStatus);
    this.notificationService = new NotificationService();
  }

  async getAllJobApplications(query) {
    const {
      page = 1,
      limit = 20,
      jobId = "",
      interpreterId = "",
      status = "",
    } = query;

    const filters = {};
    if (jobId) filters.jobId = jobId;
    if (interpreterId) filters.interpreterId = interpreterId;
    if (status) filters.status = status;

    const [applications, total] =
      await this.jobApplicationRepository.findByFilters(
        filters,
        parseInt(page),
        parseInt(limit)
      );

    return {
      applications,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    };
  }

  async getJobApplicationById(id) {
    const application = await this.jobApplicationRepository.findById(
      parseInt(id),
      { relations: ["job", "interpreter", "job.organization"] }
    );
    if (!application) {
      throw new Error("Job application not found");
    }
    return application;
  }

  async createJobApplication(data) {
    const { jobId, interpreterId, coverLetter } = data;

    if (!jobId || !interpreterId) {
      throw new Error("jobId and interpreterId are required");
    }

    // Check if already applied
    const existing =
      await this.jobApplicationRepository.findByJobAndInterpreter(
        jobId,
        interpreterId
      );
    if (existing) {
      throw new Error("Already applied to this job");
    }

    // Verify job and interpreter exist
    const job = await this.jobRepository.findOne({
      where: { id: parseInt(jobId) },
    });
    const interpreter = await this.userRepository.findOne({
      where: { id: parseInt(interpreterId), role: "interpreter" },
    });

    if (!job) {
      throw new Error("Job not found");
    }

    if (!interpreter) {
      throw new Error("Interpreter not found");
    }

    // Get pending status from database
    const pendingStatus = await this.applicationStatusRepository.findOne({
      where: { name: ApplicationStatusEnum.PENDING },
    });

    if (!pendingStatus) {
      throw new Error(
        "System error: Pending application status not found in database"
      );
    }

    const application = await this.jobApplicationRepository.create({
      jobId: parseInt(jobId),
      interpreterId: parseInt(interpreterId),
      coverLetter: coverLetter || null,
      statusId: pendingStatus.id,
      status: pendingStatus.name, // For backward compatibility
      applicationDate: new Date(),
    });

    return application;
  }

  async updateJobApplication(id, data) {
    const application = await this.jobApplicationRepository.findById(
      parseInt(id)
    );
    if (!application) {
      throw new Error("Job application not found");
    }

    await this.jobApplicationRepository.update(parseInt(id), data);
    const updated = await this.jobApplicationRepository.findById(parseInt(id), {
      relations: ["job", "interpreter", "job.organization"],
    });

    if (updated?.interpreterId) {
      try {
        await this.notificationService.createNotification({
          recipientId: updated.interpreterId,
          actorId: updated.job?.organization?.ownerUserId || null,
          type: NotificationType.JOB_APPLICATION_STATUS,
          title: `Application ${updated.status}`,
          message: `Your application for ${updated.job?.title} is ${updated.status}`,
          metadata: {
            jobId: updated.jobId,
            applicationId: updated.id,
            status: updated.status,
          },
        });
      } catch (error) {
        console.error("Failed to send application status notification", error);
      }
    }

    return updated;
  }

  async deleteJobApplication(id) {
    const deleted = await this.jobApplicationRepository.delete(parseInt(id));
    if (!deleted) {
      throw new Error("Job application not found");
    }
    return true;
  }

  async getApplicationsByJobId(jobId) {
    const [applications] = await this.jobApplicationRepository.findByJobId(
      jobId,
      1,
      1000 // Get all applications for AI matching
    );
    
    // Load interpreter profiles for each application
    const applicationsWithProfiles = await Promise.all(
      applications.map(async (app) => {
        if (app.interpreter?.interpreterProfile) {
          return {
            ...app,
            interpreterProfile: app.interpreter.interpreterProfile,
          };
        }
        // If profile not loaded, fetch it
        const { InterpreterProfileService } = await import("./InterpreterProfileService.js");
        const profileService = new InterpreterProfileService();
        try {
          const profile = await profileService.getInterpreterProfileByUserId(app.interpreterId);
          return {
            ...app,
            interpreterProfile: profile,
          };
        } catch (error) {
          return app;
        }
      })
    );

    return applicationsWithProfiles;
  }

  async requestJobCompletion(applicationId, userId) {
    const application = await this.jobApplicationRepository.findById(
      parseInt(applicationId)
    );

    if (!application) {
      throw new Error("Job application not found");
    }

    // Only approved applications can be completed
    if (application.status !== ApplicationStatusEnum.APPROVED) {
      throw new Error("Job application is not approved yet");
    }

    // Check if user is either the interpreter or the client
    const job = await this.jobRepository.findOne({
      where: { id: application.jobId },
      relations: ["client"],
    });

    const isClient = job.clientId === parseInt(userId);
    const isInterpreter = application.interpreterId === parseInt(userId);

    if (!isClient && !isInterpreter) {
      throw new Error("Unauthorized");
    }

    // If already completed, return error
    if (application.completedAt) {
      throw new Error("Job already completed");
    }

    // If already requested by this user, return current state
    if (application.completionRequestedBy === parseInt(userId)) {
      return application;
    }

    // If other party already requested, this becomes confirmation
    if (
      application.completionRequestedBy &&
      application.completionRequestedBy !== parseInt(userId)
    ) {
      return await this.confirmJobCompletion(applicationId, userId);
    }

    // Set completion request
    application.completionRequestedBy = parseInt(userId);
    const updated = await this.jobApplicationRepository.repository.save(
      application
    );

    // Send notification to the other party
    const recipientId = isClient ? application.interpreterId : job.clientId;
    try {
      await this.notificationService.createNotification({
        userId: recipientId,
        type: NotificationType.JOB_COMPLETION_REQUESTED,
        title: "Yêu cầu hoàn thành công việc",
        message: `${
          isClient ? "Khách hàng" : "Phiên dịch viên"
        } đã yêu cầu hoàn thành công việc cho "${
          job.title
        }". Vui lòng xác nhận.`,
        relatedId: application.id,
        relatedType: "job_application",
      });
    } catch (error) {
      console.error("Failed to send completion request notification", error);
    }

    return await this.jobApplicationRepository.findById(updated.id);
  }

  async confirmJobCompletion(applicationId, userId) {
    const application = await this.jobApplicationRepository.findById(
      parseInt(applicationId)
    );

    if (!application) {
      throw new Error("Job application not found");
    }

    // Check if completion has been requested
    if (!application.completionRequestedBy) {
      throw new Error("Job completion has not been requested yet");
    }

    // Check if user is the other party (not the requester)
    const job = await this.jobRepository.findOne({
      where: { id: application.jobId },
      relations: ["client"],
    });

    const isClient = job.clientId === parseInt(userId);
    const isInterpreter = application.interpreterId === parseInt(userId);

    if (!isClient && !isInterpreter) {
      throw new Error("Unauthorized");
    }

    // User cannot confirm their own request
    if (application.completionRequestedBy === parseInt(userId)) {
      throw new Error("Cannot confirm your own completion request");
    }

    // Mark as completed
    application.completionConfirmedBy = parseInt(userId);
    application.completedAt = new Date();
    const updated = await this.jobApplicationRepository.repository.save(
      application
    );

    // Send notification to requester
    try {
      await this.notificationService.createNotification({
        userId: application.completionRequestedBy,
        type: NotificationType.JOB_COMPLETED,
        title: "Công việc đã hoàn thành",
        message: `Công việc "${job.title}" đã được xác nhận hoàn thành. Bạn có thể đánh giá ngay bây giờ.`,
        relatedId: application.id,
        relatedType: "job_application",
      });
    } catch (error) {
      console.error(
        "Failed to send completion confirmation notification",
        error
      );
    }

    return await this.jobApplicationRepository.findById(updated.id);
  }

  async cancelJobCompletionRequest(applicationId, userId) {
    const application = await this.jobApplicationRepository.findById(
      parseInt(applicationId)
    );

    if (!application) {
      throw new Error("Job application not found");
    }

    // Only the requester can cancel
    if (application.completionRequestedBy !== parseInt(userId)) {
      throw new Error("Unauthorized");
    }

    // Cannot cancel if already completed
    if (application.completedAt) {
      throw new Error("Job already completed");
    }

    application.completionRequestedBy = null;
    const updated = await this.jobApplicationRepository.repository.save(
      application
    );

    return await this.jobApplicationRepository.findById(updated.id);
  }
}
