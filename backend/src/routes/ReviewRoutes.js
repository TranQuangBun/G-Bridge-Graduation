import express from "express";
import {
  createReview,
  getReviewsByRevieweeId,
  getReviewsByReviewerId,
  getReviewsByJobApplicationId,
  getReviewById,
  updateReview,
  deleteReview,
} from "../controllers/ReviewController.js";
import { authRequired } from "../middleware/auth.js";

const router = express.Router();

// All routes require authentication
router.post("/", authRequired, createReview);
router.get("/reviewee/:revieweeId", authRequired, getReviewsByRevieweeId);
router.get("/reviewer/:reviewerId", authRequired, getReviewsByReviewerId);
router.get(
  "/job-application/:jobApplicationId",
  authRequired,
  getReviewsByJobApplicationId
);
router.get("/:id", authRequired, getReviewById);
router.put("/:id", authRequired, updateReview);
router.delete("/:id", authRequired, deleteReview);

export default router;

