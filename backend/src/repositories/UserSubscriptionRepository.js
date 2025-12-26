import { BaseRepository } from "./BaseRepository.js";
import { UserSubscription, SubscriptionStatus } from "../entities/UserSubscription.js";

export class UserSubscriptionRepository extends BaseRepository {
  constructor() {
    super(UserSubscription);
  }

  async findByUserId(userId) {
    const userIdNum = typeof userId === 'number' ? userId : parseInt(userId);
    if (isNaN(userIdNum)) {
      return null;
    }
    return await this.repository.findOne({
      where: { userId: userIdNum },
      relations: ["user", "plan", "payment"],
    });
  }

  async findActiveByUserId(userId) {
    const userIdNum = typeof userId === 'number' ? userId : parseInt(userId);
    if (isNaN(userIdNum)) {
      return null;
    }
    return await this.repository.findOne({
      where: {
        userId: userIdNum,
        status: SubscriptionStatus.ACTIVE,
      },
      relations: ["user", "plan", "payment"],
    });
  }

  async findByFilters(filters, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    const whereClause = {};

    if (filters.userId) {
      const userId = parseInt(filters.userId);
      if (!isNaN(userId)) {
        whereClause.userId = userId;
      }
    }

    if (filters.planId) {
      const planId = parseInt(filters.planId);
      if (!isNaN(planId)) {
        whereClause.planId = planId;
      }
    }

    if (filters.status) {
      whereClause.status = filters.status;
    }

    return await this.repository.findAndCount({
      where: whereClause,
      relations: ["user", "plan", "payment"],
      take: limit,
      skip: offset,
      order: { createdAt: "DESC" },
    });
  }
}

