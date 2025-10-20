import express from "express";
import {
  createVNPayPayment,
  verifyVNPayPayment,
  createPayPalPayment,
  verifyPayPalPayment,
  getPaymentHistory,
  getSubscriptionStatus,
  cancelSubscription,
  handleVNPayWebhook,
  handlePayPalWebhook,
  getSubscriptionPlans,
} from "../controllers/paymentController.js";
import { authRequired } from "../middleware/auth.js";

const router = express.Router();

// ==================== PUBLIC ROUTES ====================

// Get all subscription plans (public)
router.get("/plans", getSubscriptionPlans);

// Webhooks (no auth required - called by payment gateways)
router.post("/webhook/vnpay", handleVNPayWebhook);
router.post("/webhook/paypal", handlePayPalWebhook);

// ==================== PROTECTED ROUTES ====================

// Create payment
router.post("/vnpay/create", authRequired, createVNPayPayment);
router.post("/paypal/create", authRequired, createPayPalPayment);

// Verify payment (callback from payment gateway)
router.get("/vnpay/verify", verifyVNPayPayment); // Query params from redirect
router.post("/paypal/verify", authRequired, verifyPayPalPayment);

// Payment history
router.get("/history", authRequired, getPaymentHistory);

// Subscription management
router.get("/subscription", authRequired, getSubscriptionStatus);
router.post("/subscription/cancel", authRequired, cancelSubscription);

export default router;
