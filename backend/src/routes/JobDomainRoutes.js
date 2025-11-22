import express from "express";
import {
  getAllJobDomains,
  getJobDomainByJobAndDomain,
  createJobDomain,
  deleteJobDomain,
} from "../controllers/JobDomainController.js";
import { authRequired } from "../middleware/auth.js";

const router = express.Router();

router.get("/", getAllJobDomains);
router.get("/job/:jobId/domain/:domainId", getJobDomainByJobAndDomain);
router.post("/", authRequired, createJobDomain);
router.delete("/job/:jobId/domain/:domainId", authRequired, deleteJobDomain);

export default router;
