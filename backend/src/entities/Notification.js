import { EntitySchema } from "typeorm";
import { User } from "./User.js";

export const NotificationType = {
  GENERIC: "generic",
  JOB_APPLICATION_SUBMITTED: "job_application_submitted",
  JOB_APPLICATION_STATUS: "job_application_status",
  BOOKING_REQUEST_CREATED: "booking_request_created",
  BOOKING_STATUS_UPDATED: "booking_status_updated",
  PAYMENT_SUCCESS: "payment_success",
  SUBSCRIPTION_EXPIRING: "subscription_expiring",
  JOB_REVIEW_STATUS: "job_review_status",
  CERTIFICATION_APPROVED: "certification_approved",
  CERTIFICATION_REJECTED: "certification_rejected",
  ORGANIZATION_APPROVED: "organization_approved",
  ORGANIZATION_REJECTED: "organization_rejected",
  SYSTEM_NOTIFICATION: "system_notification",
};

export class Notification {
  id;
  recipientId;
  actorId;
  type;
  title;
  message;
  metadata;
  isRead;
  readAt;
  createdAt;
  updatedAt;
  recipient;
  actor;
}

export const NotificationSchema = new EntitySchema({
  name: "Notification",
  tableName: "notifications",
  target: Notification,
  columns: {
    id: {
      type: "int",
      primary: true,
      generated: true,
      unsigned: true,
    },
    recipientId: {
      type: "int",
      unsigned: true,
    },
    actorId: {
      type: "int",
      unsigned: true,
      nullable: true,
    },
    type: {
      type: "enum",
      enum: Object.values(NotificationType),
      default: NotificationType.GENERIC,
    },
    title: {
      type: "varchar",
      length: 200,
    },
    message: {
      type: "text",
      nullable: true,
    },
    metadata: {
      type: "json",
      nullable: true,
    },
    isRead: {
      type: "boolean",
      default: false,
    },
    readAt: {
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
      name: "IDX_notifications_recipient",
      columns: ["recipientId", "isRead"],
    },
    {
      name: "IDX_notifications_type",
      columns: ["type"],
    },
  ],
  relations: {
    recipient: {
      type: "many-to-one",
      target: () => User,
      inverseSide: "notifications",
      joinColumn: {
        name: "recipientId",
      },
      onDelete: "CASCADE",
    },
    actor: {
      type: "many-to-one",
      target: () => User,
      inverseSide: "sentNotifications",
      joinColumn: {
        name: "actorId",
      },
      nullable: true,
      onDelete: "SET NULL",
    },
  },
});


