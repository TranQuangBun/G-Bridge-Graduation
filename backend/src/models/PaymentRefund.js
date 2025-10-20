import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/database.js";

class PaymentRefund extends Model {}

PaymentRefund.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    paymentId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      comment: "Original payment ID",
    },
    userId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      comment: "User requesting refund",
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      comment: "Refund amount",
    },
    currency: {
      type: DataTypes.STRING(3),
      defaultValue: "USD",
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Refund reason",
    },
    status: {
      type: DataTypes.ENUM("pending", "processing", "completed", "rejected"),
      defaultValue: "pending",
    },
    refundTransactionId: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: "Refund transaction ID from gateway",
    },
    processedBy: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      comment: "Admin user who processed the refund",
    },
    processedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: "When refund was processed",
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Admin notes",
    },
  },
  {
    sequelize,
    modelName: "PaymentRefund",
    tableName: "payment_refunds",
    timestamps: true,
    indexes: [
      { fields: ["paymentId"] },
      { fields: ["userId"] },
      { fields: ["status"] },
      { fields: ["createdAt"] },
    ],
  }
);

export default PaymentRefund;
