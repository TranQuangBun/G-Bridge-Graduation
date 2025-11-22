import { SubscriptionPlanRepository } from "../repositories/SubscriptionPlanRepository.js";

export class SubscriptionPlanService {
  constructor() {
    this.subscriptionPlanRepository = new SubscriptionPlanRepository();
  }

  async getAllSubscriptionPlans(query) {
    const {
      page = 1,
      limit = 20,
      durationType = "",
      isActive = "",
    } = query;

    const filters = {};
    if (durationType) filters.durationType = durationType;
    if (isActive !== "") filters.isActive = isActive;

    const [plans, total] = await this.subscriptionPlanRepository.findByFilters(
      filters,
      parseInt(page),
      parseInt(limit)
    );

    return {
      plans,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    };
  }

  async getSubscriptionPlanById(id) {
    const plan = await this.subscriptionPlanRepository.findById(parseInt(id));
    if (!plan) {
      throw new Error("Subscription plan not found");
    }
    return plan;
  }

  async getActivePlans() {
    return await this.subscriptionPlanRepository.findActive();
  }

  async createSubscriptionPlan(data) {
    const plan = await this.subscriptionPlanRepository.create(data);
    return plan;
  }

  async updateSubscriptionPlan(id, data) {
    const plan = await this.subscriptionPlanRepository.findById(parseInt(id));
    if (!plan) {
      throw new Error("Subscription plan not found");
    }

    await this.subscriptionPlanRepository.update(parseInt(id), data);
    return await this.subscriptionPlanRepository.findById(parseInt(id));
  }

  async deleteSubscriptionPlan(id) {
    const deleted = await this.subscriptionPlanRepository.delete(parseInt(id));
    if (!deleted) {
      throw new Error("Subscription plan not found");
    }
    return true;
  }
}

