import { ReviewRepository } from "../repositories/ReviewRepository.js";
import { JobApplicationRepository } from "../repositories/JobApplicationRepository.js";
import { InterpreterProfileRepository } from "../repositories/InterpreterProfileRepository.js";
import { ClientProfileRepository } from "../repositories/ClientProfileRepository.js";
import { UserRepository } from "../repositories/UserRepository.js";
import { OrganizationRepository } from "../repositories/OrganizationRepository.js";
import { NotFoundError, AppError } from "../utils/Errors.js";
import { UserRole } from "../entities/User.js";

export class ReviewService {
  constructor() {
    this.reviewRepository = new ReviewRepository();
    this.jobApplicationRepository = new JobApplicationRepository();
    this.interpreterProfileRepository = new InterpreterProfileRepository();
    this.clientProfileRepository = new ClientProfileRepository();
    this.userRepository = new UserRepository();
    this.organizationRepository = new OrganizationRepository();
  }

  async createReview(data, reviewerId) {
    const { jobApplicationId, revieweeId, rating, comment } = data;

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      throw new AppError("Rating must be between 1 and 5", 400);
    }

    // Check if job application exists and is completed
    if (jobApplicationId) {
      const jobApplication = await this.jobApplicationRepository.findById(
        jobApplicationId,
        {
          relations: ["job", "job.organization", "interpreter"],
        }
      );

      if (!jobApplication) {
        throw new NotFoundError("Job application not found");
      }

      if (!jobApplication.completedAt) {
        throw new AppError(
          "Cannot review a job application that has not been completed",
          400
        );
      }

      // Verify reviewer is either the client (job owner) or interpreter
      const reviewer = await this.userRepository.findById(reviewerId);
      if (!reviewer) {
        throw new NotFoundError("Reviewer not found");
      }

      const job = jobApplication.job;
      
      // Check if reviewer is the organization owner (client)
      let isClientReviewer = false;
      if (job.organizationId) {
        const organization = await this.organizationRepository.findById(
          job.organizationId
        );
        if (organization && organization.ownerUserId === reviewerId) {
          isClientReviewer = true;
        }
      }

      const isInterpreterReviewer = jobApplication.interpreterId === reviewerId;

      if (!isClientReviewer && !isInterpreterReviewer) {
        throw new AppError(
          "Only the job owner or interpreter can review this job application",
          403
        );
      }

      // Check if review already exists for this job application by this reviewer
      const existingReview =
        await this.reviewRepository.findReviewByJobApplicationAndReviewer(
          jobApplicationId,
          reviewerId
        );
      if (existingReview) {
        throw new AppError(
          "You have already reviewed this job application",
          409
        );
      }

      // Determine revieweeId if not provided
      if (!revieweeId) {
        if (reviewer.role === UserRole.CLIENT) {
          // Client reviewing interpreter
          revieweeId = jobApplication.interpreterId;
        } else if (reviewer.role === UserRole.INTERPRETER) {
          // Interpreter reviewing client (job owner)
          const organization = await this.organizationRepository.findById(
            job.organizationId
          );
          if (organization) {
            revieweeId = organization.ownerUserId;
          }
        }
      }
    }

    // Verify reviewee exists
    const reviewee = await this.userRepository.findById(revieweeId);
    if (!reviewee) {
      throw new NotFoundError("Reviewee not found");
    }

    // Cannot review yourself
    if (reviewerId === revieweeId) {
      throw new AppError("Cannot review yourself", 400);
    }

    // Create review
    const review = await this.reviewRepository.create({
      jobApplicationId: jobApplicationId || null,
      reviewerId,
      revieweeId,
      rating,
      comment: comment || null,
    });

    // Update profile ratings
    await this.updateProfileRating(revieweeId);

    // Load relations for response
    const reviewWithRelations = await this.reviewRepository.findById(
      review.id,
      {
        relations: ["reviewer", "reviewee", "jobApplication"],
      }
    );

    return reviewWithRelations;
  }

  async updateProfileRating(userId) {
    const user = await this.userRepository.findById(userId, {
      relations: ["interpreterProfile", "clientProfile"],
    });

    if (!user) {
      return;
    }

    const ratingData = await this.reviewRepository.getAverageRating(userId);

    if (user.role === UserRole.INTERPRETER && user.interpreterProfile) {
      await this.interpreterProfileRepository.update(
        user.interpreterProfile.id,
        {
          rating: parseFloat(ratingData.average),
          totalReviews: ratingData.count,
        }
      );
    } else if (user.role === UserRole.CLIENT && user.clientProfile) {
      await this.clientProfileRepository.update(user.clientProfile.id, {
        rating: parseFloat(ratingData.average),
        totalReviews: ratingData.count,
      });
    }
  }

  async getReviewsByRevieweeId(revieweeId, options = {}) {
    const { page = 1, limit = 10 } = options;
    const offset = (page - 1) * limit;

    const [reviews, total] = await this.reviewRepository.repository.findAndCount(
      {
        where: { revieweeId },
        relations: ["reviewer", "reviewee", "jobApplication"],
        order: { createdAt: "DESC" },
        skip: offset,
        take: limit,
      }
    );

    return {
      reviews,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getReviewsByReviewerId(reviewerId, options = {}) {
    const { page = 1, limit = 10 } = options;
    const offset = (page - 1) * limit;

    const [reviews, total] = await this.reviewRepository.repository.findAndCount(
      {
        where: { reviewerId },
        relations: ["reviewer", "reviewee", "jobApplication"],
        order: { createdAt: "DESC" },
        skip: offset,
        take: limit,
      }
    );

    return {
      reviews,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getReviewsByJobApplicationId(jobApplicationId) {
    return await this.reviewRepository.findByJobApplicationId(
      jobApplicationId
    );
  }

  async getReviewById(id) {
    const review = await this.reviewRepository.findById(id, {
      relations: ["reviewer", "reviewee", "jobApplication"],
    });

    if (!review) {
      throw new NotFoundError("Review not found");
    }

    return review;
  }

  async updateReview(id, data, reviewerId) {
    const review = await this.reviewRepository.findById(id);

    if (!review) {
      throw new NotFoundError("Review not found");
    }

    if (review.reviewerId !== reviewerId) {
      throw new AppError("You can only update your own reviews", 403);
    }

    const { rating, comment } = data;

    if (rating && (rating < 1 || rating > 5)) {
      throw new AppError("Rating must be between 1 and 5", 400);
    }

    const updateData = {};
    if (rating !== undefined) updateData.rating = rating;
    if (comment !== undefined) updateData.comment = comment;

    await this.reviewRepository.update(id, updateData);

    // Update profile ratings
    await this.updateProfileRating(review.revieweeId);

    return await this.getReviewById(id);
  }

  async deleteReview(id, userId) {
    const review = await this.reviewRepository.findById(id);

    if (!review) {
      throw new NotFoundError("Review not found");
    }

    // Only reviewer or admin can delete
    const user = await this.userRepository.findById(userId);
    if (review.reviewerId !== userId && user.role !== UserRole.ADMIN) {
      throw new AppError("You can only delete your own reviews", 403);
    }

    const revieweeId = review.revieweeId;
    await this.reviewRepository.delete(id);

    // Update profile ratings
    await this.updateProfileRating(revieweeId);

    return { message: "Review deleted successfully" };
  }
}

