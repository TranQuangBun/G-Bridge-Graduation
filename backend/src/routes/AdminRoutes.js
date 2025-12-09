import express from "express";
import {
  getPendingCertifications,
  approveCertification,
  rejectCertification,
  getPendingOrganizations,
  approveOrganization,
  rejectOrganization,
  createSystemNotification,
  getDashboardStats,
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
router.get("/organizations/pending", getPendingOrganizations);
router.post("/organizations/:id/approve", approveOrganization);
router.post("/organizations/:id/reject", rejectOrganization);

// System Notifications
router.post("/notifications/system", createSystemNotification);

export default router;

