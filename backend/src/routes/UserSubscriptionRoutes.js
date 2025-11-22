import express from "express";
import {
  getAllUserSubscriptions,
  getUserSubscriptionById,
  getUserSubscriptionByUserId,
  createUserSubscription,
  updateUserSubscription,
  cancelUserSubscription,
} from "../controllers/UserSubscriptionController.js";
import { authRequired } from "../middleware/auth.js";

const router = express.Router();

router.get("/", authRequired, getAllUserSubscriptions);
router.get("/user/:userId", authRequired, getUserSubscriptionByUserId);
router.get("/:id", authRequired, getUserSubscriptionById);
router.post("/", authRequired, createUserSubscription);
router.put("/:id", authRequired, updateUserSubscription);
router.put("/:id/cancel", authRequired, cancelUserSubscription);

export default router;

