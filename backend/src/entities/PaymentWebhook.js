import { EntitySchema } from "typeorm";
import { Payment } from "./Payment.js";
import { PaymentGateway } from "./PaymentConstants.js";

export class PaymentWebhook {
  id;
  paymentId;
  gateway;
  eventType;
  orderId;
  transactionId;
  status;
  rawData;
  ipAddress;
  processed;
  processedAt;
  errorMessage;
  createdAt;
  payment;
}

export const PaymentWebhookSchema = new EntitySchema({
  name: "PaymentWebhook",
  tableName: "payment_webhooks",
  target: PaymentWebhook,
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
      nullable: true,
    },
    gateway: {
      type: "enum",
      enum: Object.values(PaymentGateway),
    },
    eventType: {
      type: "varchar",
      length: 100,
      nullable: true,
    },
    orderId: {
      type: "varchar",
      length: 100,
      nullable: true,
    },
    transactionId: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    status: {
      type: "varchar",
      length: 50,
      nullable: true,
    },
    rawData: {
      type: "json",
    },
    ipAddress: {
      type: "varchar",
      length: 45,
      nullable: true,
    },
    processed: {
      type: "boolean",
      default: false,
    },
    processedAt: {
      type: "datetime",
      nullable: true,
    },
    errorMessage: {
      type: "text",
      nullable: true,
    },
    createdAt: {
      type: "datetime",
      createDate: true,
    },
  },
  indices: [
    {
      name: "IDX_payment_webhooks_paymentId",
      columns: ["paymentId"],
    },
    {
      name: "IDX_payment_webhooks_gateway",
      columns: ["gateway"],
    },
    {
      name: "IDX_payment_webhooks_orderId",
      columns: ["orderId"],
    },
    {
      name: "IDX_payment_webhooks_processed",
      columns: ["processed"],
    },
    {
      name: "IDX_payment_webhooks_createdAt",
      columns: ["createdAt"],
    },
  ],
  relations: {
    payment: {
      type: "many-to-one",
      target: () => Payment,
      inverseSide: "webhooks",
      joinColumn: {
        name: "paymentId",
      },
      onDelete: "SET NULL",
      nullable: true,
    },
  },
});
