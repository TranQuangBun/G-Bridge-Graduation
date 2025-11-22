import express from "express";
import {
  getAllOrganizations,
  getOrganizationById,
  createOrganization,
  updateOrganization,
  deleteOrganization,
} from "../controllers/OrganizationController.js";
import { authRequired } from "../middleware/auth.js";

const router = express.Router();

router.get("/", getAllOrganizations);
router.get("/:id", getOrganizationById);
router.post("/", authRequired, createOrganization);
router.put("/:id", authRequired, updateOrganization);
router.delete("/:id", authRequired, deleteOrganization);

export default router;

