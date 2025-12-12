import { EntitySchema } from "typeorm";
import { User } from "./User.js";
import { SubscriptionPlan } from "./SubscriptionPlan.js";
import { UserSubscription } from "./UserSubscription.js";
import { PaymentWebhook } from "./PaymentWebhook.js";
import { PaymentRefund } from "./PaymentRefund.js";
import {
  PaymentStatus,
  PaymentMethodType,
  PaymentGateway,
} from "./PaymentConstants.js";

// Re-export for backward compatibility
export { PaymentStatus, PaymentMethodType, PaymentGateway };

export class Payment {
  id;
  userId;
  planId;
  orderId;
  amount;
  currency;
  status;
  paymentMethod;
  paymentGateway;
  vnpayTransactionNo;
  vnpayBankCode;
  vnpayCardType;
  vnpayOrderInfo;
  vnpaySecureHash;
  paypalOrderId;
  paypalPayerId;
  paypalPaymentId;
  paypalCaptureId;
  momoTransId;
  momoRequestId;
  momoOrderInfo;
  momoPayType;
  momoResultCode;
  momoMessage;
  transactionId;
  paymentData;
  ipAddress;
  userAgent;
  description;
  notes;
  paidAt;
  refundedAt;
  createdAt;
  updatedAt;
  user;
  plan;
  subscription;
  webhooks;
  refunds;
}

export const PaymentSchema = new EntitySchema({
  name: "Payment",
  tableName: "payments",
  target: Payment,
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
    },
    planId: {
      type: "int",
      unsigned: true,
    },
    orderId: {
      type: "varchar",
      length: 100,
      unique: true,
    },
    amount: {
      type: "decimal",
      precision: 10,
      scale: 2,
    },
    currency: {
      type: "varchar",
      length: 3,
      default: "USD",
    },
    status: {
      type: "enum",
      enum: Object.values(PaymentStatus),
      default: PaymentStatus.PENDING,
    },
    paymentMethod: {
      type: "enum",
      enum: Object.values(PaymentMethodType),
    },
    paymentGateway: {
      type: "enum",
      enum: Object.values(PaymentGateway),
    },
    vnpayTransactionNo: {
      type: "varchar",
      length: 100,
      nullable: true,
    },
    vnpayBankCode: {
      type: "varchar",
      length: 50,
      nullable: true,
    },
    vnpayCardType: {
      type: "varchar",
      length: 50,
      nullable: true,
    },
    vnpayOrderInfo: {
      type: "text",
      nullable: true,
    },
    vnpaySecureHash: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    paypalOrderId: {
      type: "varchar",
      length: 100,
      nullable: true,
    },
    momoTransId: {
      type: "varchar",
      length: 100,
      nullable: true,
    },
    momoRequestId: {
      type: "varchar",
      length: 100,
      nullable: true,
    },
    momoOrderInfo: {
      type: "text",
      nullable: true,
    },
    momoPayType: {
      type: "varchar",
      length: 50,
      nullable: true,
    },
    momoResultCode: {
      type: "varchar",
      length: 10,
      nullable: true,
    },
    momoMessage: {
      type: "text",
      nullable: true,
    },
    paypalPayerId: {
      type: "varchar",
      length: 100,
      nullable: true,
    },
    paypalPaymentId: {
      type: "varchar",
      length: 100,
      nullable: true,
    },
    paypalCaptureId: {
      type: "varchar",
      length: 100,
      nullable: true,
    },
    transactionId: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    paymentData: {
      type: "json",
      nullable: true,
    },
    ipAddress: {
      type: "varchar",
      length: 45,
      nullable: true,
    },
    userAgent: {
      type: "text",
      nullable: true,
    },
    description: {
      type: "text",
      nullable: true,
    },
    notes: {
      type: "text",
      nullable: true,
    },
    paidAt: {
      type: "datetime",
      nullable: true,
    },
    refundedAt: {
      type: "datetime",
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
      name: "IDX_payments_userId",
      columns: ["userId"],
    },
    {
      name: "IDX_payments_planId",
      columns: ["planId"],
    },
    {
      name: "UQ_payments_orderId",
      unique: true,
      columns: ["orderId"],
    },
    {
      name: "IDX_payments_status",
      columns: ["status"],
    },
    {
      name: "IDX_payments_paymentGateway",
      columns: ["paymentGateway"],
    },
    {
      name: "IDX_payments_createdAt",
      columns: ["createdAt"],
    },
    {
      name: "IDX_payments_vnpayTransactionNo",
      columns: ["vnpayTransactionNo"],
    },
    {
      name: "IDX_payments_paypalOrderId",
      columns: ["paypalOrderId"],
    },
    {
      name: "IDX_payments_momoTransId",
      columns: ["momoTransId"],
    },
    {
      name: "IDX_payments_momoRequestId",
      columns: ["momoRequestId"],
    },
    {
      name: "IDX_payments_userId_status",
      columns: ["userId", "status"],
    },
    {
      name: "IDX_payments_paymentGateway_status",
      columns: ["paymentGateway", "status"],
    },
  ],
  relations: {
    user: {
      type: "many-to-one",
      target: () => User,
      inverseSide: "payments",
      joinColumn: {
        name: "userId",
      },
      onDelete: "CASCADE",
    },
    plan: {
      type: "many-to-one",
      target: () => SubscriptionPlan,
      inverseSide: "payments",
      joinColumn: {
        name: "planId",
      },
      onDelete: "RESTRICT",
    },
    subscription: {
      type: "one-to-one",
      target: () => UserSubscription,
      inverseSide: "payment",
    },
    webhooks: {
      type: "one-to-many",
      target: () => PaymentWebhook,
      inverseSide: "payment",
    },
    refunds: {
      type: "one-to-many",
      target: () => PaymentRefund,
      inverseSide: "payment",
    },
  },
});
