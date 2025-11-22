import express from "express";
import {
  getAllPaymentWebhooks,
  getPaymentWebhookById,
  createPaymentWebhook,
  updatePaymentWebhook,
  deletePaymentWebhook,
} from "../controllers/PaymentWebhookController.js";
import { authRequired } from "../middleware/auth.js";

const router = express.Router();

router.get("/", authRequired, getAllPaymentWebhooks);
router.get("/:id", authRequired, getPaymentWebhookById);
router.post("/", createPaymentWebhook);
router.put("/:id", authRequired, updatePaymentWebhook);
router.delete("/:id", authRequired, deletePaymentWebhook);

export default router;

