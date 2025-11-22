import express from "express";
import {
  createBookingRequest,
  getInterpreterBookings,
  getClientBookings,
  updateBookingStatus,
  getBookingDetail,
} from "../controllers/BookingController.js";
import { authRequired } from "../middleware/auth.js";

const router = express.Router();

router.use(authRequired);
router.post("/", createBookingRequest);
router.get("/interpreter", getInterpreterBookings);
router.get("/client", getClientBookings);
router.get("/:id", getBookingDetail);
router.patch("/:id/status", updateBookingStatus);

export default router;
