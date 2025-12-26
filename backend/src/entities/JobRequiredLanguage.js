import { EntitySchema } from "typeorm";
import { Job } from "./Job.js";
import { Language } from "./Language.js";
import { Level } from "./Level.js";

export class JobRequiredLanguage {
  id;
  jobId;
  languageId;
  levelId;
  isSourceLanguage;
  job;
  language;
  level;
}

export const JobRequiredLanguageSchema = new EntitySchema({
  name: "JobRequiredLanguage",
  tableName: "job_required_languages",
  target: JobRequiredLanguage,
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
    languageId: {
      type: "int",
      unsigned: true,
    },
    levelId: {
      type: "int",
      unsigned: true,
    },
    isSourceLanguage: {
      type: "boolean",
      default: false,
    },
  },
  indices: [
    {
      name: "IDX_job_required_languages_jobId",
      columns: ["jobId"],
    },
    {
      name: "IDX_job_required_languages_languageId",
      columns: ["languageId"],
    },
    {
      name: "IDX_job_required_languages_levelId",
      columns: ["levelId"],
    },
    {
      name: "UQ_job_required_languages_jobId_languageId",
      unique: true,
      columns: ["jobId", "languageId"],
    },
  ],
  relations: {
    job: {
      type: "many-to-one",
      target: () => Job,
      inverseSide: "requiredLanguages",
      joinColumn: {
        name: "jobId",
      },
      onDelete: "CASCADE",
    },
    language: {
      type: "many-to-one",
      target: () => Language,
      inverseSide: "jobRequirements",
      joinColumn: {
        name: "languageId",
      },
      onDelete: "CASCADE",
    },
    level: {
      type: "many-to-one",
      target: () => Level,
      inverseSide: "jobRequirements",
      joinColumn: {
        name: "levelId",
      },
      onDelete: "RESTRICT",
    },
  },
});
