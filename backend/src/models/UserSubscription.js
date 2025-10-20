import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/database.js";

class UserSubscription extends Model {}

UserSubscription.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      comment: "Subscriber user ID",
    },
    planId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      comment: "Current subscription plan",
    },
    paymentId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      comment: "Initial payment that created this subscription",
    },
    status: {
      type: DataTypes.ENUM("active", "expired", "cancelled", "suspended"),
      defaultValue: "active",
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: false,
      comment: "Subscription start date",
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: false,
      comment: "Subscription end date",
    },
    autoRenew: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: "Auto-renewal enabled",
    },
    cancelledAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: "When subscription was cancelled",
    },
    cancellationReason: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Reason for cancellation",
    },
  },
  {
    sequelize,
    modelName: "UserSubscription",
    tableName: "user_subscriptions",
    timestamps: true,
    indexes: [
      { fields: ["userId"] },
      { fields: ["planId"] },
      { fields: ["status"] },
      { fields: ["endDate"] },
      { fields: ["userId", "status"] },
      { fields: ["userId", "status", "endDate"] },
    ],
  }
);

export default UserSubscription;
