import { EntitySchema } from "typeorm";

export class ApplicationStatus {
  id;
  name;
  nameVi;
  description;
  createdAt;
  updatedAt;
  applications;
}

export const ApplicationStatusSchema = new EntitySchema({
  name: "ApplicationStatus",
  tableName: "application_statuses",
  target: ApplicationStatus,
  columns: {
    id: {
      type: "int",
      primary: true,
      generated: true,
      unsigned: true,
    },
    name: {
      type: "varchar",
      length: 50,
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
      name: "IDX_application_statuses_name",
      unique: true,
      columns: ["name"],
    },
  ],
  relations: {
    applications: {
      type: "one-to-many",
      target: "JobApplication",
      inverseSide: "statusEntity",
    },
  },
});

