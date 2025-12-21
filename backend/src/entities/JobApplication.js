import { EntitySchema } from "typeorm";
import { Job } from "./Job.js";
import { User } from "./User.js";
import { ApplicationStatus } from "./ApplicationStatus.js";

// Keep enum for backward compatibility and easy reference
export const ApplicationStatusEnum = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
  WITHDRAWN: "withdrawn",
};

export class JobApplication {
  id;
  jobId;
  interpreterId;
  statusId;
  status; // Keep for backward compatibility - will be populated from statusEntity
  coverLetter;
  resumeUrl;
  resumeType;
  applicationDate;
  reviewedAt;
  reviewNotes;
  completionRequestedBy;
  completionConfirmedBy;
  completedAt;
  createdAt;
  updatedAt;
  job;
  interpreter;
  statusEntity;
}

export const JobApplicationSchema = new EntitySchema({
  name: "JobApplication",
  tableName: "job_applications",
  target: JobApplication,
  columns: {
    id: {
      type: "int",
      primary: true,
      generated: true,
      unsigned: true,
    },
    jobId: {
      type: "int",
      unsigned: true,
    },
    interpreterId: {
      type: "int",
      unsigned: true,
    },
    statusId: {
      type: "int",
      unsigned: true,
      nullable: true, // Allow nullable during sync, will be populated by seed data
    },
    status: {
      type: "varchar",
      length: 50,
      nullable: true,
      // This will be populated from statusEntity.name for backward compatibility
    },
    coverLetter: {
      type: "text",
      nullable: true,
    },
    resumeUrl: {
      type: "text",
      nullable: true,
    },
    resumeType: {
      type: "varchar",
      length: 20,
      nullable: true,
    },
    applicationDate: {
      type: "datetime",
      default: () => "CURRENT_TIMESTAMP",
    },
    reviewedAt: {
      type: "datetime",
      nullable: true,
    },
    reviewNotes: {
      type: "text",
      nullable: true,
    },
    completionRequestedBy: {
      type: "int",
      nullable: true,
    },
    completionConfirmedBy: {
      type: "int",
      nullable: true,
    },
    completedAt: {
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
      name: "IDX_job_applications_jobId",
      columns: ["jobId"],
    },
    {
      name: "IDX_job_applications_interpreterId",
      columns: ["interpreterId"],
    },
    {
      name: "IDX_job_applications_status",
      columns: ["status"],
    },
    {
      name: "IDX_job_applications_applicationDate",
      columns: ["applicationDate"],
    },
    {
      name: "UQ_job_applications_jobId_interpreterId",
      unique: true,
      columns: ["jobId", "interpreterId"],
    },
  ],
  relations: {
    job: {
      type: "many-to-one",
      target: () => Job,
      inverseSide: "applications",
      joinColumn: {
        name: "jobId",
      },
      onDelete: "CASCADE",
    },
    interpreter: {
      type: "many-to-one",
      target: () => User,
      inverseSide: "jobApplications",
      joinColumn: {
        name: "interpreterId",
      },
      onDelete: "CASCADE",
    },
    statusEntity: {
      type: "many-to-one",
      target: () => ApplicationStatus,
      inverseSide: "applications",
      joinColumn: {
        name: "statusId",
      },
      onDelete: "RESTRICT",
    },
  },
});
