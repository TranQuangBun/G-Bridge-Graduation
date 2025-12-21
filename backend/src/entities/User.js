import { EntitySchema } from "typeorm";
import { InterpreterProfile } from "./InterpreterProfile.js";
import { ClientProfile } from "./ClientProfile.js";
import { Language } from "./Language.js";
import { Certification } from "./Certification.js";
import { JobApplication } from "./JobApplication.js";
import { SavedJob } from "./SavedJob.js";
import { SavedInterpreter } from "./SavedInterpreter.js";
import { BookingRequest } from "./BookingRequest.js";
import { Payment } from "./Payment.js";
import { UserSubscription } from "./UserSubscription.js";
import { PaymentRefund } from "./PaymentRefund.js";
import { Organization } from "./Organization.js";
import { Notification } from "./Notification.js";

export const UserRole = {
  ADMIN: "admin",
  CLIENT: "client",
  INTERPRETER: "interpreter",
};

export class User {
  id;
  fullName;
  email;
  passwordHash;
  role;
  phone;
  address;
  avatar;
  isActive;
  isVerified;
  isPremium;
  premiumExpiresAt;
  lastLoginAt;
  resetPasswordToken;
  resetPasswordExpiry;
  createdAt;
  updatedAt;
  interpreterProfile;
  clientProfile;
  languages;
  certifications;
  jobApplications;
  savedJobs;
  savedInterpreters;
  savedByUsers;
  sentBookingRequests;
  receivedBookingRequests;
  payments;
  activeSubscription;
  refundRequests;
  processedRefunds;
  notifications;
  sentNotifications;
  organizations;
}

export const UserSchema = new EntitySchema({
  name: "User",
  tableName: "users",
  target: User,
  columns: {
    id: {
      type: "int",
      primary: true,
      generated: true,
      unsigned: true,
    },
    fullName: {
      type: "varchar",
      length: 100,
    },
    email: {
      type: "varchar",
      length: 120,
      unique: true,
    },
    passwordHash: {
      type: "text",
    },
    role: {
      type: "enum",
      enum: Object.values(UserRole),
      default: UserRole.INTERPRETER,
    },
    phone: {
      type: "varchar",
      length: 20,
      nullable: true,
    },
    address: {
      type: "text",
      nullable: true,
    },
    avatar: {
      type: "text",
      nullable: true,
    },
    isActive: {
      type: "boolean",
      default: true,
    },
    isVerified: {
      type: "boolean",
      default: false,
    },
    isPremium: {
      type: "boolean",
      default: false,
    },
    premiumExpiresAt: {
      type: "datetime",
      nullable: true,
    },
    lastLoginAt: {
      type: "datetime",
      nullable: true,
    },
    resetPasswordToken: {
      type: "text",
      nullable: true,
    },
    resetPasswordExpiry: {
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
  relations: {
    interpreterProfile: {
      type: "one-to-one",
      target: () => InterpreterProfile,
      inverseSide: "user",
      cascade: true,
    },
    clientProfile: {
      type: "one-to-one",
      target: () => ClientProfile,
      inverseSide: "user",
      cascade: true,
    },
    languages: {
      type: "one-to-many",
      target: () => Language,
      inverseSide: "user",
      cascade: true,
    },
    certifications: {
      type: "one-to-many",
      target: () => Certification,
      inverseSide: "user",
      cascade: true,
    },
    jobApplications: {
      type: "one-to-many",
      target: () => JobApplication,
      inverseSide: "interpreter",
    },
    savedJobs: {
      type: "one-to-many",
      target: () => SavedJob,
      inverseSide: "user",
    },
    savedInterpreters: {
      type: "one-to-many",
      target: () => SavedInterpreter,
      inverseSide: "user",
    },
    savedByUsers: {
      type: "one-to-many",
      target: () => SavedInterpreter,
      inverseSide: "interpreter",
    },
    sentBookingRequests: {
      type: "one-to-many",
      target: () => BookingRequest,
      inverseSide: "client",
    },
    receivedBookingRequests: {
      type: "one-to-many",
      target: () => BookingRequest,
      inverseSide: "interpreter",
    },
    payments: {
      type: "one-to-many",
      target: () => Payment,
      inverseSide: "user",
      cascade: true,
    },
    activeSubscription: {
      type: "one-to-one",
      target: () => UserSubscription,
      inverseSide: "user",
    },
    refundRequests: {
      type: "one-to-many",
      target: () => PaymentRefund,
      inverseSide: "user",
    },
    processedRefunds: {
      type: "one-to-many",
      target: () => PaymentRefund,
      inverseSide: "processor",
    },
    notifications: {
      type: "one-to-many",
      target: () => Notification,
      inverseSide: "recipient",
    },
    sentNotifications: {
      type: "one-to-many",
      target: () => Notification,
      inverseSide: "actor",
    },
    organizations: {
      type: "one-to-many",
      target: () => Organization,
      inverseSide: "owner",
    },
  },
});
