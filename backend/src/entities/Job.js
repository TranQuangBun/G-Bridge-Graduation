import { EntitySchema } from "typeorm";
import { Organization } from "./Organization.js";
import { WorkingMode } from "./WorkingMode.js";
import { JobDomain } from "./JobDomain.js";
import { JobRequiredLanguage } from "./JobRequiredLanguage.js";
import { JobRequiredCertificate } from "./JobRequiredCertificate.js";
import { JobApplication } from "./JobApplication.js";
import { SavedJob } from "./SavedJob.js";
import { User } from "./User.js";

export const SalaryType = {
  NEGOTIABLE: "NEGOTIABLE",
  FIXED: "FIXED",
  RANGE: "RANGE",
};

export const JobStatus = {
  OPEN: "open",
  CLOSED: "closed",
  EXPIRED: "expired",
};

export class Job {
  id;
  organizationId;
  workingModeId;
  title;
  province;
  commune;
  address;
  expirationDate;
  quantity;
  descriptions;
  responsibility;
  benefits;
  minSalary;
  maxSalary;
  salaryType;
  contactEmail;
  contactPhone;
  statusOpenStop;
  createdDate;
  createdAt;
  updatedAt;
  reviewStatus;
  reviewerId;
  reviewNotes;
  organization;
  workingMode;
  domains;
  requiredLanguages;
  requiredCertificates;
  applications;
  savedBy;
  reviewer;
}

export const JobSchema = new EntitySchema({
  name: "Job",
  tableName: "jobs",
  target: Job,
  columns: {
    id: {
      type: "int",
      primary: true,
      generated: true,
      unsigned: true,
    },
    organizationId: {
      type: "int",
      unsigned: true,
    },
    workingModeId: {
      type: "int",
      unsigned: true,
    },
    title: {
      type: "varchar",
      length: 255,
    },
    province: {
      type: "varchar",
      length: 100,
      nullable: true,
    },
    commune: {
      type: "varchar",
      length: 100,
      nullable: true,
    },
    address: {
      type: "text",
      nullable: true,
    },
    expirationDate: {
      type: "datetime",
    },
    quantity: {
      type: "int",
      unsigned: true,
      default: 1,
    },
    descriptions: {
      type: "text",
      nullable: true,
    },
    responsibility: {
      type: "text",
      nullable: true,
    },
    benefits: {
      type: "text",
      nullable: true,
    },
    minSalary: {
      type: "decimal",
      precision: 15,
      scale: 2,
      nullable: true,
    },
    maxSalary: {
      type: "decimal",
      precision: 15,
      scale: 2,
      nullable: true,
    },
    salaryType: {
      type: "enum",
      enum: Object.values(SalaryType),
      default: SalaryType.NEGOTIABLE,
    },
    contactEmail: {
      type: "varchar",
      length: 120,
      nullable: true,
    },
    contactPhone: {
      type: "varchar",
      length: 20,
      nullable: true,
    },
    statusOpenStop: {
      type: "enum",
      enum: Object.values(JobStatus),
      default: JobStatus.OPEN,
    },
    reviewStatus: {
      type: "enum",
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    reviewerId: {
      type: "int",
      unsigned: true,
      nullable: true,
    },
    reviewNotes: {
      type: "text",
      nullable: true,
    },
    createdDate: {
      type: "datetime",
      default: () => "CURRENT_TIMESTAMP",
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
      name: "IDX_jobs_organizationId",
      columns: ["organizationId"],
    },
    {
      name: "IDX_jobs_workingModeId",
      columns: ["workingModeId"],
    },
    {
      name: "IDX_jobs_statusOpenStop",
      columns: ["statusOpenStop"],
    },
    {
      name: "IDX_jobs_expirationDate",
      columns: ["expirationDate"],
    },
    {
      name: "IDX_jobs_createdDate",
      columns: ["createdDate"],
    },
    {
      name: "IDX_jobs_province",
      columns: ["province"],
    },
    {
      name: "IDX_jobs_reviewStatus",
      columns: ["reviewStatus"],
    },
  ],
  relations: {
    organization: {
      type: "many-to-one",
      target: () => Organization,
      inverseSide: "jobs",
      joinColumn: {
        name: "organizationId",
      },
      onDelete: "CASCADE",
    },
    workingMode: {
      type: "many-to-one",
      target: () => WorkingMode,
      inverseSide: "jobs",
      joinColumn: {
        name: "workingModeId",
      },
      onDelete: "RESTRICT",
    },
    domains: {
      type: "one-to-many",
      target: () => JobDomain,
      inverseSide: "job",
    },
    requiredLanguages: {
      type: "one-to-many",
      target: () => JobRequiredLanguage,
      inverseSide: "job",
    },
    requiredCertificates: {
      type: "one-to-many",
      target: () => JobRequiredCertificate,
      inverseSide: "job",
    },
    applications: {
      type: "one-to-many",
      target: () => JobApplication,
      inverseSide: "job",
    },
    savedBy: {
      type: "one-to-many",
      target: () => SavedJob,
      inverseSide: "job",
    },
    reviewer: {
      type: "many-to-one",
      target: () => User,
      joinColumn: {
        name: "reviewerId",
      },
      nullable: true,
      onDelete: "SET NULL",
    },
  },
});
