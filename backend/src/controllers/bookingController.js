import { BookingRequest, User, ClientProfile } from "../models/index.js";
import { Op } from "sequelize";

// Create a new booking request
export const createBookingRequest = async (req, res) => {
  try {
    const clientId = req.user.id; // From auth middleware
    const {
      interpreterId,
      serviceType,
      bookingType,
      location,
      eventDuration,
      eventDate,
      startTime,
      endTime,
      startDate,
      endDate,
      timeRequirement,
      topic,
      fullName,
      email,
      phone,
      estimatedCost,
      estimatedHours,
    } = req.body;

    console.log("📝 Creating booking request:", {
      clientId,
      interpreterId,
      serviceType,
      eventDuration,
    });

    // Validate required fields
    if (!interpreterId || !serviceType || !topic) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    // Validate event duration fields
    if (eventDuration === "single") {
      if (!eventDate || !startTime || !endTime) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields for single day event",
        });
      }
    } else if (eventDuration === "multiple") {
      if (!startDate || !endDate || !timeRequirement) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields for multiple days event",
        });
      }
    }

    // Validate location for offline bookings
    if (bookingType === "offline" && !location) {
      return res.status(400).json({
        success: false,
        message: "Location is required for offline bookings",
      });
    }

    // Check if interpreter exists
    const interpreter = await User.findByPk(interpreterId);
    if (!interpreter || interpreter.role !== "interpreter") {
      return res.status(404).json({
        success: false,
        message: "Interpreter not found",
      });
    }

    // Create booking request
    const bookingRequest = await BookingRequest.create({
      clientId,
      interpreterId,
      serviceType,
      bookingType,
      location: bookingType === "offline" ? location : null,
      eventDuration,
      // Single day fields
      eventDate: eventDuration === "single" ? eventDate : null,
      startTime: eventDuration === "single" ? startTime : null,
      endTime: eventDuration === "single" ? endTime : null,
      // Multiple days fields
      startDate: eventDuration === "multiple" ? startDate : null,
      endDate: eventDuration === "multiple" ? endDate : null,
      timeRequirement: eventDuration === "multiple" ? timeRequirement : null,
      topic,
      fullName,
      email,
      phone,
      estimatedCost,
      estimatedHours,
      status: "pending",
    });

    console.log("✅ Booking request created:", bookingRequest.id);

    res.status(201).json({
      success: true,
      message: "Booking request created successfully",
      data: bookingRequest,
    });
  } catch (error) {
    console.error("❌ Error creating booking request:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create booking request",
      error: error.message,
    });
  }
};

// Get booking requests for interpreter
export const getInterpreterBookings = async (req, res) => {
  try {
    const interpreterId = req.user.id; // From auth middleware
    const { status, page = 1, limit = 10 } = req.query;

    console.log("📋 Getting bookings for interpreter:", interpreterId);

    const whereClause = { interpreterId };
    if (status) {
      whereClause.status = status;
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows: bookings } = await BookingRequest.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: "client",
          attributes: ["id", "fullName", "email", "phone", "avatar"],
          include: [
            {
              model: ClientProfile,
              as: "clientProfile",
              attributes: ["companyName", "logo", "website"],
            },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
      limit: parseInt(limit),
      offset,
    });

    console.log(`✅ Found ${count} booking requests`);

    res.json({
      success: true,
      data: {
        bookings,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    console.error("❌ Error fetching interpreter bookings:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch booking requests",
      error: error.message,
    });
  }
};

// Get booking requests sent by client
export const getClientBookings = async (req, res) => {
  try {
    const clientId = req.user.id;
    const { status, page = 1, limit = 10 } = req.query;

    const whereClause = { clientId };
    if (status) {
      whereClause.status = status;
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows: bookings } = await BookingRequest.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: "interpreter",
          attributes: ["id", "fullName", "email", "phone", "avatar"],
        },
      ],
      order: [["createdAt", "DESC"]],
      limit: parseInt(limit),
      offset,
    });

    res.json({
      success: true,
      data: {
        bookings,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    console.error("❌ Error fetching client bookings:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch booking requests",
      error: error.message,
    });
  }
};

// Update booking request status (for interpreter and client)
export const updateBookingStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { status, interpreterNotes } = req.body;

    console.log("📝 Updating booking status:", {
      id,
      userId,
      status,
    });

    // Validate status
    const validStatuses = ["accepted", "rejected", "completed", "cancelled"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    // Find booking request (can be updated by either interpreter or client)
    const booking = await BookingRequest.findOne({
      where: {
        id,
        [Op.or]: [{ interpreterId: userId }, { clientId: userId }],
      },
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking request not found",
      });
    }

    // Check permissions based on role
    const isInterpreter = booking.interpreterId === userId;
    const isClient = booking.clientId === userId;

    // Validation rules:
    // - Interpreter can: accept, reject (only if pending)
    // - Client can: cancel (only if pending or accepted)
    // - Both can mark as completed
    if (isInterpreter) {
      if (
        (status === "accepted" || status === "rejected") &&
        booking.status !== "pending"
      ) {
        return res.status(400).json({
          success: false,
          message: "Can only accept/reject pending bookings",
        });
      }
    } else if (isClient) {
      if (status === "cancelled") {
        if (!["pending", "accepted"].includes(booking.status)) {
          return res.status(400).json({
            success: false,
            message: "Can only cancel pending or accepted bookings",
          });
        }
      } else if (status !== "completed") {
        return res.status(400).json({
          success: false,
          message: "Client can only cancel or mark as completed",
        });
      }
    }

    // Update status
    booking.status = status;
    if (interpreterNotes) {
      booking.interpreterNotes = interpreterNotes;
    }
    await booking.save();

    console.log("✅ Booking status updated");

    res.json({
      success: true,
      message: "Booking status updated successfully",
      data: booking,
    });
  } catch (error) {
    console.error("❌ Error updating booking status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update booking status",
      error: error.message,
    });
  }
};

// Get single booking detail
export const getBookingDetail = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const booking = await BookingRequest.findOne({
      where: {
        id,
        [Op.or]: [{ clientId: userId }, { interpreterId: userId }],
      },
      include: [
        {
          model: User,
          as: "client",
          attributes: ["id", "fullName", "email", "phone", "avatar"],
          include: [
            {
              model: ClientProfile,
              as: "clientProfile",
              attributes: ["companyName", "companyLogo", "companyWebsite"],
            },
          ],
        },
        {
          model: User,
          as: "interpreter",
          attributes: ["id", "fullName", "email", "phone", "avatar"],
        },
      ],
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking request not found",
      });
    }

    res.json({
      success: true,
      data: booking,
    });
  } catch (error) {
    console.error("❌ Error fetching booking detail:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch booking detail",
      error: error.message,
    });
  }
};
