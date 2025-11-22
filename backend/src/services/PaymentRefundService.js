import { PaymentRefundRepository } from "../repositories/PaymentRefundRepository.js";
import { AppDataSource } from "../config/DataSource.js";
import { Payment } from "../entities/Payment.js";
import { User } from "../entities/User.js";
import { RefundStatus } from "../entities/PaymentRefund.js";

export class PaymentRefundService {
  constructor() {
    this.paymentRefundRepository = new PaymentRefundRepository();
    this.paymentRepository = AppDataSource.getRepository(Payment);
    this.userRepository = AppDataSource.getRepository(User);
  }

  async getAllPaymentRefunds(query) {
    const {
      page = 1,
      limit = 20,
      paymentId = "",
      userId = "",
      status = "",
    } = query;

    const filters = {};
    if (paymentId) filters.paymentId = paymentId;
    if (userId) filters.userId = userId;
    if (status) filters.status = status;

    const [refunds, total] = await this.paymentRefundRepository.findByFilters(
      filters,
      parseInt(page),
      parseInt(limit)
    );

    return {
      refunds,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    };
  }

  async getPaymentRefundById(id) {
    const refund = await this.paymentRefundRepository.findById(parseInt(id), {
      relations: ["payment", "user", "processor"],
    });
    if (!refund) {
      throw new Error("Payment refund not found");
    }
    return refund;
  }

  async createPaymentRefund(data) {
    const { paymentId, userId, amount, currency, reason } = data;

    if (!paymentId || !userId || !amount) {
      throw new Error("paymentId, userId, and amount are required");
    }

    // Verify payment and user exist
    const payment = await this.paymentRepository.findOne({
      where: { id: parseInt(paymentId) },
    });
    const user = await this.userRepository.findOne({
      where: { id: parseInt(userId) },
    });

    if (!payment) {
      throw new Error("Payment not found");
    }

    if (!user) {
      throw new Error("User not found");
    }

    // Check if refund amount is valid
    if (parseFloat(amount) > parseFloat(payment.amount)) {
      throw new Error("Refund amount cannot exceed payment amount");
    }

    const refund = await this.paymentRefundRepository.create({
      paymentId: parseInt(paymentId),
      userId: parseInt(userId),
      amount: parseFloat(amount),
      currency: currency || payment.currency || "USD",
      reason: reason || null,
      status: RefundStatus.PENDING,
    });

    return refund;
  }

  async updatePaymentRefund(id, data) {
    const refund = await this.paymentRefundRepository.findById(parseInt(id));
    if (!refund) {
      throw new Error("Payment refund not found");
    }

    await this.paymentRefundRepository.update(parseInt(id), data);
    return await this.paymentRefundRepository.findById(parseInt(id), {
      relations: ["payment", "user", "processor"],
    });
  }

  async approvePaymentRefund(id, processedBy, refundTransactionId, notes) {
    const refund = await this.paymentRefundRepository.findById(parseInt(id));
    if (!refund) {
      throw new Error("Payment refund not found");
    }

    if (refund.status !== RefundStatus.PENDING) {
      throw new Error("Only pending refunds can be approved");
    }

    await this.paymentRefundRepository.update(parseInt(id), {
      status: RefundStatus.COMPLETED,
      processedBy: processedBy ? parseInt(processedBy) : null,
      processedAt: new Date(),
      refundTransactionId: refundTransactionId || null,
      notes: notes || null,
    });

    return await this.paymentRefundRepository.findById(parseInt(id), {
      relations: ["payment", "user", "processor"],
    });
  }

  async rejectPaymentRefund(id, processedBy, notes) {
    const refund = await this.paymentRefundRepository.findById(parseInt(id));
    if (!refund) {
      throw new Error("Payment refund not found");
    }

    if (refund.status !== RefundStatus.PENDING) {
      throw new Error("Only pending refunds can be rejected");
    }

    await this.paymentRefundRepository.update(parseInt(id), {
      status: RefundStatus.REJECTED,
      processedBy: processedBy ? parseInt(processedBy) : null,
      processedAt: new Date(),
      notes: notes || null,
    });

    return await this.paymentRefundRepository.findById(parseInt(id), {
      relations: ["payment", "user", "processor"],
    });
  }
}

