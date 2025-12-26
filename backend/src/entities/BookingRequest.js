import { EntitySchema } from "typeorm";
import { User } from "./User.js";

export const ServiceType = {
  CONSECUTIVE: "consecutive",
  SIMULTANEOUS: "simultaneous",
  ESCORT: "escort",
  ONLINE: "online",
};

export const BookingType = {
  ONLINE: "online",
  OFFLINE: "offline",
};

export const EventDuration = {
  SINGLE: "single",
  MULTIPLE: "multiple",
};

export const TimeRequirement = {
  FULL_DAY: "fullDay",
  HALF_DAY: "halfDay",
  EVENT_SCHEDULE: "eventSchedule",
  OTHER: "other",
};

export const BookingStatus = {
  PENDING: "pending",
  ACCEPTED: "accepted",
  REJECTED: "rejected",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
};

export class BookingRequest {
  id;
  clientId;
  interpreterId;
  serviceType;
  bookingType;
  location;
  eventDuration;
  eventDate;
  startTime;
  endTime;
  startDate;
  endDate;
  timeRequirement;
  topic;
  fullName;
  email;
  phone;
  status;
  estimatedCost;
  estimatedHours;
  interpreterNotes;
  createdAt;
  updatedAt;
  client;
  interpreter;
}

export const BookingRequestSchema = new EntitySchema({
  name: "BookingRequest",
  tableName: "booking_requests",
  target: BookingRequest,
  columns: {
    id: {
      type: "int",
      primary: true,
      generated: true,
      unsigned: true,
    },
    clientId: {
      type: "int",
      unsigned: true,
    },
    interpreterId: {
      type: "int",
      unsigned: true,
    },
    serviceType: {
      type: "enum",
      enum: Object.values(ServiceType),
    },
    bookingType: {
      type: "enum",
      enum: Object.values(BookingType),
      default: BookingType.ONLINE,
    },
    location: {
      type: "text",
      nullable: true,
    },
    eventDuration: {
      type: "enum",
      enum: Object.values(EventDuration),
      default: EventDuration.SINGLE,
    },
    eventDate: {
      type: "date",
      nullable: true,
    },
    startTime: {
      type: "time",
      nullable: true,
    },
    endTime: {
      type: "time",
      nullable: true,
    },
    startDate: {
      type: "date",
      nullable: true,
    },
    endDate: {
      type: "date",
      nullable: true,
    },
    timeRequirement: {
      type: "enum",
      enum: Object.values(TimeRequirement),
      nullable: true,
    },
    topic: {
      type: "text",
    },
    fullName: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    email: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    phone: {
      type: "varchar",
      length: 20,
      nullable: true,
    },
    status: {
      type: "enum",
      enum: Object.values(BookingStatus),
      default: BookingStatus.PENDING,
    },
    estimatedCost: {
      type: "decimal",
      precision: 10,
      scale: 2,
      nullable: true,
    },
    estimatedHours: {
      type: "decimal",
      precision: 5,
      scale: 2,
      nullable: true,
    },
    interpreterNotes: {
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
      name: "IDX_booking_requests_clientId",
      columns: ["clientId"],
    },
    {
      name: "IDX_booking_requests_interpreterId",
      columns: ["interpreterId"],
    },
    {
      name: "IDX_booking_requests_status",
      columns: ["status"],
    },
    {
      name: "IDX_booking_requests_serviceType",
      columns: ["serviceType"],
    },
    {
      name: "IDX_booking_requests_bookingType",
      columns: ["bookingType"],
    },
    {
      name: "IDX_booking_requests_createdAt",
      columns: ["createdAt"],
    },
  ],
  relations: {
    client: {
      type: "many-to-one",
      target: () => User,
      inverseSide: "sentBookingRequests",
      joinColumn: {
        name: "clientId",
      },
      onDelete: "CASCADE",
    },
    interpreter: {
      type: "many-to-one",
      target: () => User,
      inverseSide: "receivedBookingRequests",
      joinColumn: {
        name: "interpreterId",
      },
      onDelete: "CASCADE",
    },
  },
});
