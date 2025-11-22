import express from "express";
import {
  getAllBookingRequests,
  getBookingRequestById,
  createBookingRequest,
  updateBookingRequest,
  deleteBookingRequest,
} from "../controllers/BookingRequestController.js";
import { authRequired } from "../middleware/auth.js";

const router = express.Router();

router.get("/", authRequired, getAllBookingRequests);
router.get("/:id", authRequired, getBookingRequestById);
router.post("/", authRequired, createBookingRequest);
router.put("/:id", authRequired, updateBookingRequest);
router.delete("/:id", authRequired, deleteBookingRequest);

export default router;

