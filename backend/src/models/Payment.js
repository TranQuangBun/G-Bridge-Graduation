import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/database.js";

class Payment extends Model {}

Payment.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      comment: "User who made the payment",
    },
    planId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      comment: "Subscription plan purchased",
    },
    orderId: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      comment: "Internal order ID",
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      comment: "Payment amount",
    },
    currency: {
      type: DataTypes.STRING(3),
      defaultValue: "USD",
      comment: "Currency code",
    },
    status: {
      type: DataTypes.ENUM(
        "pending",
        "processing",
        "completed",
        "failed",
        "refunded",
        "cancelled"
      ),
      defaultValue: "pending",
    },
    paymentMethod: {
      type: DataTypes.ENUM("vnpay", "paypal", "credit_card", "bank_transfer"),
      allowNull: false,
    },
    paymentGateway: {
      type: DataTypes.ENUM("vnpay", "paypal"),
      allowNull: false,
      comment: "Payment gateway used",
    },

    // VNPay specific fields
    vnpayTransactionNo: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: "VNPay transaction number",
    },
    vnpayBankCode: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: "VNPay bank code",
    },
    vnpayCardType: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: "VNPay card type",
    },
    vnpayOrderInfo: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "VNPay order info",
    },
    vnpaySecureHash: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: "VNPay secure hash",
    },

    // PayPal specific fields
    paypalOrderId: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: "PayPal order ID",
    },
    paypalPayerId: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: "PayPal payer ID",
    },
    paypalPaymentId: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: "PayPal payment ID",
    },
    paypalCaptureId: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: "PayPal capture ID",
    },

    // Common fields
    transactionId: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: "Payment gateway transaction ID",
    },
    paymentData: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: "Full payment response data from gateway",
    },
    ipAddress: {
      type: DataTypes.STRING(45),
      allowNull: true,
      comment: "User IP address",
    },
    userAgent: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "User browser agent",
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Payment description",
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Additional notes",
    },

    // Timestamps
    paidAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: "When payment was completed",
    },
    refundedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: "When payment was refunded",
    },
  },
  {
    sequelize,
    modelName: "Payment",
    tableName: "payments",
    timestamps: true,
    indexes: [
      { fields: ["userId"] },
      { fields: ["planId"] },
      { fields: ["orderId"], unique: true },
      { fields: ["status"] },
      { fields: ["paymentGateway"] },
      { fields: ["createdAt"] },
      { fields: ["vnpayTransactionNo"] },
      { fields: ["paypalOrderId"] },
      { fields: ["userId", "status"] },
      { fields: ["paymentGateway", "status"] },
    ],
  }
);

export default Payment;
