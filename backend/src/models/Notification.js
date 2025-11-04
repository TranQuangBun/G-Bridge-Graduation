import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

const Notification = sequelize.define(
  "Notification",
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: "Users",
        key: "id",
      },
      onDelete: "CASCADE",
    },
    type: {
      type: DataTypes.ENUM(
        "booking_request", // Company gửi yêu cầu booking
        "booking_accepted", // Interpreter chấp nhận booking
        "booking_rejected", // Interpreter từ chối booking
        "booking_cancelled", // Hủy booking
        "booking_completed", // Hoàn thành booking
        "job_application", // Interpreter apply job
        "application_accepted", // Company chấp nhận application
        "application_rejected", // Company từ chối application
        "new_job_match", // Job mới phù hợp với interpreter
        "payment_success", // Thanh toán thành công
        "payment_failed", // Thanh toán thất bại
        "subscription_expiring", // Subscription sắp hết hạn
        "subscription_expired", // Subscription đã hết hạn
        "profile_incomplete", // Hồ sơ chưa hoàn thiện
        "certification_approved", // Chứng chỉ được duyệt
        "certification_rejected", // Chứng chỉ bị từ chối
        "review_received", // Nhận được đánh giá
        "message_received", // Nhận được tin nhắn
        "system_announcement" // Thông báo hệ thống
      ),
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    data: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: "Additional data related to notification (bookingId, jobId, etc.)",
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    readAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    link: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: "Frontend route to navigate when notification is clicked",
    },
    icon: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: "Icon emoji or class name",
    },
    priority: {
      type: DataTypes.ENUM("low", "normal", "high", "urgent"),
      defaultValue: "normal",
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: "Auto-delete notification after this date",
    },
  },
  {
    tableName: "Notifications",
    timestamps: true,
    indexes: [
      {
        fields: ["userId"],
      },
      {
        fields: ["isRead"],
      },
      {
        fields: ["type"],
      },
      {
        fields: ["createdAt"],
      },
    ],
  }
);

export default Notification;
