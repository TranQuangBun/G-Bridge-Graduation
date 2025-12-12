import express from "express";
import {
  getAllPayments,
  getPaymentById,
  createPayment,
  updatePayment,
  createVNPayPayment,
  verifyVNPayPayment,
  createPayPalPayment,
  verifyPayPalPayment,
  createMoMoPayment,
  verifyMoMoPayment,
  getPaymentHistory,
  getSubscriptionStatus,
  cancelSubscription,
  handleVNPayWebhook,
  handlePayPalWebhook,
  handleMoMoWebhook,
  getSubscriptionPlans,
} from "../controllers/PaymentController.js";
import { authRequired } from "../middleware/auth.js";

const router = express.Router();

router.get("/plans", getSubscriptionPlans);
router.post("/webhook/vnpay", handleVNPayWebhook);
router.post("/webhook/paypal", handlePayPalWebhook);
router.post("/webhook/momo", handleMoMoWebhook);
router.get("/", authRequired, getAllPayments);
router.post("/", authRequired, createPayment);
router.post("/vnpay/create", authRequired, createVNPayPayment);
router.post("/paypal/create", authRequired, createPayPalPayment);
router.post("/momo/create", authRequired, createMoMoPayment);
router.get("/vnpay/verify", verifyVNPayPayment);
router.get("/momo/verify", verifyMoMoPayment);
router.post("/paypal/verify", authRequired, verifyPayPalPayment);
router.get("/history", authRequired, getPaymentHistory);
router.get("/subscription", authRequired, getSubscriptionStatus);
router.post("/subscription/cancel", authRequired, cancelSubscription);
router.get("/:id", authRequired, getPaymentById);
router.put("/:id", authRequired, updatePayment);

export default router;
