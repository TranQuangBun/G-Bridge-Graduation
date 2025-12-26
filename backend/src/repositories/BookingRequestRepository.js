import { BaseRepository } from "./BaseRepository.js";
import { BookingRequest } from "../entities/BookingRequest.js";

export class BookingRequestRepository extends BaseRepository {
  constructor() {
    super(BookingRequest);
  }

  async findByClientId(clientId, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    return await this.repository.findAndCount({
      where: { clientId: parseInt(clientId) },
      relations: ["client", "interpreter"],
      take: limit,
      skip: offset,
      order: { createdAt: "DESC" },
    });
  }

  async findByInterpreterId(interpreterId, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    return await this.repository.findAndCount({
      where: { interpreterId: parseInt(interpreterId) },
      relations: ["client", "interpreter"],
      take: limit,
      skip: offset,
      order: { createdAt: "DESC" },
    });
  }

  async findByStatus(status, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    return await this.repository.findAndCount({
      where: { status },
      relations: ["client", "interpreter"],
      take: limit,
      skip: offset,
      order: { createdAt: "DESC" },
    });
  }

  async findByFilters(filters, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    const whereClause = {};

    if (filters.clientId) {
      whereClause.clientId = parseInt(filters.clientId);
    }

    if (filters.interpreterId) {
      whereClause.interpreterId = parseInt(filters.interpreterId);
    }

    if (filters.status) {
      whereClause.status = filters.status;
    }

    if (filters.serviceType) {
      whereClause.serviceType = filters.serviceType;
    }

    if (filters.bookingType) {
      whereClause.bookingType = filters.bookingType;
    }

    return await this.repository.findAndCount({
      where: whereClause,
      relations: ["client", "interpreter"],
      take: limit,
      skip: offset,
      order: { createdAt: "DESC" },
    });
  }
}

