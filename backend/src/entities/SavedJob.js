import { EntitySchema } from "typeorm";
import { User } from "./User.js";
import { Job } from "./Job.js";

export class SavedJob {
  userId;
  jobId;
  savedDate;
  user;
  job;
}

export const SavedJobSchema = new EntitySchema({
  name: "SavedJob",
  tableName: "saved_jobs",
  target: SavedJob,
  columns: {
    userId: {
      type: "int",
      primary: true,
      unsigned: true,
    },
    jobId: {
      type: "int",
      primary: true,
      unsigned: true,
    },
    savedDate: {
      type: "datetime",
      default: () => "CURRENT_TIMESTAMP",
    },
  },
  indices: [
    {
      name: "IDX_saved_jobs_userId",
      columns: ["userId"],
    },
    {
      name: "IDX_saved_jobs_jobId",
      columns: ["jobId"],
    },
    {
      name: "IDX_saved_jobs_savedDate",
      columns: ["savedDate"],
    },
  ],
  relations: {
    user: {
      type: "many-to-one",
      target: () => User,
      inverseSide: "savedJobs",
      joinColumn: {
        name: "userId",
      },
      onDelete: "CASCADE",
    },
    job: {
      type: "many-to-one",
      target: () => Job,
      inverseSide: "savedBy",
      joinColumn: {
        name: "jobId",
      },
      onDelete: "CASCADE",
    },
  },
});
