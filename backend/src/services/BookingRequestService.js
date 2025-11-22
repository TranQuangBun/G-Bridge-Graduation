import { BookingRequestRepository } from "../repositories/BookingRequestRepository.js";
import { AppDataSource } from "../config/DataSource.js";
import { User } from "../entities/User.js";

export class BookingRequestService {
  constructor() {
    this.bookingRequestRepository = new BookingRequestRepository();
    this.userRepository = AppDataSource.getRepository(User);
  }

  async getAllBookingRequests(query) {
    const {
      page = 1,
      limit = 20,
      clientId = "",
      interpreterId = "",
      status = "",
      serviceType = "",
      bookingType = "",
    } = query;

    const filters = {};
    if (clientId) filters.clientId = clientId;
    if (interpreterId) filters.interpreterId = interpreterId;
    if (status) filters.status = status;
    if (serviceType) filters.serviceType = serviceType;
    if (bookingType) filters.bookingType = bookingType;

    const [bookingRequests, total] =
      await this.bookingRequestRepository.findByFilters(
        filters,
        parseInt(page),
        parseInt(limit)
      );

    return {
      bookingRequests,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    };
  }

  async getBookingRequestById(id) {
    const bookingRequest = await this.bookingRequestRepository.findById(
      parseInt(id),
      { relations: ["client", "interpreter"] }
    );
    if (!bookingRequest) {
      throw new Error("Booking request not found");
    }
    return bookingRequest;
  }

  async createBookingRequest(data) {
    const {
      clientId,
      interpreterId,
      serviceType,
      bookingType,
      eventName,
      eventDate,
      eventDuration,
      location,
      description,
    } = data;

    if (!clientId || !interpreterId || !serviceType || !bookingType) {
      throw new Error(
        "clientId, interpreterId, serviceType, and bookingType are required"
      );
    }

    // Verify users exist
    const client = await this.userRepository.findOne({
      where: { id: parseInt(clientId) },
    });
    const interpreter = await this.userRepository.findOne({
      where: { id: parseInt(interpreterId) },
    });

    if (!client) {
      throw new Error("Client not found");
    }

    if (!interpreter) {
      throw new Error("Interpreter not found");
    }

    const bookingRequest = await this.bookingRequestRepository.create({
      clientId: parseInt(clientId),
      interpreterId: parseInt(interpreterId),
      serviceType,
      bookingType,
      eventName: eventName || null,
      eventDate: eventDate ? new Date(eventDate) : null,
      eventDuration: eventDuration || null,
      location: location || null,
      description: description || null,
      status: "pending",
    });

    return bookingRequest;
  }

  async updateBookingRequest(id, data) {
    const bookingRequest = await this.bookingRequestRepository.findById(
      parseInt(id)
    );
    if (!bookingRequest) {
      throw new Error("Booking request not found");
    }

    // Convert date strings to Date objects if provided
    if (data.eventDate) {
      data.eventDate = new Date(data.eventDate);
    }

    await this.bookingRequestRepository.update(parseInt(id), data);
    return await this.bookingRequestRepository.findById(parseInt(id), {
      relations: ["client", "interpreter"],
    });
  }

  async deleteBookingRequest(id) {
    const deleted = await this.bookingRequestRepository.delete(parseInt(id));
    if (!deleted) {
      throw new Error("Booking request not found");
    }
    return true;
  }
}

