import { PaymentRepository } from "../repositories/PaymentRepository.js";
import { AppDataSource } from "../config/DataSource.js";
import { User } from "../entities/User.js";
import { SubscriptionPlan } from "../entities/SubscriptionPlan.js";

export class PaymentService {
  constructor() {
    this.paymentRepository = new PaymentRepository();
    this.userRepository = AppDataSource.getRepository(User);
    this.planRepository = AppDataSource.getRepository(SubscriptionPlan);
  }

  async getAllPayments(query) {
    const {
      page = 1,
      limit = 20,
      userId = "",
      planId = "",
      status = "",
      paymentGateway = "",
      orderId = "",
    } = query;

    const filters = {};
    if (userId) filters.userId = userId;
    if (planId) filters.planId = planId;
    if (status) filters.status = status;
    if (paymentGateway) filters.paymentGateway = paymentGateway;
    if (orderId) filters.orderId = orderId;

    const [payments, total] = await this.paymentRepository.findByFilters(
      filters,
      parseInt(page),
      parseInt(limit)
    );

    return {
      payments,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    };
  }

  async getPaymentById(id) {
    const paymentId = typeof id === 'number' ? id : parseInt(id);
    if (isNaN(paymentId)) {
      throw new Error("Invalid payment ID");
    }
    const payment = await this.paymentRepository.findById(paymentId, {
      relations: ["user", "plan", "subscription"],
    });
    if (!payment) {
      throw new Error("Payment not found");
    }
    return payment;
  }

  async getPaymentByOrderId(orderId) {
    const payment = await this.paymentRepository.findByOrderId(orderId);
    if (!payment) {
      throw new Error("Payment not found");
    }
    return payment;
  }

  async createPayment(data) {
    const {
      userId,
      planId,
      amount,
      currency,
      paymentGateway,
      orderId,
      description,
    } = data;

    if (!userId || !amount || !paymentGateway || !orderId) {
      throw new Error(
        "userId, amount, paymentGateway, and orderId are required"
      );
    }

    // Verify user and plan exist
    const user = await this.userRepository.findOne({
      where: { id: parseInt(userId) },
    });
    const plan = planId
      ? await this.planRepository.findOne({
          where: { id: parseInt(planId) },
        })
      : null;

    if (!user) {
      throw new Error("User not found");
    }

    if (planId && !plan) {
      throw new Error("Subscription plan not found");
    }

    const payment = await this.paymentRepository.create({
      userId: parseInt(userId),
      planId: planId ? parseInt(planId) : null,
      amount: parseFloat(amount),
      currency: currency || "USD",
      paymentGateway,
      orderId,
      description: description || null,
      status: "pending",
    });

    return payment;
  }

  async updatePayment(id, data) {
    const payment = await this.paymentRepository.findById(parseInt(id));
    if (!payment) {
      throw new Error("Payment not found");
    }

    await this.paymentRepository.update(parseInt(id), data);
    return await this.paymentRepository.findById(parseInt(id), {
      relations: ["user", "plan", "subscription"],
    });
  }
}

