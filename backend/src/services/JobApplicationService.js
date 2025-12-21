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
    this.applicationStatusRepository = AppDataSource.getRepository(ApplicationStatus);
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
    const existing = await this.jobApplicationRepository.findByJobAndInterpreter(
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
      throw new Error("System error: Pending application status not found in database");
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
}

