import { EntitySchema } from "typeorm";
import { Payment } from "./Payment.js";
import { UserSubscription } from "./UserSubscription.js";

export const DurationType = {
  MONTHLY: "monthly",
  YEARLY: "yearly",
  LIFETIME: "lifetime",
};

export class SubscriptionPlan {
  id;
  name;
  displayName;
  description;
  price;
  currency;
  duration;
  durationType;
  features;
  maxInterpreterViews;
  maxJobPosts;
  allowedRoles;
  isActive;
  sortOrder;
  createdAt;
  updatedAt;
  payments;
  subscriptions;
}

export const SubscriptionPlanSchema = new EntitySchema({
  name: "SubscriptionPlan",
  tableName: "subscription_plans",
  target: SubscriptionPlan,
  columns: {
    id: {
      type: "int",
      primary: true,
      generated: true,
      unsigned: true,
    },
    name: {
      type: "varchar",
      length: 100,
      unique: true,
    },
    displayName: {
      type: "varchar",
      length: 100,
    },
    description: {
      type: "text",
      nullable: true,
    },
    price: {
      type: "decimal",
      precision: 10,
      scale: 2,
    },
    currency: {
      type: "varchar",
      length: 3,
      default: "USD",
    },
    duration: {
      type: "int",
    },
    durationType: {
      type: "enum",
      enum: Object.values(DurationType),
      default: DurationType.MONTHLY,
    },
    features: {
      type: "json",
      nullable: true,
    },
    maxInterpreterViews: {
      type: "int",
      nullable: true,
    },
    maxJobPosts: {
      type: "int",
      nullable: true,
    },
    allowedRoles: {
      type: "json",
      nullable: true,
    },
    isActive: {
      type: "boolean",
      default: true,
    },
    sortOrder: {
      type: "int",
      default: 0,
    },
    createdAt: {
      type: "datetime",
      createDate: true,
    },
    updatedAt: {
      type: "datetime",
      updateDate: true,
    },
  },
  indices: [
    {
      name: "IDX_subscription_plans_isActive",
      columns: ["isActive"],
    },
    {
      name: "IDX_subscription_plans_sortOrder",
      columns: ["sortOrder"],
    },
    {
      name: "UQ_subscription_plans_name",
      unique: true,
      columns: ["name"],
    },
  ],
  relations: {
    payments: {
      type: "one-to-many",
      target: () => Payment,
      inverseSide: "plan",
    },
    subscriptions: {
      type: "one-to-many",
      target: () => UserSubscription,
      inverseSide: "plan",
    },
  },
});
