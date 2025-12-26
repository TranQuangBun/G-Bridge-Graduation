import { BaseRepository } from "./BaseRepository.js";
import { InterpreterProfile } from "../entities/InterpreterProfile.js";

export class InterpreterProfileRepository extends BaseRepository {
  constructor() {
    super(InterpreterProfile);
  }

  async findByUserId(userId) {
    return await this.repository.findOne({
      where: { userId: parseInt(userId) },
      relations: ["user"],
    });
  }

  async findByFilters(filters, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    const whereClause = {};

    if (filters.verificationStatus) {
      whereClause.verificationStatus = filters.verificationStatus;
    }

    if (filters.isAvailable !== undefined && filters.isAvailable !== "") {
      whereClause.isAvailable = filters.isAvailable === "true" || filters.isAvailable === true;
    }

    return await this.repository.findAndCount({
      where: whereClause,
      relations: ["user"],
      take: limit,
      skip: offset,
      order: { id: "DESC" },
    });
  }
}

