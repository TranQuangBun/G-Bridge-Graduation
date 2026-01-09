import { BaseRepository } from "./BaseRepository.js";
import { Review } from "../entities/Review.js";

export class ReviewRepository extends BaseRepository {
  constructor() {
    super(Review);
  }

  async findByRevieweeId(revieweeId, options = {}) {
    return await this.repository.find({
      where: { revieweeId },
      relations: ["reviewer", "reviewee", "jobApplication"],
      order: { createdAt: "DESC" },
      ...options,
    });
  }

  async findByReviewerId(reviewerId, options = {}) {
    return await this.repository.find({
      where: { reviewerId },
      relations: ["reviewer", "reviewee", "jobApplication"],
      order: { createdAt: "DESC" },
      ...options,
    });
  }

  async findByJobApplicationId(jobApplicationId) {
    return await this.repository.find({
      where: { jobApplicationId },
      relations: ["reviewer", "reviewee", "jobApplication"],
      order: { createdAt: "DESC" },
    });
  }

  async findReviewByJobApplicationAndReviewer(jobApplicationId, reviewerId) {
    return await this.repository.findOne({
      where: { jobApplicationId, reviewerId },
      relations: ["reviewer", "reviewee", "jobApplication"],
    });
  }

  async getAverageRating(revieweeId) {
    const result = await this.repository
      .createQueryBuilder("review")
      .select("AVG(review.rating)", "average")
      .addSelect("COUNT(review.id)", "count")
      .where("review.revieweeId = :revieweeId", { revieweeId })
      .getRawOne();

    return {
      average: result?.average ? parseFloat(result.average).toFixed(1) : "0.0",
      count: parseInt(result?.count || 0),
    };
  }
}

