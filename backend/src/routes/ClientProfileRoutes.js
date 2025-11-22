import express from "express";
import {
  getAllClientProfiles,
  getClientProfileById,
  createClientProfile,
  updateClientProfile,
  deleteClientProfile,
} from "../controllers/ClientProfileController.js";
import { authRequired } from "../middleware/auth.js";

const router = express.Router();

router.get("/", authRequired, getAllClientProfiles);
router.get("/:id", authRequired, getClientProfileById);
router.post("/", authRequired, createClientProfile);
router.put("/:id", authRequired, updateClientProfile);
router.delete("/:id", authRequired, deleteClientProfile);

export default router;

