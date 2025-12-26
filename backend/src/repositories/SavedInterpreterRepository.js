import { BaseRepository } from "./BaseRepository.js";
import { SavedInterpreter } from "../entities/SavedInterpreter.js";

export class SavedInterpreterRepository extends BaseRepository {
  constructor() {
    super(SavedInterpreter);
  }

  async findByUserAndInterpreter(userId, interpreterId) {
    return await this.repository.findOne({
      where: {
        userId: parseInt(userId),
        interpreterId: parseInt(interpreterId),
      },
      relations: ["user", "interpreter"],
    });
  }

  async findByFilters(filters, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    const whereClause = {};

    if (filters.userId) {
      whereClause.userId = parseInt(filters.userId);
    }

    if (filters.interpreterId) {
      whereClause.interpreterId = parseInt(filters.interpreterId);
    }

    return await this.repository.findAndCount({
      where: whereClause,
      relations: ["user", "interpreter", "interpreter.interpreterProfile"],
      take: limit,
      skip: offset,
      order: { savedDate: "DESC" },
    });
  }

  async deleteByUserAndInterpreter(userId, interpreterId) {
    const result = await this.repository.delete({
      userId: parseInt(userId),
      interpreterId: parseInt(interpreterId),
    });
    return result.affected > 0;
  }
}
