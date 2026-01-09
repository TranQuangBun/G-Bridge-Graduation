import express from "express";
import {
  getPendingCertifications,
  approveCertification,
  rejectCertification,
  getOrganizations,
  getPendingOrganizations,
  approveOrganization,
  rejectOrganization,
  getSystemNotifications,
  createSystemNotification,
  getDashboardStats,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  toggleUserStatus,
  getRevenueStats,
  getAllPayments,
  getProblematicPayments,
  restorePayment,
} from "../controllers/AdminController.js";
import { authRequired, adminOnly } from "../middleware/auth.js";

const router = express.Router();

// All admin routes require authentication and admin role
router.use(authRequired);
router.use(adminOnly);

// Dashboard
router.get("/dashboard/stats", getDashboardStats);

// Certificate Approval
router.get("/certifications/pending", getPendingCertifications);
router.post("/certifications/:id/approve", approveCertification);
router.post("/certifications/:id/reject", rejectCertification);

// Organization Approval
router.get("/organizations", getOrganizations);
router.get("/organizations/pending", getPendingOrganizations);
router.post("/organizations/:id/approve", approveOrganization);
router.post("/organizations/:id/reject", rejectOrganization);

// System Notifications
router.get("/notifications/system", getSystemNotifications);
router.post("/notifications/system", createSystemNotification);

// User Management
router.get("/users", getAllUsers);
router.get("/users/:id", getUserById);
router.put("/users/:id", updateUser);
router.delete("/users/:id", deleteUser);
router.patch("/users/:id/toggle-status", toggleUserStatus);

// Revenue Management
router.get("/revenue/stats", getRevenueStats);
router.get("/revenue/payments", getAllPayments);

// Payment Recovery
router.get("/payments/problematic", getProblematicPayments);
router.post("/payments/:id/restore", restorePayment);

export default router;
