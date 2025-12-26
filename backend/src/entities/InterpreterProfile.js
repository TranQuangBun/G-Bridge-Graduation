import { EntitySchema } from "typeorm";
import { User } from "./User.js";

export const VerificationStatus = {
  PENDING: "pending",
  VERIFIED: "verified",
  REJECTED: "rejected",
};

export class InterpreterProfile {
  id;
  userId;
  languages;
  specializations;
  experience;
  hourlyRate;
  currency;
  availability;
  certifications;
  portfolio;
  rating;
  totalReviews;
  completedJobs;
  isAvailable;
  verificationStatus;
  profileCompleteness;
  user;
}

export const InterpreterProfileSchema = new EntitySchema({
  name: "InterpreterProfile",
  tableName: "interpreter_profiles",
  target: InterpreterProfile,
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
      unique: true,
    },
    languages: {
      type: "json",
      nullable: true,
    },
    specializations: {
      type: "json",
      nullable: true,
    },
    experience: {
      type: "int",
      nullable: true,
    },
    hourlyRate: {
      type: "decimal",
      precision: 10,
      scale: 2,
      nullable: true,
    },
    currency: {
      type: "varchar",
      length: 3,
      default: "USD",
    },
    availability: {
      type: "json",
      nullable: true,
    },
    certifications: {
      type: "json",
      nullable: true,
    },
    portfolio: {
      type: "text",
      nullable: true,
    },
    rating: {
      type: "decimal",
      precision: 2,
      scale: 1,
      default: 0.0,
    },
    totalReviews: {
      type: "int",
      default: 0,
    },
    completedJobs: {
      type: "int",
      default: 0,
    },
    isAvailable: {
      type: "boolean",
      default: true,
    },
    verificationStatus: {
      type: "enum",
      enum: Object.values(VerificationStatus),
      default: VerificationStatus.PENDING,
    },
    profileCompleteness: {
      type: "int",
      default: 0,
    },
  },
  relations: {
    user: {
      type: "one-to-one",
      target: () => User,
      inverseSide: "interpreterProfile",
      joinColumn: {
        name: "userId",
      },
      onDelete: "CASCADE",
    },
  },
});
