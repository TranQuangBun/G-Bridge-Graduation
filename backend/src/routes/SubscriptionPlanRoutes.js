import express from "express";
import {
  getAllSubscriptionPlans,
  getSubscriptionPlanById,
  createSubscriptionPlan,
  updateSubscriptionPlan,
  deleteSubscriptionPlan,
} from "../controllers/SubscriptionPlanController.js";
import { authRequired } from "../middleware/auth.js";

const router = express.Router();

router.get("/", getAllSubscriptionPlans);
router.get("/:id", getSubscriptionPlanById);
router.post("/", authRequired, createSubscriptionPlan);
router.put("/:id", authRequired, updateSubscriptionPlan);
router.delete("/:id", authRequired, deleteSubscriptionPlan);

export default router;

