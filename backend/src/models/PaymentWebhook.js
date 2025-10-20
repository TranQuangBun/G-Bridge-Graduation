import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/database.js";

class PaymentWebhook extends Model {}

PaymentWebhook.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    paymentId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      comment: "Related payment ID if found",
    },
    gateway: {
      type: DataTypes.ENUM("vnpay", "paypal"),
      allowNull: false,
      comment: "Payment gateway",
    },
    eventType: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: "Webhook event type",
    },
    orderId: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: "Order ID from webhook",
    },
    transactionId: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: "Transaction ID from webhook",
    },
    status: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: "Status from webhook",
    },
    rawData: {
      type: DataTypes.JSON,
      allowNull: false,
      comment: "Full webhook payload",
    },
    ipAddress: {
      type: DataTypes.STRING(45),
      allowNull: true,
      comment: "Webhook sender IP",
    },
    processed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: "Has this webhook been processed",
    },
    processedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: "When webhook was processed",
    },
    errorMessage: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Error if processing failed",
    },
  },
  {
    sequelize,
    modelName: "PaymentWebhook",
    tableName: "payment_webhooks",
    timestamps: true,
    updatedAt: false,
    indexes: [
      { fields: ["paymentId"] },
      { fields: ["gateway"] },
      { fields: ["orderId"] },
      { fields: ["processed"] },
      { fields: ["createdAt"] },
    ],
  }
);

export default PaymentWebhook;
