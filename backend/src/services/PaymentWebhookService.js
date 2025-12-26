import { PaymentWebhookRepository } from "../repositories/PaymentWebhookRepository.js";
import { AppDataSource } from "../config/DataSource.js";
import { Payment } from "../entities/Payment.js";

export class PaymentWebhookService {
  constructor() {
    this.paymentWebhookRepository = new PaymentWebhookRepository();
    this.paymentRepository = AppDataSource.getRepository(Payment);
  }

  async getAllPaymentWebhooks(query) {
    const {
      page = 1,
      limit = 20,
      paymentId = "",
      gateway = "",
      processed = "",
      orderId = "",
    } = query;

    const filters = {};
    if (paymentId) filters.paymentId = paymentId;
    if (gateway) filters.gateway = gateway;
    if (processed !== "") filters.processed = processed;
    if (orderId) filters.orderId = orderId;

    const [webhooks, total] =
      await this.paymentWebhookRepository.findByFilters(
        filters,
        parseInt(page),
        parseInt(limit)
      );

    return {
      webhooks,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    };
  }

  async getPaymentWebhookById(id) {
    const webhook = await this.paymentWebhookRepository.findById(
      parseInt(id),
      { relations: ["payment"] }
    );
    if (!webhook) {
      throw new Error("Payment webhook not found");
    }
    return webhook;
  }

  async createPaymentWebhook(data, ipAddress) {
    const {
      paymentId,
      gateway,
      eventType,
      orderId,
      transactionId,
      status,
      rawData,
    } = data;

    if (!gateway || !rawData) {
      throw new Error("gateway and rawData are required");
    }

    // Verify payment exists if paymentId provided
    if (paymentId) {
      const payment = await this.paymentRepository.findOne({
        where: { id: parseInt(paymentId) },
      });
      if (!payment) {
        throw new Error("Payment not found");
      }
    }

    const webhook = await this.paymentWebhookRepository.create({
      paymentId: paymentId ? parseInt(paymentId) : null,
      gateway,
      eventType: eventType || null,
      orderId: orderId || null,
      transactionId: transactionId || null,
      status: status || null,
      rawData,
      ipAddress: ipAddress || null,
      processed: false,
    });

    return webhook;
  }

  async updatePaymentWebhook(id, data) {
    const webhook = await this.paymentWebhookRepository.findById(parseInt(id));
    if (!webhook) {
      throw new Error("Payment webhook not found");
    }

    // If marking as processed, set processedAt
    if (data.processed && !webhook.processed) {
      data.processedAt = new Date();
    }

    await this.paymentWebhookRepository.update(parseInt(id), data);
    return await this.paymentWebhookRepository.findById(parseInt(id), {
      relations: ["payment"],
    });
  }

  async deletePaymentWebhook(id) {
    const deleted = await this.paymentWebhookRepository.delete(parseInt(id));
    if (!deleted) {
      throw new Error("Payment webhook not found");
    }
    return true;
  }
}

