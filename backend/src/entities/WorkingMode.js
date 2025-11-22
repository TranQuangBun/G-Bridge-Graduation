import { EntitySchema } from "typeorm";
import { Job } from "./Job.js";

export class WorkingMode {
  id;
  name;
  nameVi;
  description;
  createdAt;
  updatedAt;
  jobs;
}

export const WorkingModeSchema = new EntitySchema({
  name: "WorkingMode",
  tableName: "working_modes",
  target: WorkingMode,
  columns: {
    id: {
      type: "int",
      primary: true,
      generated: true,
      unsigned: true,
    },
    name: {
      type: "varchar",
      length: 100,
      unique: true,
    },
    nameVi: {
      type: "varchar",
      length: 100,
      nullable: true,
    },
    description: {
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
      name: "IDX_working_modes_name",
      unique: true,
      columns: ["name"],
    },
  ],
  relations: {
    jobs: {
      type: "one-to-many",
      target: () => Job,
      inverseSide: "workingMode",
    },
  },
});
