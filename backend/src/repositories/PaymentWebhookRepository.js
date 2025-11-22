import { BaseRepository } from "./BaseRepository.js";
import { PaymentWebhook } from "../entities/PaymentWebhook.js";

export class PaymentWebhookRepository extends BaseRepository {
  constructor() {
    super(PaymentWebhook);
  }

  async findByPaymentId(paymentId) {
    return await this.repository.find({
      where: { paymentId: parseInt(paymentId) },
      relations: ["payment"],
      order: { createdAt: "DESC" },
    });
  }

  async findByOrderId(orderId) {
    return await this.repository.find({
      where: { orderId },
      relations: ["payment"],
      order: { createdAt: "DESC" },
    });
  }

  async findUnprocessed() {
    return await this.repository.find({
      where: { processed: false },
      relations: ["payment"],
      order: { createdAt: "ASC" },
    });
  }

  async findByFilters(filters, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    const whereClause = {};

    if (filters.paymentId) {
      whereClause.paymentId = parseInt(filters.paymentId);
    }

    if (filters.gateway) {
      whereClause.gateway = filters.gateway;
    }

    if (filters.processed !== undefined && filters.processed !== "") {
      whereClause.processed = filters.processed === "true";
    }

    if (filters.orderId) {
      whereClause.orderId = filters.orderId;
    }

    return await this.repository.findAndCount({
      where: whereClause,
      relations: ["payment"],
      take: limit,
      skip: offset,
      order: { createdAt: "DESC" },
    });
  }
}

