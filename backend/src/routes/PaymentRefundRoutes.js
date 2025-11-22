import express from "express";
import {
  getAllPaymentRefunds,
  getPaymentRefundById,
  createPaymentRefund,
  updatePaymentRefund,
  approvePaymentRefund,
  rejectPaymentRefund,
} from "../controllers/PaymentRefundController.js";
import { authRequired } from "../middleware/auth.js";

const router = express.Router();

router.get("/", authRequired, getAllPaymentRefunds);
router.get("/:id", authRequired, getPaymentRefundById);
router.post("/", authRequired, createPaymentRefund);
router.put("/:id", authRequired, updatePaymentRefund);
router.put("/:id/approve", authRequired, approvePaymentRefund);
router.put("/:id/reject", authRequired, rejectPaymentRefund);

export default router;

