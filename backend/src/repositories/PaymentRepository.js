import { BaseRepository } from "./BaseRepository.js";
import { Payment } from "../entities/Payment.js";

export class PaymentRepository extends BaseRepository {
  constructor() {
    super(Payment);
  }

  async findByUserId(userId, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    return await this.repository.findAndCount({
      where: { userId: parseInt(userId) },
      relations: ["user", "plan", "subscription"],
      take: limit,
      skip: offset,
      order: { createdAt: "DESC" },
    });
  }

  async findByOrderId(orderId) {
    return await this.repository.findOne({
      where: { orderId },
      relations: ["user", "plan", "subscription"],
    });
  }

  async findByStatus(status, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    return await this.repository.findAndCount({
      where: { status },
      relations: ["user", "plan", "subscription"],
      take: limit,
      skip: offset,
      order: { createdAt: "DESC" },
    });
  }

  async findByGateway(gateway, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    return await this.repository.findAndCount({
      where: { paymentGateway: gateway },
      relations: ["user", "plan", "subscription"],
      take: limit,
      skip: offset,
      order: { createdAt: "DESC" },
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

    if (filters.paymentGateway) {
      whereClause.paymentGateway = filters.paymentGateway;
    }

    if (filters.orderId) {
      whereClause.orderId = filters.orderId;
    }

    return await this.repository.findAndCount({
      where: whereClause,
      relations: ["user", "plan", "subscription"],
      take: limit,
      skip: offset,
      order: { createdAt: "DESC" },
    });
  }
}

