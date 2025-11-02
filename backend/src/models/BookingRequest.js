import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

const BookingRequest = sequelize.define(
  "BookingRequest",
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    // Foreign keys
    clientId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: "Users",
        key: "id",
      },
      field: "client_id",
    },
    interpreterId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: "Users",
        key: "id",
      },
      field: "interpreter_id",
    },

    // Service details
    serviceType: {
      type: DataTypes.ENUM("consecutive", "simultaneous", "escort", "online"),
      allowNull: false,
      field: "service_type",
    },
    bookingType: {
      type: DataTypes.ENUM("online", "offline"),
      allowNull: false,
      defaultValue: "online",
      field: "booking_type",
    },
    location: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },

    // Event duration
    eventDuration: {
      type: DataTypes.ENUM("single", "multiple"),
      allowNull: false,
      defaultValue: "single",
      field: "event_duration",
    },

    // Single day fields
    eventDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: "event_date",
    },
    startTime: {
      type: DataTypes.TIME,
      allowNull: true,
      field: "start_time",
    },
    endTime: {
      type: DataTypes.TIME,
      allowNull: true,
      field: "end_time",
    },

    // Multiple days fields
    startDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: "start_date",
    },
    endDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: "end_date",
    },
    timeRequirement: {
      type: DataTypes.ENUM("fullDay", "halfDay", "eventSchedule", "other"),
      allowNull: true,
      field: "time_requirement",
    },

    // Topic and contact
    topic: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    fullName: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "full_name",
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },

    // Status
    status: {
      type: DataTypes.ENUM(
        "pending",
        "accepted",
        "rejected",
        "completed",
        "cancelled"
      ),
      allowNull: false,
      defaultValue: "pending",
    },

    // Estimated cost
    estimatedCost: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      field: "estimated_cost",
    },
    estimatedHours: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      field: "estimated_hours",
    },

    // Notes from interpreter (optional)
    interpreterNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "interpreter_notes",
    },

    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: "created_at",
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: "updated_at",
    },
  },
  {
    tableName: "booking_requests",
    timestamps: true,
    underscored: true,
  }
);

export default BookingRequest;
