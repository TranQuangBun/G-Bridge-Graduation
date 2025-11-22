import { EntitySchema } from "typeorm";
import { Job } from "./Job.js";
import { Certification } from "./Certification.js";

export class JobRequiredCertificate {
  id;
  jobId;
  certificateId;
  minAchievementDetail;
  job;
  certificate;
}

export const JobRequiredCertificateSchema = new EntitySchema({
  name: "JobRequiredCertificate",
  tableName: "job_required_certificates",
  target: JobRequiredCertificate,
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
    certificateId: {
      type: "int",
      unsigned: true,
    },
    minAchievementDetail: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
  },
  indices: [
    {
      name: "IDX_job_required_certificates_jobId",
      columns: ["jobId"],
    },
    {
      name: "IDX_job_required_certificates_certificateId",
      columns: ["certificateId"],
    },
    {
      name: "UQ_job_required_certificates_jobId_certificateId",
      unique: true,
      columns: ["jobId", "certificateId"],
    },
  ],
  relations: {
    job: {
      type: "many-to-one",
      target: () => Job,
      inverseSide: "requiredCertificates",
      joinColumn: {
        name: "jobId",
      },
      onDelete: "CASCADE",
    },
    certificate: {
      type: "many-to-one",
      target: () => Certification,
      inverseSide: "jobRequirements",
      joinColumn: {
        name: "certificateId",
      },
      onDelete: "CASCADE",
    },
  },
});
