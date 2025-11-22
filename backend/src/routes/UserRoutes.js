import express from "express";
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
} from "../controllers/UserController.js";
import { authRequired } from "../middleware/auth.js";

const router = express.Router();

router.get("/", authRequired, getAllUsers);
router.get("/:id", authRequired, getUserById);
router.post("/", authRequired, createUser);
router.put("/:id", authRequired, updateUser);
router.delete("/:id", authRequired, deleteUser);

export default router;
