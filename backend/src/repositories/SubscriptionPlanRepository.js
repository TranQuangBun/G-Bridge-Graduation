import { BaseRepository } from "./BaseRepository.js";
import { SubscriptionPlan } from "../entities/SubscriptionPlan.js";

export class SubscriptionPlanRepository extends BaseRepository {
  constructor() {
    super(SubscriptionPlan);
  }

  async findActive() {
    return await this.repository.find({
      where: { isActive: true },
      order: { price: "ASC" },
    });
  }

  async findByDurationType(durationType) {
    return await this.repository.find({
      where: {
        durationType,
        isActive: true,
      },
      order: { price: "ASC" },
    });
  }

  async findByFilters(filters, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    const whereClause = {};

    if (filters.durationType) {
      whereClause.durationType = filters.durationType;
    }

    if (filters.isActive !== undefined && filters.isActive !== "") {
      whereClause.isActive = filters.isActive === "true" || filters.isActive === true;
    }

    return await this.repository.findAndCount({
      where: whereClause,
      take: limit,
      skip: offset,
      order: { price: "ASC" },
    });
  }
}

