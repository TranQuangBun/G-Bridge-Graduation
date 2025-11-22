import { EntitySchema } from "typeorm";
import { Payment } from "./Payment.js";
import { User } from "./User.js";

export const RefundStatus = {
  PENDING: "pending",
  PROCESSING: "processing",
  COMPLETED: "completed",
  REJECTED: "rejected",
};

export class PaymentRefund {
  id;
  paymentId;
  userId;
  amount;
  currency;
  reason;
  status;
  refundTransactionId;
  processedBy;
  processedAt;
  notes;
  createdAt;
  updatedAt;
  payment;
  user;
  processor;
}

export const PaymentRefundSchema = new EntitySchema({
  name: "PaymentRefund",
  tableName: "payment_refunds",
  target: PaymentRefund,
  columns: {
    id: {
      type: "int",
      primary: true,
      generated: true,
      unsigned: true,
    },
    paymentId: {
      type: "int",
      unsigned: true,
    },
    userId: {
      type: "int",
      unsigned: true,
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
    reason: {
      type: "text",
      nullable: true,
    },
    status: {
      type: "enum",
      enum: Object.values(RefundStatus),
      default: RefundStatus.PENDING,
    },
    refundTransactionId: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    processedBy: {
      type: "int",
      unsigned: true,
      nullable: true,
    },
    processedAt: {
      type: "datetime",
      nullable: true,
    },
    notes: {
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
      name: "IDX_payment_refunds_paymentId",
      columns: ["paymentId"],
    },
    {
      name: "IDX_payment_refunds_userId",
      columns: ["userId"],
    },
    {
      name: "IDX_payment_refunds_status",
      columns: ["status"],
    },
    {
      name: "IDX_payment_refunds_createdAt",
      columns: ["createdAt"],
    },
  ],
  relations: {
    payment: {
      type: "many-to-one",
      target: () => Payment,
      inverseSide: "refunds",
      joinColumn: {
        name: "paymentId",
      },
      onDelete: "RESTRICT",
    },
    user: {
      type: "many-to-one",
      target: () => User,
      inverseSide: "refundRequests",
      joinColumn: {
        name: "userId",
      },
      onDelete: "CASCADE",
    },
    processor: {
      type: "many-to-one",
      target: () => User,
      inverseSide: "processedRefunds",
      joinColumn: {
        name: "processedBy",
      },
      onDelete: "SET NULL",
      nullable: true,
    },
  },
});
