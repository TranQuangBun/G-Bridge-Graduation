import express from "express";
import {
  getAllDomains,
  getDomainById,
  createDomain,
  updateDomain,
  deleteDomain,
} from "../controllers/DomainController.js";
import { authRequired } from "../middleware/auth.js";

const router = express.Router();

router.get("/", getAllDomains);
router.get("/:id", getDomainById);
router.post("/", authRequired, createDomain);
router.put("/:id", authRequired, updateDomain);
router.delete("/:id", authRequired, deleteDomain);

export default router;

