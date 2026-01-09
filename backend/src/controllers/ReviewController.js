import { ReviewService } from "../services/ReviewService.js";
import { logError, AppError } from "../utils/Errors.js";
import { sendSuccess, sendError, sendPaginated } from "../utils/Response.js";

const reviewService = new ReviewService();

export async function createReview(req, res) {
  try {
    const reviewerId = req.user.id;
    const review = await reviewService.createReview(req.body, reviewerId);
    return sendSuccess(
      res,
      review,
      "Review created successfully",
      201
    );
  } catch (error) {
    if (error instanceof AppError) {
      return sendError(res, error.message, error.statusCode);
    }
    logError(error, "Creating review");
    return sendError(res, "Error creating review", 500, error);
  }
}

export async function getReviewsByRevieweeId(req, res) {
  try {
    const { revieweeId } = req.params;
    const { page, limit } = req.query;
    const data = await reviewService.getReviewsByRevieweeId(revieweeId, {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10,
    });

    return sendPaginated(
      res,
      data.reviews,
      data.pagination,
      "Reviews fetched successfully"
    );
  } catch (error) {
    logError(error, "Fetching reviews");
    return sendError(res, "Error fetching reviews", 500, error);
  }
}

export async function getReviewsByReviewerId(req, res) {
  try {
    const { reviewerId } = req.params;
    const { page, limit } = req.query;
    const data = await reviewService.getReviewsByReviewerId(reviewerId, {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10,
    });

    return sendPaginated(
      res,
      data.reviews,
      data.pagination,
      "Reviews fetched successfully"
    );
  } catch (error) {
    logError(error, "Fetching reviews");
    return sendError(res, "Error fetching reviews", 500, error);
  }
}

export async function getReviewsByJobApplicationId(req, res) {
  try {
    const { jobApplicationId } = req.params;
    const reviews = await reviewService.getReviewsByJobApplicationId(
      jobApplicationId
    );
    return sendSuccess(res, reviews, "Reviews fetched successfully");
  } catch (error) {
    logError(error, "Fetching reviews");
    return sendError(res, "Error fetching reviews", 500, error);
  }
}

export async function getReviewById(req, res) {
  try {
    const { id } = req.params;
    const review = await reviewService.getReviewById(id);
    return sendSuccess(res, review, "Review fetched successfully");
  } catch (error) {
    if (error instanceof AppError) {
      return sendError(res, error.message, error.statusCode || 404);
    }
    logError(error, "Fetching review");
    return sendError(res, "Error fetching review", 500, error);
  }
}

export async function updateReview(req, res) {
  try {
    const { id } = req.params;
    const reviewerId = req.user.id;
    const review = await reviewService.updateReview(id, req.body, reviewerId);
    return sendSuccess(res, review, "Review updated successfully");
  } catch (error) {
    if (error instanceof AppError) {
      return sendError(res, error.message, error.statusCode);
    }
    logError(error, "Updating review");
    return sendError(res, "Error updating review", 500, error);
  }
}

export async function deleteReview(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const result = await reviewService.deleteReview(id, userId);
    return sendSuccess(res, result, "Review deleted successfully");
  } catch (error) {
    if (error instanceof AppError) {
      return sendError(res, error.message, error.statusCode);
    }
    logError(error, "Deleting review");
    return sendError(res, "Error deleting review", 500, error);
  }
}

