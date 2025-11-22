import { BaseRepository } from "./BaseRepository.js";
import { PaymentRefund, RefundStatus } from "../entities/PaymentRefund.js";

export class PaymentRefundRepository extends BaseRepository {
  constructor() {
    super(PaymentRefund);
  }

  async findByPaymentId(paymentId) {
    return await this.repository.find({
      where: { paymentId: parseInt(paymentId) },
      relations: ["payment", "user", "processor"],
      order: { createdAt: "DESC" },
    });
  }

  async findByUserId(userId) {
    return await this.repository.find({
      where: { userId: parseInt(userId) },
      relations: ["payment", "user", "processor"],
      order: { createdAt: "DESC" },
    });
  }

  async findByStatus(status) {
    return await this.repository.find({
      where: { status },
      relations: ["payment", "user", "processor"],
      order: { createdAt: "DESC" },
    });
  }

  async findByFilters(filters, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    const whereClause = {};

    if (filters.paymentId) {
      whereClause.paymentId = parseInt(filters.paymentId);
    }

    if (filters.userId) {
      whereClause.userId = parseInt(filters.userId);
    }

    if (filters.status) {
      whereClause.status = filters.status;
    }

    return await this.repository.findAndCount({
      where: whereClause,
      relations: ["payment", "user", "processor"],
      take: limit,
      skip: offset,
      order: { createdAt: "DESC" },
    });
  }
}

