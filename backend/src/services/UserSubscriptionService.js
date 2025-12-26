import { UserSubscriptionRepository } from "../repositories/UserSubscriptionRepository.js";
import { AppDataSource } from "../config/DataSource.js";
import { User } from "../entities/User.js";
import { SubscriptionPlan } from "../entities/SubscriptionPlan.js";
import { SubscriptionStatus } from "../entities/UserSubscription.js";

export class UserSubscriptionService {
  constructor() {
    this.userSubscriptionRepository = new UserSubscriptionRepository();
    this.userRepository = AppDataSource.getRepository(User);
    this.planRepository = AppDataSource.getRepository(SubscriptionPlan);
  }

  async getAllUserSubscriptions(query) {
    const {
      page = 1,
      limit = 20,
      userId = "",
      planId = "",
      status = "",
    } = query;

    const filters = {};
    if (userId) filters.userId = userId;
    if (planId) filters.planId = planId;
    if (status) filters.status = status;

    const [subscriptions, total] =
      await this.userSubscriptionRepository.findByFilters(
        filters,
        parseInt(page),
        parseInt(limit)
      );

    return {
      subscriptions,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    };
  }

  async getUserSubscriptionById(id) {
    const subscription = await this.userSubscriptionRepository.findById(
      parseInt(id),
      { relations: ["user", "plan", "payment"] }
    );
    if (!subscription) {
      throw new Error("User subscription not found");
    }
    return subscription;
  }

  async getUserSubscriptionByUserId(userId) {
    const userIdNum = typeof userId === 'number' ? userId : parseInt(userId);
    if (isNaN(userIdNum)) {
      throw new Error("Invalid user ID");
    }
    const subscription =
      await this.userSubscriptionRepository.findByUserId(userIdNum);
    if (!subscription) {
      throw new Error("User subscription not found");
    }
    return subscription;
  }

  async createUserSubscription(data) {
    const { userId, planId, paymentId, startDate, endDate, autoRenew } = data;

    if (!userId || !planId || !startDate || !endDate) {
      throw new Error(
        "userId, planId, startDate, and endDate are required"
      );
    }

    // Check if user already has an active subscription
    const existing =
      await this.userSubscriptionRepository.findActiveByUserId(userId);
    if (existing) {
      throw new Error("User already has an active subscription");
    }

    // Verify user and plan exist
    const user = await this.userRepository.findOne({
      where: { id: parseInt(userId) },
    });
    const plan = await this.planRepository.findOne({
      where: { id: parseInt(planId) },
    });

    if (!user) {
      throw new Error("User not found");
    }

    if (!plan) {
      throw new Error("Subscription plan not found");
    }

    const subscription = await this.userSubscriptionRepository.create({
      userId: parseInt(userId),
      planId: parseInt(planId),
      paymentId: paymentId ? parseInt(paymentId) : null,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      autoRenew: autoRenew || false,
      status: SubscriptionStatus.ACTIVE,
    });

    return subscription;
  }

  async updateUserSubscription(id, data) {
    const subscription = await this.userSubscriptionRepository.findById(
      parseInt(id)
    );
    if (!subscription) {
      throw new Error("User subscription not found");
    }

    // Convert date strings to Date objects if provided
    if (data.startDate) {
      data.startDate = new Date(data.startDate);
    }
    if (data.endDate) {
      data.endDate = new Date(data.endDate);
    }

    const updated = await this.userSubscriptionRepository.update(
      parseInt(id),
      data
    );
    return await this.userSubscriptionRepository.findById(parseInt(id), {
      relations: ["user", "plan", "payment"],
    });
  }

  async cancelUserSubscription(id, cancellationReason) {
    const subscription = await this.userSubscriptionRepository.findById(
      parseInt(id)
    );
    if (!subscription) {
      throw new Error("User subscription not found");
    }

    const updated = await this.userSubscriptionRepository.update(
      parseInt(id),
      {
        status: SubscriptionStatus.CANCELLED,
        cancelledAt: new Date(),
        cancellationReason: cancellationReason || null,
      }
    );

    return await this.userSubscriptionRepository.findById(parseInt(id), {
      relations: ["user", "plan", "payment"],
    });
  }
}

