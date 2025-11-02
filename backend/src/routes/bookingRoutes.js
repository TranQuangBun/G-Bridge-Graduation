import express from "express";
import {
  createBookingRequest,
  getInterpreterBookings,
  getClientBookings,
  updateBookingStatus,
  getBookingDetail,
} from "../controllers/bookingController.js";
import { authRequired } from "../middleware/auth.js";

const router = express.Router();

// All routes require authentication
router.use(authRequired);

// Create a booking request (for clients/companies)
router.post("/", createBookingRequest);

// Get bookings for interpreter
router.get("/interpreter", getInterpreterBookings);

// Get bookings sent by client
router.get("/client", getClientBookings);

// Get single booking detail
router.get("/:id", getBookingDetail);

// Update booking status (for interpreter)
router.patch("/:id/status", updateBookingStatus);

export default router;
