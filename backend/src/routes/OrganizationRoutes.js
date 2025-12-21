import express from "express";
import {
  getAllOrganizations,
  getOrganizationById,
  createOrganization,
  updateOrganization,
  deleteOrganization,
  uploadOrganizationLicense,
} from "../controllers/OrganizationController.js";
import { authRequired } from "../middleware/auth.js";
import { uploadBusinessLicense } from "../middleware/Upload.js";

const router = express.Router();

router.get("/", getAllOrganizations);
router.get("/:id", getOrganizationById);
router.post("/", authRequired, createOrganization);
router.put("/:id", authRequired, updateOrganization);
router.delete("/:id", authRequired, deleteOrganization);
router.post(
  "/:id/upload-license",
  authRequired,
  uploadBusinessLicense.single("businessLicense"),
  uploadOrganizationLicense
);

export default router;
