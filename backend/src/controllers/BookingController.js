import { AppDataSource } from "../config/DataSource.js";
import { BookingRequest } from "../entities/BookingRequest.js";
import { User } from "../entities/User.js";
import { ClientProfile } from "../entities/ClientProfile.js";
import { logError, AppError } from "../utils/Errors.js";
import { sendSuccess, sendError, sendPaginated } from "../utils/Response.js";
import { NotificationService } from "../services/NotificationService.js";
import { NotificationType } from "../entities/Notification.js";

const notificationService = new NotificationService();

export const createBookingRequest = async (req, res) => {
  try {
    const clientId = req.user.sub; // JWT payload uses 'sub' for user ID
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

    if (!interpreterId || !serviceType || !topic) {
      return sendError(res, "Missing required fields", 400);
    }

    if (eventDuration === "single") {
      if (!eventDate || !startTime || !endTime) {
        return sendError(
          res,
          "Missing required fields for single day event",
          400
        );
      }
    } else if (eventDuration === "multiple") {
      if (!startDate || !endDate || !timeRequirement) {
        return sendError(
          res,
          "Missing required fields for multiple days event",
          400
        );
      }
    }

    if (bookingType === "offline" && !location) {
      return sendError(res, "Location is required for offline bookings", 400);
    }

    const userRepository = AppDataSource.getRepository(User);
    const interpreter = await userRepository.findOne({
      where: { id: parseInt(interpreterId) },
    });
    if (!interpreter || interpreter.role !== "interpreter") {
      return sendError(res, "Interpreter not found", 404);
    }

    const bookingRequestRepository =
      AppDataSource.getRepository(BookingRequest);
    const bookingRequest = bookingRequestRepository.create({
      clientId,
      interpreterId,
      serviceType,
      bookingType,
      location: bookingType === "offline" ? location : null,
      eventDuration,
      eventDate: eventDuration === "single" ? eventDate : null,
      startTime: eventDuration === "single" ? startTime : null,
      endTime: eventDuration === "single" ? endTime : null,
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

    const savedBookingRequest = await bookingRequestRepository.save(
      bookingRequest
    );

    try {
      await notificationService.createNotification({
        recipientId: interpreterId,
        actorId: clientId,
        type: NotificationType.BOOKING_REQUEST_CREATED,
        title: `New booking request: ${topic}`,
        message: `${
          fullName || "A client"
        } wants to book you for ${serviceType}`,
        metadata: {
          bookingId: savedBookingRequest.id,
          bookingType,
          eventDuration,
        },
      });
    } catch (notifyError) {
      logError(notifyError, "Sending booking request notification");
    }

    return sendSuccess(
      res,
      savedBookingRequest,
      "Booking request created successfully",
      201
    );
  } catch (error) {
    logError(error, "Creating booking request");
    return sendError(res, "Failed to create booking request", 500, error);
  }
};

export const getInterpreterBookings = async (req, res) => {
  try {
    const interpreterId = req.user.sub; // JWT payload uses 'sub' for user ID
    const { status, page = 1, limit = 10 } = req.query;

    const bookingRequestRepository =
      AppDataSource.getRepository(BookingRequest);
    const whereClause = { interpreterId: parseInt(interpreterId) };
    if (status) {
      whereClause.status = status;
    }

    const [bookings, count] = await bookingRequestRepository.findAndCount({
      where: whereClause,
      relations: ["client", "client.clientProfile"],
      select: {
        client: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
          avatar: true,
          clientProfile: {
            companyName: true,
            logo: true,
            website: true,
          },
        },
      },
      order: { createdAt: "DESC" },
      take: parseInt(limit),
      skip: (parseInt(page) - 1) * parseInt(limit),
    });

    return sendPaginated(
      res,
      bookings,
      {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / parseInt(limit)),
      },
      "Interpreter bookings fetched successfully"
    );
  } catch (error) {
    logError(error, "Fetching interpreter bookings");
    return sendError(res, "Failed to fetch booking requests", 500, error);
  }
};

export const getClientBookings = async (req, res) => {
  try {
    const clientId = req.user.id;
    const { status, page = 1, limit = 10 } = req.query;

    const bookingRequestRepository =
      AppDataSource.getRepository(BookingRequest);
    const whereClause = { clientId: parseInt(clientId) };
    if (status) {
      whereClause.status = status;
    }

    const [bookings, count] = await bookingRequestRepository.findAndCount({
      where: whereClause,
      relations: ["interpreter"],
      select: {
        interpreter: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
          avatar: true,
        },
      },
      order: { createdAt: "DESC" },
      take: parseInt(limit),
      skip: (parseInt(page) - 1) * parseInt(limit),
    });

    return sendPaginated(
      res,
      bookings,
      {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / parseInt(limit)),
      },
      "Client bookings fetched successfully"
    );
  } catch (error) {
    logError(error, "Fetching client bookings");
    return sendError(res, "Failed to fetch booking requests", 500, error);
  }
};

export const updateBookingStatus = async (req, res) => {
  try {
    const userId = req.user.sub; // JWT payload uses 'sub' for user ID
    const { id } = req.params;
    const { status, interpreterNotes } = req.body;

    // Validate status
    const validStatuses = ["accepted", "rejected", "completed", "cancelled"];
    if (!validStatuses.includes(status)) {
      return sendError(res, "Invalid status", 400);
    }

    const bookingRequestRepository =
      AppDataSource.getRepository(BookingRequest);
    const booking = await bookingRequestRepository.findOne({
      where: [
        { id: parseInt(id), interpreterId: parseInt(userId) },
        { id: parseInt(id), clientId: parseInt(userId) },
      ],
    });

    if (!booking) {
      return sendError(res, "Booking request not found", 404);
    }

    const isInterpreter = booking.interpreterId === parseInt(userId);
    const isClient = booking.clientId === parseInt(userId);

    if (isInterpreter) {
      if (
        (status === "accepted" || status === "rejected") &&
        booking.status !== "pending"
      ) {
        return sendError(res, "Can only accept/reject pending bookings", 400);
      }
    } else if (isClient) {
      if (status === "cancelled") {
        if (!["pending", "accepted"].includes(booking.status)) {
          return sendError(
            res,
            "Can only cancel pending or accepted bookings",
            400
          );
        }
      } else if (status !== "completed") {
        return sendError(
          res,
          "Client can only cancel or mark as completed",
          400
        );
      }
    }

    booking.status = status;
    if (interpreterNotes) {
      booking.interpreterNotes = interpreterNotes;
    }
    const updatedBooking = await bookingRequestRepository.save(booking);

    try {
      const recipientId = isInterpreter
        ? booking.clientId
        : booking.interpreterId;
      await notificationService.createNotification({
        recipientId,
        actorId: userId,
        type: NotificationType.BOOKING_STATUS_UPDATED,
        title: `Booking ${status}`,
        message: `Booking request ${
          booking.topic || booking.serviceType || ""
        } is now ${status}`,
        metadata: {
          bookingId: booking.id,
          status,
        },
      });
    } catch (notifyError) {
      logError(notifyError, "Sending booking status notification");
    }

    return sendSuccess(
      res,
      updatedBooking,
      "Booking status updated successfully"
    );
  } catch (error) {
    logError(error, "Updating booking status");
    return sendError(res, "Failed to update booking status", 500, error);
  }
};

export const getBookingById = async (req, res) => {
  try {
    const userId = req.user.sub; // JWT payload uses 'sub' for user ID
    const { id } = req.params;

    const bookingRequestRepository =
      AppDataSource.getRepository(BookingRequest);
    const booking = await bookingRequestRepository.findOne({
      where: [
        { id: parseInt(id), clientId: parseInt(userId) },
        { id: parseInt(id), interpreterId: parseInt(userId) },
      ],
      relations: ["client", "client.clientProfile", "interpreter"],
      select: {
        client: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
          avatar: true,
          clientProfile: {
            companyName: true,
            logo: true,
            website: true,
          },
        },
        interpreter: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
          avatar: true,
        },
      },
    });

    if (!booking) {
      return sendError(res, "Booking request not found", 404);
    }

    return sendSuccess(res, booking, "Booking detail fetched successfully");
  } catch (error) {
    logError(error, "Fetching booking detail");
    return sendError(res, "Failed to fetch booking detail", 500, error);
  }
};
