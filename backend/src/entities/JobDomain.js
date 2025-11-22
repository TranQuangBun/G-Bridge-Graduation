import { EntitySchema } from "typeorm";
import { Job } from "./Job.js";
import { Domain } from "./Domain.js";

export class JobDomain {
  jobId;
  domainId;
  job;
  domain;
}

export const JobDomainSchema = new EntitySchema({
  name: "JobDomain",
  tableName: "job_has_domains",
  target: JobDomain,
  columns: {
    jobId: {
      type: "int",
      primary: true,
      unsigned: true,
    },
    domainId: {
      type: "int",
      primary: true,
      unsigned: true,
    },
  },
  indices: [
    {
      name: "IDX_job_domains_jobId",
      columns: ["jobId"],
    },
    {
      name: "IDX_job_domains_domainId",
      columns: ["domainId"],
    },
  ],
  relations: {
    job: {
      type: "many-to-one",
      target: () => Job,
      inverseSide: "domains",
      joinColumn: {
        name: "jobId",
      },
      onDelete: "CASCADE",
    },
    domain: {
      type: "many-to-one",
      target: () => Domain,
      inverseSide: "jobs",
      joinColumn: {
        name: "domainId",
      },
      onDelete: "CASCADE",
    },
  },
});
