import { EntitySchema } from "typeorm";
import { User } from "./User.js";
import { SubscriptionPlan } from "./SubscriptionPlan.js";
import { Payment } from "./Payment.js";

export const SubscriptionStatus = {
  ACTIVE: "active",
  EXPIRED: "expired",
  CANCELLED: "cancelled",
  SUSPENDED: "suspended",
};

export class UserSubscription {
  id;
  userId;
  planId;
  paymentId;
  status;
  startDate;
  endDate;
  autoRenew;
  cancelledAt;
  cancellationReason;
  createdAt;
  updatedAt;
  user;
  plan;
  payment;
}

export const UserSubscriptionSchema = new EntitySchema({
  name: "UserSubscription",
  tableName: "user_subscriptions",
  target: UserSubscription,
  columns: {
    id: {
      type: "int",
      primary: true,
      generated: true,
      unsigned: true,
    },
    userId: {
      type: "int",
      unsigned: true,
      unique: true,
    },
    planId: {
      type: "int",
      unsigned: true,
    },
    paymentId: {
      type: "int",
      unsigned: true,
      nullable: true,
    },
    status: {
      type: "enum",
      enum: Object.values(SubscriptionStatus),
      default: SubscriptionStatus.ACTIVE,
    },
    startDate: {
      type: "datetime",
    },
    endDate: {
      type: "datetime",
    },
    autoRenew: {
      type: "boolean",
      default: false,
    },
    cancelledAt: {
      type: "datetime",
      nullable: true,
    },
    cancellationReason: {
      type: "text",
      nullable: true,
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
      name: "UQ_user_subscriptions_userId",
      unique: true,
      columns: ["userId"],
    },
    {
      name: "IDX_user_subscriptions_planId",
      columns: ["planId"],
    },
    {
      name: "IDX_user_subscriptions_status",
      columns: ["status"],
    },
    {
      name: "IDX_user_subscriptions_endDate",
      columns: ["endDate"],
    },
    {
      name: "IDX_user_subscriptions_userId_status",
      columns: ["userId", "status"],
    },
    {
      name: "IDX_user_subscriptions_userId_status_endDate",
      columns: ["userId", "status", "endDate"],
    },
  ],
  relations: {
    user: {
      type: "many-to-one",
      target: () => User,
      inverseSide: "activeSubscription",
      joinColumn: {
        name: "userId",
      },
      onDelete: "CASCADE",
    },
    plan: {
      type: "many-to-one",
      target: () => SubscriptionPlan,
      inverseSide: "subscriptions",
      joinColumn: {
        name: "planId",
      },
      onDelete: "RESTRICT",
    },
    payment: {
      type: "many-to-one",
      target: () => Payment,
      inverseSide: "subscription",
      joinColumn: {
        name: "paymentId",
      },
      onDelete: "SET NULL",
      nullable: true,
    },
  },
});
