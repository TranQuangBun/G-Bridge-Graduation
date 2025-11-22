import { EntitySchema } from "typeorm";
import { Job } from "./Job.js";
import { User } from "./User.js";

export const ApplicationStatus = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
  WITHDRAWN: "withdrawn",
};

export class JobApplication {
  id;
  jobId;
  interpreterId;
  status;
  coverLetter;
  resumeUrl;
  resumeType;
  applicationDate;
  reviewedAt;
  reviewNotes;
  createdAt;
  updatedAt;
  job;
  interpreter;
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
    status: {
      type: "enum",
      enum: Object.values(ApplicationStatus),
      default: ApplicationStatus.PENDING,
    },
    coverLetter: {
      type: "text",
      nullable: true,
    },
    resumeUrl: {
      type: "varchar",
      length: 255,
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
  },
});
